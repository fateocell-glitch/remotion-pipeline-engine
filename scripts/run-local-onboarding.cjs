"use strict";

const {copyFile, mkdir, readFile, writeFile} = require("node:fs/promises");
const {existsSync} = require("node:fs");
const {join, resolve} = require("node:path");
const {spawn} = require("node:child_process");
const {toSpawnSpec} = require("./local-command.cjs");
const {buildProjectFromWhisper, mergeShortCaptions, whisperToCaptions} = require("./project-onboarding.cjs");
const {createProjectStorage, writeProject} = require("./services/project-store.cjs");
const {cleanWhisperTranscript} = require("./services/transcript-cleaner.cjs");
const {captionsToWhisperTranscript, runFasterTranscription, writeCaptionBridgeOutput} = require("./faster-transcription.cjs");
const {detectProjectFaceZones} = require("./services/face-detector.cjs");

const root = process.cwd();
const run = (command, args, {allowFailure = false} = {}) =>
  new Promise((resolveRun, reject) => {
    const spec = toSpawnSpec(command, args);
    const child = spawn(spec.command, spec.args, {cwd: root, windowsHide: true, ...spec.options});
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 || allowFailure ? resolveRun(output) : reject(new Error(output))));
  });

async function durationFromMedia(media) {
  const output = await run(join(root, "node_modules", ".bin", "remotion.CMD"), ["ffmpeg", "-hide_banner", "-i", media], {allowFailure: true});
  const match = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) throw new Error("Unable to read media duration.");
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}


const formatTranscriptionTime = (seconds) => {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(value / 60);
  const remaining = value % 60;
  return String(minutes).padStart(2, "0") + ":" + String(remaining).padStart(2, "0");
};

const transcriptionProgressPayload = ({count = 0, end = 0}, totalDuration, prefix = "正在提取音频字幕，进度：") => {
  const total = Math.max(0, Number(totalDuration) || 0);
  const currentEnd = Math.max(0, Number(end) || 0);
  const ratio = total > 0 ? Math.min(1, currentEnd / total) : 0;
  const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const progress = Math.round(10 + ratio * 42);
  const transcriptionProgressText = total > 0
    ? formatTranscriptionTime(currentEnd) + " / " + formatTranscriptionTime(total) + " (" + percent + "%) · 已捕获 " + count + " 句台词"
    : "正在捕获台词 · 已捕获 " + count + " 句台词";
  return {step: 2, stage: "transcribing", progress, captionCount: count, currentEnd, totalDuration: total, transcriptionPercent: percent, transcriptionProgressText, message: prefix + " " + transcriptionProgressText};
};

