const assert = require("node:assert/strict");
const {mkdtempSync, mkdirSync, rmSync, writeFileSync} = require("node:fs");
const {join} = require("node:path");
const {tmpdir} = require("node:os");
const {test} = require("node:test");

const {
  fasterWhisperArgs,
  normalizeWhisperLanguage,
} = require("./faster-transcription.cjs");
const {resolveLanguageRoute} = require("./services/language-routing.cjs");
const {buildProjectFromWhisper} = require("./project-onboarding.cjs");
const {stage1TranscribeToReview, stage2ProduceFromConfirmed} = require("./run-local-onboarding.cjs");

test("forces faster-whisper to transcribe auto-detected source audio", () => {
  assert.equal(normalizeWhisperLanguage("auto"), "auto");
  assert.deepEqual(
    fasterWhisperArgs({
      audioPath: "D:\\projects\\english-source.wav",
      outputPath: "D:\\projects\\english-captions.json",
      language: "auto",
    }).slice(5, 9),
    ["--language", "auto", "--task", "transcribe"],
  );
  assert.throws(
    () => fasterWhisperArgs({
      audioPath: "D:\\projects\\english-source.wav",
      outputPath: "D:\\projects\\english-captions.json",
      language: "en",
      task: "translate",
    }),
    /transcribe/i,
  );
});

test("resolves source detection and final generation language independently", () => {
  assert.deepEqual(
    resolveLanguageRoute({sourceLanguage: "en", targetLanguage: "same", detectedSourceLanguage: "en"}),
    {sourceLanguage: "en", targetLanguage: "same", detectedSourceLanguage: "en", finalLanguage: "en"},
  );
  assert.deepEqual(
    resolveLanguageRoute({sourceLanguage: "auto", targetLanguage: "same", detectedSourceLanguage: "en"}),
    {sourceLanguage: "auto", targetLanguage: "same", detectedSourceLanguage: "en", finalLanguage: "en"},
  );
  assert.deepEqual(
    resolveLanguageRoute({sourceLanguage: "zh", targetLanguage: "en", detectedSourceLanguage: "zh"}),
    {sourceLanguage: "zh", targetLanguage: "en", detectedSourceLanguage: "zh", finalLanguage: "en"},
  );
});

test("keeps English source captions native while generating an English Studio project", () => {
  const project = buildProjectFromWhisper({
    projectId: "english-routing-sample",
    name: "English routing sample",
    videoSrc: "test.mp4",
    audioSrc: "test.wav",
    duration: 60,
    sourceLanguage: "en",
    targetLanguage: "same",
    detectedSourceLanguage: "en",
    transcript: {
      language: "en",
      transcription: [
        {offsets: {from: 0, to: 10000}, text: "Revenue growth is accelerating as enterprise demand expands."},
        {offsets: {from: 10000, to: 21000}, text: "Margin compression remains a critical operational risk."},
        {offsets: {from: 21000, to: 34000}, text: "A lower acquisition cost supports durable unit economics."},
        {offsets: {from: 34000, to: 47000}, text: "The final verdict is a disciplined path to durable growth."},
        {offsets: {from: 47000, to: 60000}, text: "Execution quality determines whether the strategy can scale."},
      ],
    },
  });

  assert.equal(project.sourceLanguage, "en");
  assert.equal(project.targetLanguage, "same");
  assert.equal(project.detectedSourceLanguage, "en");
  assert.equal(project.language, "en");
  assert.ok(project.captions.every((caption) => /^[\x20-\x7e]+$/.test(caption.zh)), "English captions must not be converted into Chinese text");
  assert.ok(project.captions.every((caption) => caption.en === caption.zh), "English captions must keep the original speech in both legacy and English fields");
  assert.ok(project.beats.every((beat) => /^(?:KEY METRIC|CORE DRIVER|RISK SIGNAL|CORE TAKEAWAY)$/.test(beat.eyebrow)), "English visual categories must use uppercase English labels");
  assert.equal(/[\u3400-\u9fff]/.test(JSON.stringify(project.beats)), false, "English visual copy must not contain Chinese fallback text");
});

