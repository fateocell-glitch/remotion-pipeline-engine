"use strict";

const {existsSync} = require("node:fs");
const {readFile, writeFile, rename, mkdir} = require("node:fs/promises");
const {dirname, join} = require("node:path");
const {spawn} = require("node:child_process");
const {projectPaths} = require("./project-store.cjs");
const {createLogger} = require("../utils/logger.cjs");
const {ensureProjectLifecycle, updateBeatRender} = require("../project-render-assets.cjs");
const {shouldAbortForStall, diagnoseRenderFailure} = require("./beat-render-guard.cjs");

const root = process.cwd();
const spec = JSON.parse(process.argv[2] || "{}");
const required = ["projectId", "beatId", "jobId", "relativeOutput", "frames"];
for (const key of required) {
  if (!String(spec[key] ?? "").trim()) throw new Error("Missing render-worker argument: " + key);
}

const logger = createLogger({root});
const projectFile = projectPaths(root, spec.projectId).projectFile;
let writeSerial = 0;
let settled = false;
let writeQueue = Promise.resolve();

const writeProjectAtomically = async (project) => {
  const temporary = projectFile + ".worker-" + process.pid + "-" + Date.now() + "-" + (++writeSerial);
  await writeFile(temporary, JSON.stringify(project, null, 2) + "\n");
  await rename(temporary, projectFile);
};

const loadProject = async () => ensureProjectLifecycle(JSON.parse(await readFile(projectFile, "utf8")));
const patchBeatRender = async (patch) => {
  const project = await loadProject();
  const next = updateBeatRender(project, spec.beatId, Number(spec.revision), patch);
  await writeProjectAtomically(next);
  return next;
};
const queuePatch = (patch) => {
  writeQueue = writeQueue.then(() => patchBeatRender(patch));
  return writeQueue;
};
const terminateProcessTree = (child) => {
  if (!child) return;
  if (process.platform === "win32" && child.pid) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {windowsHide: true}).unref();
    return;
  }
  child.kill();
};
const sampleCpuSeconds = (pid) => new Promise((resolve) => {
  if (process.platform !== "win32" || !pid) return resolve(null);
  const cpu = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "(Get-Process -Id " + pid + " -ErrorAction SilentlyContinue).CPU"], {windowsHide: true});
  let output = "";
  cpu.stdout.on("data", (chunk) => { output += String(chunk); });
  cpu.on("close", () => { const value = Number.parseFloat(output); resolve(Number.isFinite(value) ? value : null); });
  cpu.on("error", () => resolve(null));
});