async function onboard({projectId, name, videoSrc, audioSrc, targetBeatDuration = 20, onProgress}) {
  const publicDir = join(root, "public");
  const projectsDir = join(root, "src", "JasonWu", "projects");
  const videoPath = videoSrc ? join(publicDir, videoSrc) : null;
  const resolvedAudioSrc = audioSrc || `${projectId}-audio.wav`;
  const audioPath = join(publicDir, resolvedAudioSrc);
  if (!videoPath || !existsSync(videoPath)) throw new Error("A source video is required.");
  onProgress?.({step: 1, stage: "extracting_audio", progress: 3, message: "正在提取音频轨..."});
  if (!existsSync(audioPath)) {
    await run(join(root, "node_modules", ".bin", "remotion.CMD"), ["ffmpeg", "-y", "-i", videoPath, "-vn", "-ar", "16000", "-ac", "1", audioPath]);
  }
  const transcriptBase = join(root, "out", `${projectId}-whisper`);
  const bridgeOutput = `${transcriptBase}.cleaned.json`;
  await mkdir(join(root, "out"), {recursive: true});
  const totalDuration = await durationFromMedia(audioPath);
  onProgress?.({step: 2, stage: "transcribing", progress: 10, captionCount: 0, currentEnd: 0, totalDuration, transcriptionPercent: 0, transcriptionProgressText: "00:00 / " + formatTranscriptionTime(totalDuration) + " (0%) · 已捕获 0 句台词", message: "正在提取音频字幕，进度： 00:00 / " + formatTranscriptionTime(totalDuration) + " (0%) · 已捕获 0 句台词"});
  const bridgeCaptions = await runFasterTranscription({
    audioPath,
    outputPath: bridgeOutput,
    language: "zh",
    onProgress: (progress) => onProgress?.(transcriptionProgressPayload(progress, totalDuration)),
  });
  const transcript = captionsToWhisperTranscript(bridgeCaptions, "zh");
  await writeFile(`${transcriptBase}.json`, `${JSON.stringify(transcript, null, 2)}\n`);
  onProgress?.({step: 3, stage: "semantic_slicing", progress: 55, message: "正在校正字幕并准备语义分拍..."});
  const cleanedTranscript = cleanWhisperTranscript(transcript);
  await writeCaptionBridgeOutput(bridgeOutput, cleanedTranscript);
  const translation = undefined;
  onProgress?.({step: 3, stage: "semantic_slicing", progress: 72, message: "正在按标点执行 20~30s 弹性语义分拍..."});
  const project = buildProjectFromWhisper({
    projectId, name, videoSrc, audioSrc: resolvedAudioSrc,
    duration: totalDuration, transcript: cleanedTranscript, translation, targetBeatDuration,
  });
  project.transcript = {
    rawPath: `out/${projectId}-whisper.json`,
    cleanedPath: `out/${projectId}-whisper.cleaned.json`,
    cleaning: cleanedTranscript.cleaning,
  };
  await mkdir(projectsDir, {recursive: true});
  await writeFile(join(projectsDir, `${projectId}.json`), `${JSON.stringify(project, null, 2)}\n`);
  return project;
}

async function stage1TranscribeToReview({workspaceRoot = root, projectId, name, targetBeatDuration = 30, audioAlreadyPrepared = false, onProgress, transcribe = runFasterTranscription, getDuration = durationFromMedia}) {
  const storage = await createProjectStorage(workspaceRoot, projectId);
  if (!existsSync(storage.rawVideo)) throw new Error("A sandboxed source video is required.");
  const remotion = join(workspaceRoot, "node_modules", ".bin", "remotion.CMD");
  onProgress?.({step: 1, stage: "extracting_audio", progress: 5, message: "正在提取项目独立音频…"});
  if (!audioAlreadyPrepared) await run(remotion, ["ffmpeg", "-y", "-i", storage.rawVideo, "-vn", "-ar", "16000", "-ac", "1", storage.audioFile]);
  const totalDuration = await getDuration(storage.audioFile);
  onProgress?.({step: 2, stage: "transcribing", progress: 10, captionCount: 0, currentEnd: 0, totalDuration, transcriptionPercent: 0, transcriptionProgressText: "00:00 / " + formatTranscriptionTime(totalDuration) + " (0%) · 已捕获 0 句台词", message: "正在提取音频字幕，进度： 00:00 / " + formatTranscriptionTime(totalDuration) + " (0%) · 已捕获 0 句台词"});
  const bridgeCaptions = await transcribe({
    audioPath: storage.audioFile,
    outputPath: storage.captionsFile,
    language: "zh",
    onProgress: (progress) => onProgress?.(transcriptionProgressPayload(progress, totalDuration)),
  });
  await writeFile(storage.captionsFile, JSON.stringify(bridgeCaptions, null, 2) + "\n");
  onProgress?.({step: 3, stage: "captions_review", progress: 55, message: "正在校正转录文本并准备字幕核对…"});
  const rawTranscript = captionsToWhisperTranscript(bridgeCaptions.map((caption) => ({...caption, text: caption.text || caption.zh || ""})), "zh");
  const cleanedTranscript = cleanWhisperTranscript(rawTranscript);
  const cleanedCaptions = whisperToCaptions(cleanedTranscript, "zh");
  await writeFile(storage.captionsCleanedFile, JSON.stringify(cleanedCaptions, null, 2) + "\n");
  await writeFile(storage.captionsDraftFile, JSON.stringify(cleanedCaptions, null, 2) + "\n");
  const createdAt = new Date().toISOString();
  const project = {
    schemaVersion: 3,
    projectId,
    name: String(name || projectId).trim() || projectId,
    compositionId: "ProjectEditor",
    fps: 30,
    width: 1920,
    height: 1080,
    videoSrc: "project-media/" + projectId + "/raw.mp4",
    audioSrc: "project-media/" + projectId + "/audio.wav",
    targetBeatDuration,
    duration: totalDuration,
    language: "zh",
    state: "CAPTIONS_REVIEW",
    createdAt,
    updatedAt: createdAt,
    beats: [],
    captions: cleanedCaptions,
    media: {rawVideo: "source/raw.mp4", audio: "source/audio.wav", captions: "source/captions.cleaned.json", rawCaptions: "source/captions.json", draftCaptions: "source/captions.draft.json", confirmedCaptions: "source/captions.confirmed.json"},
    transcript: {rawPath: "source/captions.json", cleanedPath: "source/captions.cleaned.json", draftPath: "source/captions.draft.json", confirmedPath: "source/captions.confirmed.json", cleaning: cleanedTranscript.cleaning},
  };
  await writeProject(storage, project);
  await copyFile(storage.rawVideo, join(storage.publicMediaDir, "raw.mp4"));
  await copyFile(storage.audioFile, join(storage.publicMediaDir, "audio.wav"));
  return project;
}

