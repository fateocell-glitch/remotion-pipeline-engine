"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {cleanWhisperTranscript} = require("./services/transcript-cleaner.cjs");
const {captionsToWhisperTranscript, runFasterTranscription, writeCaptionBridgeOutput} = require("./faster-transcription.cjs");
const {whisperToCaptions} = require("./project-onboarding.cjs");

const projectId = process.argv[2];
if (!projectId) throw new Error("Usage: node scripts/retranscribe-project.cjs <projectId>");
const root = process.cwd();
const projectDir = path.join(root, "data", "projects", projectId);
const projectFile = path.join(projectDir, "project.json");
const audioFile = path.join(projectDir, "source", "audio.wav");

if (!fs.existsSync(projectFile)) throw new Error("Project not found: " + projectId);
if (!fs.existsSync(audioFile)) throw new Error("Project audio not found: " + audioFile);

(async () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(projectDir, "backups");
  fs.mkdirSync(backupDir, {recursive: true});
  fs.copyFileSync(projectFile, path.join(backupDir, "project-before-retranscribe-" + stamp + ".json"));
  const outputFile = path.join(projectDir, "source", "captions.cleaned.json");
  console.log(JSON.stringify({stage: "transcribing", projectId, engine: "faster-whisper"}, null, 2));
  const bridgeCaptions = await runFasterTranscription({
    audioPath: audioFile,
    outputPath: outputFile,
    language: "zh",
    onProgress: ({count, text}) => console.log(JSON.stringify({stage: "transcribing", projectId, captions: count, text})),
  });
  const raw = captionsToWhisperTranscript(bridgeCaptions, "zh");
  const cleaned = cleanWhisperTranscript(raw);
  const project = JSON.parse(fs.readFileSync(projectFile, "utf8"));
  const captions = whisperToCaptions(cleaned, "zh");
  fs.writeFileSync(path.join(projectDir, "source", "captions.json"), JSON.stringify(raw, null, 2) + "\n");
  await writeCaptionBridgeOutput(path.join(projectDir, "source", "captions.cleaned.json"), cleaned);
  project.captions = captions;
  project.transcript = {...(project.transcript || {}), rawPath: "source/captions.json", cleanedPath: "source/captions.cleaned.json", cleaning: cleaned.cleaning, reprocessedAt: new Date().toISOString(), engine: "faster-whisper"};
  project.updatedAt = new Date().toISOString();
  const temporary = projectFile + ".tmp-" + process.pid + "-" + Date.now();
  fs.writeFileSync(temporary, JSON.stringify(project, null, 2) + "\n");
  fs.renameSync(temporary, projectFile);
  console.log(JSON.stringify({stage: "ready_for_reslice", projectId, captions: captions.length, sample: captions.slice(0, 8)}, null, 2));
})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
