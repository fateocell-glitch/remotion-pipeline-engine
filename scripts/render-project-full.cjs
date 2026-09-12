"use strict";

const {existsSync} = require("node:fs");
const {mkdir, readFile, rename, writeFile} = require("node:fs/promises");
const {dirname, join, resolve} = require("node:path");
const {spawn} = require("node:child_process");
const {currentAssetPath, renderContentHash, updateBeatRender} = require("./project-render-assets.cjs");

const root = process.cwd();
const [projectFileArg, outputArg] = process.argv.slice(2);
const progressPrefix = "FULL_PROGRESS ";

const emitProgress = (payload) => process.stdout.write(progressPrefix + JSON.stringify(payload) + "\n");

const frameProgressFromOutput = (text) => {
  const match = String(text).match(/(?:rendered|rendering|frames?)[^\d]*(\d+)\s*\/\s*(\d+)/i)
    || String(text).match(/(\d+)\s*\/\s*(\d+)\s*(?:frames?|fr)/i);
  if (!match) return null;
  const completed = Number(match[1]);
  const total = Number(match[2]);
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) return null;
  return {completed: Math.max(0, Math.min(total, completed)), total};
};

const run = (command, args, {onStdout = () => {}} = {}) => new Promise((resolveRun, rejectRun) => {
  const child = spawn(command, args, {cwd: root, windowsHide: true, shell: true});
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    const output = String(chunk);
    process.stdout.write(output);
    onStdout(output);
  });
  child.stderr.on("data", (chunk) => stderr = (stderr + String(chunk)).slice(-8000));
  child.on("error", rejectRun);
  child.on("close", (code) => code === 0 ? resolveRun() : rejectRun(new Error(command + " exited with " + code + "\n" + stderr)));
});

const writeAtomic = async (file, project) => {
  const temp = file + ".tmp-" + process.pid + "-" + Date.now();
  await writeFile(temp, JSON.stringify(project, null, 2) + "\n");
  await rename(temp, file);
};

const cacheWeightedProgress = (cachedBeats, totalBeats) => totalBeats ? Math.round(5 + cachedBeats / totalBeats * 75) : 5;

const overallForBeat = (cachedBeats, totalBeats, index, currentProgress = 0) => {
  const completed = cachedBeats + index + Math.max(0, Math.min(100, currentProgress)) / 100;
  return Math.max(5, Math.min(80, Math.round(5 + completed / Math.max(1, totalBeats) * 75)));
};

const main = async () => {
  if (!projectFileArg || !outputArg) throw new Error("Usage: node scripts/render-project-full.cjs <project.json> <output.mp4>");
  const projectFile = resolve(root, projectFileArg);
  const output = resolve(root, outputArg);
  let project = JSON.parse(await readFile(projectFile, "utf8"));
  const pending = project.beats.filter((beat) => beat.render?.status !== "ready" || !beat.render?.previewPath || !existsSync(join(root, beat.render.previewPath)));
  const reused = project.beats.length - pending.length;
  const base = {totalBeats: project.beats.length, cachedBeats: reused, pendingBeats: pending.length};

  emitProgress({...base, stage: "checking_cache", currentBeatIndex: 0, currentBeatId: null, currentBeatProgress: 0, overallProgress: cacheWeightedProgress(reused, project.beats.length), message: "正在检查单拍缓存：已复用 " + reused + " / " + project.beats.length});
  console.log("FULL_RENDER_PLAN reused=" + reused + " pending=" + pending.length);

  for (let index = 0; index < pending.length; index += 1) {
    const beat = pending[index];
    const revision = Math.max(1, Number(beat.render?.revision || 1));
    const relativeOutput = currentAssetPath(project.projectId, beat);
    const target = join(root, relativeOutput);
    const startFrame = Math.floor(beat.start * project.fps);
    const endFrame = Math.ceil(beat.end * project.fps) - 1;
    const totalFrames = Math.max(1, endFrame - startFrame + 1);
    const running = (currentBeatProgress = 0, frameLabel = "") => emitProgress({...base, stage: "rendering_beats", currentBeatIndex: index + 1, currentBeatId: beat.id, currentBeatProgress, overallProgress: overallForBeat(reused, project.beats.length, index, currentBeatProgress), message: "正在渲染待补拍: " + beat.id + " (" + (index + 1) + "/" + pending.length + ")" + frameLabel});

    await mkdir(dirname(target), {recursive: true});
    running(0);
    console.log("FULL_RENDER_BEAT " + (index + 1) + "/" + pending.length + " " + beat.id);
    await run(join(root, "node_modules", ".bin", "remotion.CMD"), ["render", "src/index.ts", "ProjectEditor", target, "--props=" + projectFile, "--frames=" + startFrame + "-" + endFrame, "--codec=h264", "--crf=20", "--pixel-format=yuv420p", "--concurrency=2", "--x264-preset=veryfast"], {
      onStdout: (output) => {
        const frame = frameProgressFromOutput(output);
        if (!frame) return;
        const percent = Math.round(frame.completed / frame.total * 100);
        running(percent, " · 帧 " + frame.completed + "/" + frame.total);
      },
    });
    const contentHash = renderContentHash(project, beat);
    project = updateBeatRender(project, beat.id, revision, {status: "ready", previewPath: relativeOutput, renderedVideoPath: relativeOutput, contentHash, renderedAt: new Date().toISOString(), error: null});
    await writeAtomic(projectFile, project);
    running(100, " · 帧 " + totalFrames + "/" + totalFrames);
  }

  project.render = {...project.render, status: "stale", progress: 88, outputPath: null, renderedAt: null, error: null};
  await writeAtomic(projectFile, project);
  emitProgress({...base, stage: "concatenating", currentBeatIndex: pending.length, currentBeatId: null, currentBeatProgress: 100, overallProgress: Math.max(84, cacheWeightedProgress(project.beats.length, project.beats.length)), message: "正在拼接 " + project.beats.length + " 个单拍视频…"});
  console.log("FULL_ASSEMBLY_START reused=" + reused + " rendered=" + pending.length);
  await run(process.execPath, [join(root, "scripts", "assemble-project-previews.cjs"), projectFile, output], {
    onStdout: (output) => {
      if (output.includes("ASSEMBLY_STAGE concatenating")) emitProgress({...base, stage: "concatenating", currentBeatIndex: pending.length, currentBeatId: null, currentBeatProgress: 100, overallProgress: 90, message: "正在无损拼接单拍视频…"});
      if (output.includes("ASSEMBLY_STAGE injecting_audio_subs")) emitProgress({...base, stage: "injecting_audio_subs", currentBeatIndex: pending.length, currentBeatId: null, currentBeatProgress: 100, overallProgress: 96, message: "正在封装原始音频与字幕画面…"});
    },
  });
  emitProgress({...base, stage: "done", currentBeatIndex: pending.length, currentBeatId: null, currentBeatProgress: 100, overallProgress: 100, message: "全片合成完成"});
};

main().catch((error) => { process.stderr.write((error.stack || error.message) + "\n"); process.exitCode = 1; });
