const assert = require("node:assert/strict");
const test = require("node:test");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const {readFile} = require("node:fs/promises");
const {stage1TranscribeToReview, stage2ProduceFromConfirmed} = require("./run-local-onboarding.cjs");
const {projectPaths} = require("./services/project-store.cjs");

const bridgeCaptions = [
  {id: "subtitle-001", start: 0, end: 4, text: "钛金属基板提供平整支撑。"},
  {id: "subtitle-002", start: 4, end: 8, text: "折叠结构决定长期耐用性。"},
];

async function createReviewProject() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "caption-review-"));
  const projectId = "review-test";
  const storage = projectPaths(workspaceRoot, projectId);
  await fs.promises.mkdir(storage.sourceDir, {recursive: true});
  await fs.promises.writeFile(storage.rawVideo, "video");
  await fs.promises.writeFile(storage.audioFile, "audio");
  const project = await stage1TranscribeToReview({
    workspaceRoot, projectId, name: "Review Test", targetBeatDuration: 30, audioAlreadyPrepared: true,
    transcribe: async () => bridgeCaptions,
    getDuration: async () => 32,
  });
  return {workspaceRoot, projectId, storage, project};
}

test("stage 1 persists a captions-review shell without beats and stores a draft", async () => {
  const {storage, project} = await createReviewProject();
  assert.equal(project.state, "CAPTIONS_REVIEW");
  assert.deepEqual(project.beats, []);
  assert.equal(JSON.parse(await readFile(storage.captionsDraftFile, "utf8")).length, 2);
});



test("stage 1 reports transcription progress by audio timestamp", async () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "caption-progress-"));
  const projectId = "progress-test";
  const storage = projectPaths(workspaceRoot, projectId);
  const progress = [];
  await fs.promises.mkdir(storage.sourceDir, {recursive: true});
  await fs.promises.writeFile(storage.rawVideo, "video");
  await fs.promises.writeFile(storage.audioFile, "audio");
  await stage1TranscribeToReview({
    workspaceRoot, projectId, name: "Progress Test", targetBeatDuration: 30, audioAlreadyPrepared: true,
    transcribe: async ({onProgress}) => {
      onProgress({count: 28, start: 101, end: 105});
      return [{id: "subtitle-001", start: 101, end: 105, text: "钛金属结构已经稳定识别。"}];
    },
    getDuration: async () => 200,
    onProgress: (event) => progress.push(event),
  });
  const transcribing = progress.find((event) => event.captionCount === 28);
  assert.equal(transcribing.totalDuration, 200);
  assert.equal(transcribing.currentEnd, 105);
  assert.equal(transcribing.transcriptionPercent, 53);
  assert.match(transcribing.transcriptionProgressText, /01:45 \/ 03:20 \(53%\) · 已捕获 28 句台词/);
  assert.equal(transcribing.progress, 32);
});
test("stage 2 preserves merged caption review rows in the ready project", async () => {
  const {workspaceRoot, projectId, storage} = await createReviewProject();
  const confirmed = [
    {id: "subtitle-001", start: 0, end: 1.1, zh: "小创意赚大钱，", en: ""},
    {id: "subtitle-002", start: 1.1, end: 4.2, zh: "有个女生花200美金在二手市场", en: ""},
    {id: "subtitle-003", start: 4.2, end: 6.2, zh: "淘了台贴纸机，", en: ""},
    {id: "subtitle-004", start: 6.2, end: 8.1, zh: "本来她没指望她能干什么大事。", en: ""},
  ];
  await fs.promises.writeFile(storage.captionsConfirmedFile, JSON.stringify(confirmed));
  const project = await stage2ProduceFromConfirmed({workspaceRoot, projectId});
  assert.equal(project.captions[0].zh, "小创意赚大钱，有个女生花200美金在二手市场淘了台贴纸机，");
  assert.ok(project.captions.length < confirmed.length);
});
test("stage 2 creates timed beats only from confirmed captions", async () => {
  const {workspaceRoot, projectId, storage} = await createReviewProject();
  const confirmed = JSON.parse(await readFile(storage.captionsDraftFile, "utf8"));
  confirmed[0].zh = "钛金属基板已人工确认";
  await fs.promises.writeFile(storage.captionsConfirmedFile, JSON.stringify(confirmed));
  const project = await stage2ProduceFromConfirmed({workspaceRoot, projectId});
  assert.equal(project.state, "READY");
  assert.ok(project.beats.length > 0);
  assert.match(project.captions[0].zh, /^钛金属基板已人工确认/);
});





test("stage 2 uses the fixed 25-second dual-effect contract when target is 25", async () => {
  const {workspaceRoot, projectId, storage} = await createReviewProject();
  const shell = JSON.parse(await readFile(storage.projectFile, "utf8"));
  shell.targetBeatDuration = 25;
  shell.duration = 50;
  await fs.promises.writeFile(storage.projectFile, JSON.stringify(shell, null, 2));
  const confirmed = [
    {id: "subtitle-001", start: 0, end: 12, zh: "接到陌生行业客户前，必须先厘清客户、产品和盈利模式。", en: ""},
    {id: "subtitle-002", start: 12, end: 25, zh: "行业研究工具可以帮助建立基础认知和沟通问题。", en: ""},
    {id: "subtitle-003", start: 25, end: 38, zh: "研究目标必须先说清，交付模式决定收入结构。", en: ""},
    {id: "subtitle-004", start: 38, end: 50, zh: "证据链和统计口径决定报告是否可信。", en: ""},
  ];
  await fs.promises.writeFile(storage.captionsConfirmedFile, JSON.stringify(confirmed));
  const project = await stage2ProduceFromConfirmed({workspaceRoot, projectId});
  assert.equal(project.targetBeatDuration, 25);
  assert.equal(project.beats[0].layers.length, 2);
  assert.deepEqual(project.beats[0].layers.map((layer) => ({enter: layer.commonProps.enterOffset, duration: layer.commonProps.duration})), [{enter: 0, duration: 11}, {enter: 14, duration: 11}]);
});