const runAttempt = async (attempt) => {
  const command = "remotion render src/index.ts ProjectEditor " + join(root, spec.relativeOutput) + " --frames=" + spec.frames;
  const args = ["render", "src/index.ts", "ProjectEditor", join(root, spec.relativeOutput), "--props=" + projectFile, "--frames=" + spec.frames, "--codec=h264", "--crf=20", "--pixel-format=yuv420p", "--concurrency=2", "--x264-preset=veryfast"];
  const child = spawn(join(root, "node_modules", ".bin", "remotion.CMD"), args, {cwd: root, windowsHide: true, shell: true});
  let log = "";
  let lastFrame = 0;
  let lastFrameAt = Date.now();
  let lastProgressAt = Date.now();
  let lastPersistAt = 0;
  let previousCpuSeconds = null;
  let stalled = false;
  let sampling = false;
  await patchBeatRender({status: "rendering", jobId: spec.jobId, workerPid: process.pid, rendererPid: child.pid, startedAt: spec.startedAt, currentFrame: 0, totalFrames: Number(spec.totalFrames) || 0, progress: 0, percentage: 0, message: "正在初始化单拍渲染...", error: null});

  const watchdog = setInterval(async () => {
    if (settled || stalled || sampling) return;
    sampling = true;
    const currentCpuSeconds = await sampleCpuSeconds(child.pid);
    sampling = false;
    if (shouldAbortForStall({now: Date.now(), lastProgressAt, previousCpuSeconds, currentCpuSeconds, stallMs: 45000})) {
      stalled = true;
      await queuePatch({status: "rendering", jobId: spec.jobId, workerPid: process.pid, rendererPid: child.pid, message: "45 秒无新增帧输出，正在启动自动恢复..."});
      await logger.error({traceId: spec.jobId, projectId: spec.projectId, stage: "RENDER_BEAT", beatId: spec.beatId, frames: spec.frames, message: "single-beat-watchdog-stalled", errorStack: log, command, context: {attempt, previousCpuSeconds, currentCpuSeconds}});
      terminateProcessTree(child);
      return;
    }
    if (Number.isFinite(currentCpuSeconds)) previousCpuSeconds = currentCpuSeconds;
  }, 5000);

  child.stdout.on("data", (chunk) => {
    if (settled || stalled) return;
    const output = String(chunk);
    log = (log + output).slice(-8000);
    const match = output.match(/(?:rendered|rendering|frames?)[^\d]*(\d+)\s*\/\s*(\d+)/i) || output.match(/(\d+)\s*\/\s*(\d+)\s*(?:frames?|fr)/i);
    if (!match) return;
    const currentFrame = Number(match[1]);
    const totalFrames = Number(match[2]);
    const now = Date.now();
    if (currentFrame > lastFrame) lastProgressAt = now;
    const fps = Math.max(0, (currentFrame - lastFrame) / Math.max(.1, (now - lastFrameAt) / 1000));
    lastFrame = currentFrame;
    lastFrameAt = now;
    if (now - lastPersistAt < 500 && currentFrame < totalFrames) return;
    lastPersistAt = now;
    const percentage = Math.min(99, Math.floor(currentFrame / Math.max(1, totalFrames) * 100));
    const elapsedSeconds = Math.max(0, Math.floor((now - Date.parse(spec.startedAt)) / 1000));
    const remainingSeconds = fps > 0 ? Math.max(0, Math.round((totalFrames - currentFrame) / fps)) : null;
    queuePatch({status: "rendering", jobId: spec.jobId, workerPid: process.pid, rendererPid: child.pid, currentFrame, totalFrames, progress: percentage, percentage, fps: Math.round(fps), elapsedSeconds, remainingSeconds, message: "正在生成帧: " + currentFrame + " / " + totalFrames});
  });
  child.stderr.on("data", (chunk) => { log = (log + String(chunk)).slice(-8000); });
  child.on("error", async (error) => {
    clearInterval(watchdog);
    if (settled) return;
    settled = true;
    await writeQueue;
    const message = "单拍渲染失败";
    const detail = error.stack || error.message || String(error);
    await patchBeatRender({status: "failed", jobId: spec.jobId, workerPid: null, rendererPid: null, previewPath: null, renderedAt: null, error: detail, message});
    await logger.error({traceId: spec.jobId, projectId: spec.projectId, stage: "RENDER_BEAT", beatId: spec.beatId, frames: spec.frames, message: "single-beat-render-failed", errorStack: detail, command});
  });
  child.on("close", async (code) => {
    clearInterval(watchdog);
    if (settled) return;
    if (stalled && attempt < 1) {
      await queuePatch({status: "rendering", jobId: spec.jobId, workerPid: process.pid, rendererPid: null, message: "检测到静默卡死，正在自动重试（1/1）..."});
      await logger.info({traceId: spec.jobId, projectId: spec.projectId, stage: "RENDER_BEAT", beatId: spec.beatId, frames: spec.frames, message: "single-beat-watchdog-retry", command, context: {attempt: attempt + 1}});
      return runAttempt(attempt + 1);
    }
    settled = true;
    await writeQueue;
    if (code === 0 && existsSync(join(root, spec.relativeOutput))) {
      await patchBeatRender({status: "ready", jobId: spec.jobId, workerPid: null, rendererPid: null, previewPath: spec.relativeOutput, renderedVideoPath: spec.relativeOutput, contentHash: spec.contentHash, renderedAt: new Date().toISOString(), error: null, currentFrame: Number(spec.totalFrames) || lastFrame, totalFrames: Number(spec.totalFrames) || lastFrame, progress: 100, percentage: 100, message: "当前 beat 预览完成"});
      await logger.info({traceId: spec.jobId, projectId: spec.projectId, stage: "RENDER_BEAT", beatId: spec.beatId, frames: spec.frames, message: "single-beat-render-completed", command, context: {output: spec.relativeOutput, revision: spec.revision, attempt}});
      return;
    }
    const detail = stalled ? "连续 45 秒无新增帧，自动重试后仍失败。\n" + log : (log || "Remotion exited with " + code);
    const message = diagnoseRenderFailure(log);
    await patchBeatRender({status: "failed", jobId: spec.jobId, workerPid: null, rendererPid: null, previewPath: null, renderedAt: null, error: detail, message, progress: 0, percentage: 0});
    await logger.error({traceId: spec.jobId, projectId: spec.projectId, stage: "RENDER_BEAT", beatId: spec.beatId, frames: spec.frames, message: "single-beat-render-failed", errorStack: detail, command});
  });
};

(async () => {
  const project = await loadProject();
  const beat = project.beats.find((item) => item.id === spec.beatId);
  if (!beat) throw new Error("Unknown beat: " + spec.beatId);
  if (Number(beat.render?.revision) !== Number(spec.revision)) return;
  await mkdir(dirname(join(root, spec.relativeOutput)), {recursive: true});
  await logger.info({traceId: spec.jobId, projectId: spec.projectId, stage: "RENDER_BEAT", beatId: spec.beatId, frames: spec.frames, message: "single-beat-worker-started", context: {revision: spec.revision, workerPid: process.pid}});
  await runAttempt(0);
})().catch(async (error) => {
  const detail = error.stack || error.message || String(error);
  try {
    await patchBeatRender({status: "failed", jobId: spec.jobId, workerPid: null, rendererPid: null, previewPath: null, renderedAt: null, error: detail, message: "单拍渲染失败"});
    await logger.error({traceId: spec.jobId, projectId: spec.projectId, stage: "RENDER_BEAT", beatId: spec.beatId, frames: spec.frames, message: "single-beat-render-failed", errorStack: detail});
  } finally {
    process.exitCode = 1;
  }
});