async function stage2ProduceFromConfirmed({workspaceRoot = root, projectId, onProgress}) {
  const storage = await createProjectStorage(workspaceRoot, projectId);
  const shell = JSON.parse(await readFile(storage.projectFile, "utf8"));
  if (shell.state !== "CAPTIONS_REVIEW") throw new Error("Only a captions-review project can be produced.");
  if (!existsSync(storage.captionsConfirmedFile)) throw new Error("Please confirm captions before producing Beats.");
  const confirmedCaptions = JSON.parse(await readFile(storage.captionsConfirmedFile, "utf8"));
  if (!Array.isArray(confirmedCaptions) || !confirmedCaptions.length) throw new Error("Confirmed captions are empty.");
  const language = shell.language === "en" ? "en" : "zh";
  const reviewCaptions = mergeShortCaptions(confirmedCaptions);
  const transcript = captionsToWhisperTranscript(reviewCaptions.map((caption) => ({...caption, text: caption.text || (language === "en" ? caption.en : caption.zh) || ""})), language);
  onProgress?.({step: 4, stage: "semantic_slicing", progress: 68, message: "正在按已确认字幕执行语义分拍…"});
  const project = buildProjectFromWhisper({projectId, name: shell.name, videoSrc: shell.videoSrc, audioSrc: shell.audioSrc, duration: Number(shell.duration), transcript, targetBeatDuration: Number(shell.targetBeatDuration) || 30});
  project.captions = reviewCaptions;
  onProgress?.({step: 5, stage: "matching_components", progress: 88, message: "正在匹配 43 种视觉组件并装配双图层…"});
  project.schemaVersion = 3;
  project.state = "READY";
  project.createdAt = shell.createdAt;
  project.updatedAt = new Date().toISOString();
  project.media = shell.media;
  project.transcript = {...shell.transcript, confirmedAt: project.updatedAt};
  await writeProject(storage, project);
  return project;
}

async function onboardSandbox(options) {
  const review = await stage1TranscribeToReview(options);
  const storage = await createProjectStorage(options.workspaceRoot || root, options.projectId);
  await writeFile(storage.captionsConfirmedFile, JSON.stringify(review.captions, null, 2) + "\n");
  return stage2ProduceFromConfirmed({workspaceRoot: options.workspaceRoot || root, projectId: options.projectId, onProgress: options.onProgress});
}

module.exports = {onboard, onboardSandbox, stage1TranscribeToReview, stage2ProduceFromConfirmed};

if (require.main === module) {
  const [projectId, name, videoSrc, target] = process.argv.slice(2);
  onboard({projectId, name, videoSrc, targetBeatDuration: target ? Number(target) : 20})
    .then((project) => process.stdout.write(`${JSON.stringify({projectId: project.projectId})}\n`))
    .catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
}

