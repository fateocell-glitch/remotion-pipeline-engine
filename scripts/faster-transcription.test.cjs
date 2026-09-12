const assert = require("node:assert/strict");
const test = require("node:test");

const {
  FASTER_WHISPER_PYTHON,
  captionsToWhisperTranscript,
  fasterWhisperArgs,
  progressFromOutput,
} = require("./faster-transcription.cjs");

test("builds a faster-whisper command with the verified bundled Python", () => {
  const args = fasterWhisperArgs({
    audioPath: "D:\\projects\\iphon\\source\\audio.wav",
    outputPath: "D:\\projects\\iphon\\source\\captions.cleaned.json",
    language: "zh",
  });

  assert.equal(FASTER_WHISPER_PYTHON.endsWith("\\dependencies\\python\\python.exe"), true);
  assert.deepEqual(args, [
    "scripts\\transcribe_faster.py",
    "--audio",
    "D:\\projects\\iphon\\source\\audio.wav",
    "--output",
    "D:\\projects\\iphon\\source\\captions.cleaned.json",
    "--language",
    "zh",
    "--task",
    "transcribe",
    "--model",
    "medium",
    "--beam-size",
    "1",
    "--cpu-threads",
    "8",
  ]);
});

test("parses faster-whisper stdout progress rows into caption counts", () => {
  assert.deepEqual(progressFromOutput("TRANSCRIBE_PROGRESS {\"count\":3,\"start\":12.5,\"end\":105.2,\"text\":\"第三句。\"}\n"), {count: 3, start: 12.5, end: 105.2, text: "第三句。"});
  assert.equal(progressFromOutput("model loaded on cpu\n"), null);
});

test("converts faster bridge captions to the existing Whisper transcript shape", () => {
  const transcript = captionsToWhisperTranscript(
    [
      {id: "subtitle-001", start: 0, end: 1.25, text: "第一句。"},
      {id: "subtitle-002", start: 1.25, end: 3, text: "第二句，带逗号。"},
    ],
    "zh",
  );

  assert.deepEqual(transcript, {
    result: {language: "zh"},
    transcription: [
      {id: "subtitle-001", offsets: {from: 0, to: 1250}, text: "第一句。"},
      {id: "subtitle-002", offsets: {from: 1250, to: 3000}, text: "第二句，带逗号。"},
    ],
  });
});

test("adds translate mode for English caption backfill", () => {
  const args = fasterWhisperArgs({
    audioPath: "D:\\projects\\iphon\\source\\audio.wav",
    outputPath: "D:\\projects\\iphon\\source\\captions.en.json",
    language: "zh",
    task: "translate",
  });

  assert.equal(args.includes("translate"), true);
  assert.equal(args.includes("medium"), true);
});

test("allows overriding model and beam size for high-accuracy transcription", () => {
  const args = fasterWhisperArgs({
    audioPath: "D:\\projects\\iphon\\source\\audio.wav",
    outputPath: "D:\\projects\\iphon\\source\\captions.cleaned.json",
    language: "zh",
    model: "large-v3",
    beamSize: 2,
    cpuThreads: 12,
  });

  assert.deepEqual(args.slice(-6), ["--model", "large-v3", "--beam-size", "2", "--cpu-threads", "12"]);
});