test("persists selected source and target languages during caption-review onboarding", async () => {
  const workspaceRoot = mkdtempSync(join(tmpdir(), "multilingual-onboarding-"));
  const projectId = "english-onboarding";
  const sourceDir = join(workspaceRoot, "data", "projects", projectId, "source");
  mkdirSync(sourceDir, {recursive: true});
  mkdirSync(join(workspaceRoot, "public"), {recursive: true});
  writeFileSync(join(sourceDir, "raw.mp4"), "video");
  writeFileSync(join(sourceDir, "audio.wav"), "audio");

  try {
    const project = await stage1TranscribeToReview({
      workspaceRoot,
      projectId,
      name: "English onboarding",
      sourceLanguage: "en",
      targetLanguage: "same",
      audioAlreadyPrepared: true,
      getDuration: async () => 18,
      transcribe: async () => ({
        captions: [
          {id: "subtitle-001", start: 0, end: 8, text: "A native English sentence stays exactly as spoken."},
          {id: "subtitle-002", start: 8, end: 18, text: "No Chinese translation or phonetic substitution is allowed."},
        ],
        detectedLanguage: "en",
      }),
    });

    assert.equal(project.sourceLanguage, "en");
    assert.equal(project.targetLanguage, "same");
    assert.equal(project.detectedSourceLanguage, "en");
    assert.equal(project.language, "en");
    assert.match(project.captions[0].zh, /native English sentence/);
    assert.equal(/[\u3400-\u9fff]/.test(project.captions.map((caption) => caption.zh).join(" ")), false);
    const confirmedFile = join(workspaceRoot, "data", "projects", projectId, "source", "captions.confirmed.json");
    writeFileSync(confirmedFile, JSON.stringify(project.captions, null, 2));
    const studio = await stage2ProduceFromConfirmed({workspaceRoot, projectId});
    assert.equal(studio.language, "en");
    assert.ok(studio.beats.length > 0);
    assert.ok(studio.beats.every((beat) => beat.layers.every((layer) => /^(?:KEY METRIC|CORE DRIVER|RISK SIGNAL|CORE TAKEAWAY)$/.test(layer.category))));
    assert.equal(/[\u3400-\u9fff]/.test(JSON.stringify(studio.beats)), false, "English Studio layer data must remain English after caption confirmation");
  } finally {
    rmSync(workspaceRoot, {recursive: true, force: true});
  }
});

test("language browser QA uses valid media instead of fake MP4 and WAV placeholders", () => {
  const {readFileSync} = require("node:fs");
  const qa = readFileSync(join(process.cwd(), "scripts", "qa-test-language-routing.cjs"), "utf8");
  assert.doesNotMatch(qa, /writeFile\(join\(projectDir, "source", "raw\.mp4"\), "video"\)/);
  assert.doesNotMatch(qa, /writeFile\(join\(projectDir, "source", "audio\.wav"\), "audio"\)/);
  assert.match(qa, /await copyFile\(join\(root, "public", "test\.mp4"\), rawVideo\)/);
  assert.match(qa, /await run\(join\(root, "node_modules", "\.bin", "remotion\.CMD"\), \["ffmpeg"/);
  assert.doesNotMatch(qa, /toSpawnSpec/);
  assert.doesNotMatch(qa, /shell:\s*true/);
});
test("exposes source and target language selectors and sends both values during upload", () => {
  const {readFileSync} = require("node:fs");
  const page = readFileSync(join(process.cwd(), "scripts", "project-studio-page.cjs"), "utf8");
  const server = readFileSync(join(process.cwd(), "scripts", "project-editor-web.cjs"), "utf8");

  assert.match(page, /id="new-project-source-language"/);
  assert.match(page, /id="new-project-target-language"/);
  assert.match(page, /sourceLanguage=/);
  assert.match(page, /targetLanguage=/);
  assert.match(server, /url\.searchParams\.get\("sourceLanguage"\)/);
  assert.match(server, /url\.searchParams\.get\("targetLanguage"\)/);
});
