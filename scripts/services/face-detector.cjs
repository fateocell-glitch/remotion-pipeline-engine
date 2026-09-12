"use strict";

const {createHash} = require("node:crypto");
const {existsSync, statSync} = require("node:fs");
const {join} = require("node:path");
const {spawn} = require("node:child_process");
const {toSpawnSpec} = require("../local-command.cjs");

const DETECTOR_VERSION = "yunet-v1";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rounded = (value) => Number(Number(value).toFixed(4));

function faceZoneFromDetections(detections, width, height, context = {}) {
  const source = Array.isArray(detections) ? detections : [];
  const primary = source.filter((entry) => Number(entry?.w) > 0 && Number(entry?.h) > 0).sort((left, right) => Number(right.w) * Number(right.h) - Number(left.w) * Number(left.h))[0];
  if (!primary || !(width > 0) || !(height > 0)) return null;
  const faceX = clamp(Number(primary.x) / width, 0, 1);
  const faceY = clamp(Number(primary.y) / height, 0, 1);
  const faceW = clamp(Number(primary.w) / width, 0, 1);
  const faceH = clamp(Number(primary.h) / height, 0, 1);
  const padX = Math.max(.045, faceW * .18);
  const padY = Math.max(.045, faceH * .14);
  const centerX = faceX + faceW / 2;
  return {
    faceX: rounded(faceX), faceY: rounded(faceY), faceW: rounded(faceW), faceH: rounded(faceH),
    safeX: rounded(clamp(faceX - padX, 0, 1)), safeY: rounded(clamp(faceY - padY, 0, 1)),
    safeW: rounded(clamp(faceW + padX * 2, 0, 1)), safeH: rounded(clamp(faceH + padY * 2, 0, 1)),
    faceArea: centerX < .34 ? "left" : centerX > .66 ? "right" : "center",
    confidence: rounded(Number(primary.score) || 0), detectorVersion: DETECTOR_VERSION,
    sourceFingerprint: String(context.sourceFingerprint || ""), beatStart: Number(context.beatStart), beatEnd: Number(context.beatEnd), sampledAt: Number(context.sampledAt),
  };
}

function isFaceZoneCacheValid(zone, context) {
  return Boolean(zone && zone.detectorVersion === DETECTOR_VERSION && zone.sourceFingerprint && zone.sourceFingerprint === context.sourceFingerprint && Number(zone.beatStart) === Number(context.beatStart) && Number(zone.beatEnd) === Number(context.beatEnd));
}

function sourceFingerprint(videoPath) {
  try { const info = statSync(videoPath); return createHash("sha1").update(String(videoPath) + ":" + info.size + ":" + info.mtimeMs).digest("hex"); } catch { return ""; }
}

function pythonSpec(root) {
  const script = join(root, "scripts", "services", "face-detector.py");
  if (process.env.FACE_DETECTOR_PYTHON) return {command: process.env.FACE_DETECTOR_PYTHON, args: [script]};
  const codexPython = join(process.env.USERPROFILE || "", ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe");
  if (existsSync(codexPython)) return {command: codexPython, args: [script]};
  return {command: process.platform === "win32" ? "py" : "python3", args: process.platform === "win32" ? ["-3", script] : [script]};
}

function ffmpegSpawnSpec(remotion, args, platform = process.platform) { return toSpawnSpec(remotion, args, platform); }

function extractFrame(root, videoPath, sampledAt, timeoutMs = 18000) {
  return new Promise((resolve) => {
    const remotion = join(root, "node_modules", ".bin", process.platform === "win32" ? "remotion.CMD" : "remotion");
    const args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", String(sampledAt), "-i", videoPath, "-vframes", "1", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"];
    const spec = ffmpegSpawnSpec(remotion, args);
    const child = spawn(spec.command, spec.args, {cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "ignore"], ...spec.options});
    const chunks = [];
    let settled = false;
    const finish = (value) => { if (settled) return; settled = true; clearTimeout(timer); resolve(value); };
    const timer = setTimeout(() => { try { child.kill(); } catch {} finish(null); }, timeoutMs);
    child.on("error", () => finish(null));
    child.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    child.on("close", (code) => finish(code === 0 && chunks.length ? Buffer.concat(chunks) : null));
  });
}

async function callDetector(root, payload, timeoutMs = 30000) {
  const frame = await extractFrame(root, payload.videoPath, payload.sampledAt);
  if (!frame) return null;
  return new Promise((resolve) => {
    const spec = pythonSpec(root);
    const child = spawn(spec.command, spec.args, {cwd: root, windowsHide: true, stdio: ["pipe", "pipe", "pipe"]});
    let stdout = "";
    let settled = false;
    const finish = (value) => { if (settled) return; settled = true; clearTimeout(timer); resolve(value); };
    const timer = setTimeout(() => { try { child.kill(); } catch {} finish(null); }, timeoutMs);
    child.on("error", () => finish(null));
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.on("close", () => { try { const parsed = JSON.parse(stdout.trim()); finish(parsed?.faceZone || null); } catch { finish(null); } });
    try { child.stdin.end(JSON.stringify({...payload, frameBase64: frame.toString("base64")})); } catch { finish(null); }
  });
}

async function detectProjectFaceZones({root = process.cwd(), project, videoPath, onProgress}) {
  if (!project || !Array.isArray(project.beats) || !videoPath || !existsSync(videoPath)) return {project, detected: 0, cached: 0, unavailable: true};
  const fingerprint = sourceFingerprint(videoPath);
  if (!fingerprint) return {project, detected: 0, cached: 0, unavailable: true};
  let detected = 0, cached = 0;
  const beats = [];
  for (let index = 0; index < project.beats.length; index += 1) {
    const beat = project.beats[index];
    const context = {sourceFingerprint: fingerprint, beatStart: Number(beat.start), beatEnd: Number(beat.end), sampledAt: Number(((Number(beat.start) + Number(beat.end)) / 2).toFixed(3))};
    if (isFaceZoneCacheValid(beat.faceZone, context)) { cached += 1; beats.push(beat); continue; }
    onProgress?.({stage: "face_detection", currentBeatId: beat.id, currentBeatIndex: index + 1, totalBeats: project.beats.length, message: "正在识别人物安全区: " + beat.id + " (" + String(index + 1) + "/" + String(project.beats.length) + ")"});
    const faceZone = await callDetector(root, {videoPath, sampledAt: context.sampledAt, sourceFingerprint: fingerprint, beatStart: context.beatStart, beatEnd: context.beatEnd, modelDir: join(root, "data", "models"), ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg"});
    if (faceZone) detected += 1;
    beats.push(faceZone ? {...beat, faceZone} : {...beat, faceZone: null});
  }
  return {project: {...project, beats, faceDetection: {version: DETECTOR_VERSION, sourceFingerprint: fingerprint, detectedAt: new Date().toISOString()}}, detected, cached, unavailable: false};
}

module.exports = {DETECTOR_VERSION, faceZoneFromDetections, isFaceZoneCacheValid, detectProjectFaceZones, ffmpegSpawnSpec, sourceFingerprint};
