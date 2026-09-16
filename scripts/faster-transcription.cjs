"use strict";

const {readFile, writeFile} = require("node:fs/promises");
const {join} = require("node:path");
const {spawn} = require("node:child_process");
const {normalizeDetectedLanguage, normalizeSourceLanguage} = require("./services/language-routing.cjs");

const root = process.cwd();
const FASTER_WHISPER_PYTHON = "C:\\Users\\Administrator\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const FASTER_WHISPER_SCRIPT = join("scripts", "transcribe_faster.py");

function normalizeWhisperLanguage(language) {
  return normalizeSourceLanguage(language);
}

function fasterWhisperArgs({audioPath, outputPath, language = "auto", task = "transcribe", model = process.env.FASTER_WHISPER_MODEL || "medium", beamSize = process.env.FASTER_WHISPER_BEAM_SIZE || 1, cpuThreads = process.env.FASTER_WHISPER_CPU_THREADS || 8}) {
  if (task !== "transcribe") throw new Error("faster-whisper only supports the native transcribe task.");
  return [FASTER_WHISPER_SCRIPT, "--audio", audioPath, "--output", outputPath, "--language", normalizeWhisperLanguage(language), "--task", "transcribe", "--model", String(model), "--beam-size", String(beamSize), "--cpu-threads", String(cpuThreads)];
}
function progressFromOutput(line) {
  const match = String(line).match(/^TRANSCRIBE_PROGRESS\s+(\{.*\})\s*$/);
  if (!match) return null;
  try {
    const payload = JSON.parse(match[1]);
    return Number.isFinite(payload.count) ? {count: payload.count, start: Number(payload.start), end: Number(payload.end), text: String(payload.text || "")} : null;
  } catch (_) {
    return null;
  }
}

function detectedLanguageFromOutput(line) {
  const match = String(line).match(/^TRANSCRIBE_LANGUAGE\s+(\{.*\})\s*$/);
  if (!match) return "";
  try {
    return normalizeDetectedLanguage(JSON.parse(match[1])?.language);
  } catch (_) {
    return "";
  }
}
function captionsToWhisperTranscript(captions, language = "zh") {
  return {
    result: {language},
    transcription: (captions || []).map((caption, index) => ({
      id: String(caption.id || `subtitle-${String(index + 1).padStart(3, "0")}`),
      offsets: {
        from: Math.round(Number(caption.start) * 1000),
        to: Math.round(Number(caption.end) * 1000),
      },
      text: String(caption.text || "").trim(),
    })).filter((row) => row.text && row.offsets.to > row.offsets.from),
  };
}

function whisperTranscriptToCaptions(transcript) {
  return (transcript?.transcription || []).map((row, index) => ({
    id: String(row.id || `subtitle-${String(index + 1).padStart(3, "0")}`),
    start: Number((Number(row.offsets?.from || 0) / 1000).toFixed(2)),
    end: Number((Number(row.offsets?.to || 0) / 1000).toFixed(2)),
    text: String(row.text || "").trim(),
  })).filter((caption) => caption.text && caption.end > caption.start);
}

function runFasterTranscription({audioPath, outputPath, language = "auto", task = "transcribe", model, beamSize, cpuThreads, onProgress, returnMetadata = false}) {
  return new Promise((resolve, reject) => {
    const child = spawn(FASTER_WHISPER_PYTHON, fasterWhisperArgs({audioPath, outputPath, language, task, model, beamSize, cpuThreads}), {cwd: root, windowsHide: true});
    let output = "";
    let buffer = "";
    let detectedLanguage = "";
    const absorb = (chunk) => {
      const text = String(chunk);
      output = (output + text).slice(-12000);
      buffer += text;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        const progress = progressFromOutput(line);
        if (progress) onProgress?.(progress);
        detectedLanguage = detectedLanguage || detectedLanguageFromOutput(line);
      }
    };
    child.stdout.on("data", absorb);
    child.stderr.on("data", absorb);
    child.on("error", reject);
    child.on("close", async (code) => {
      if (code !== 0) return reject(new Error(output || "faster-whisper transcription failed."));
      try {
        const captions = JSON.parse(await readFile(outputPath, "utf8"));
        resolve(returnMetadata ? {captions, detectedLanguage: detectedLanguage || normalizeWhisperLanguage(language)} : captions);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function writeCaptionBridgeOutput(outputPath, transcript) {
  const captions = whisperTranscriptToCaptions(transcript);
  await writeFile(outputPath, JSON.stringify(captions, null, 2) + "\n");
  return captions;
}

module.exports = {
  FASTER_WHISPER_PYTHON,
  FASTER_WHISPER_SCRIPT,
  captionsToWhisperTranscript,
  detectedLanguageFromOutput,
  fasterWhisperArgs,
  normalizeWhisperLanguage,
  progressFromOutput,
  runFasterTranscription,
  whisperTranscriptToCaptions,
  writeCaptionBridgeOutput,
};



