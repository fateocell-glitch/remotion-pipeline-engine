const assert = require("node:assert/strict");
const test = require("node:test");
const {refreshProjectEffectCopy} = require("./effect-copy-refresh.cjs");

test("refreshes oversized unlocked effect copy without changing timed captions", () => {
  const project = {
    beats: [{id: "beat-001", start: 0, end: 12, zh: "这是一段非常长的旧动效中文文案，原本错误地塞进了整段转录内容，因此不适合直接放进卡片和大字动画里。", en: "This is a deliberately long old effect copy that should not be rendered directly inside a motion graphic card.", layoutLocked: false, layoutSource: "auto"}],
    captions: [{start: 0, end: 6, zh: "第一句应该保留在真实字幕中", en: "The first timed subtitle remains complete."}, {start: 6, end: 12, zh: "第二句只用于提炼短动效文案", en: "The second sentence supplies concise effect copy."}],
  };
  const result = refreshProjectEffectCopy(project);
  assert.equal(result.changed, 1);
  assert.equal(result.project.beats[0].zh.length <= 36, true);
  assert.equal(result.project.beats[0].en.length <= 120, true);
  assert.equal(result.project.captions[0].zh, "第一句应该保留在真实字幕中");
  assert.equal(result.project.captions[1].en, "The second sentence supplies concise effect copy.");
});

test("preserves effect copy on a manually locked beat", () => {
  const project = {beats: [{id: "beat-001", start: 0, end: 12, zh: "这是用户亲自写的很长很长的动效文案，应当被保留。", en: "Manual effect copy remains unchanged.", layoutLocked: true}], captions: []};
  const result = refreshProjectEffectCopy(project);
  assert.equal(result.changed, 0);
  assert.equal(result.project.beats[0].zh, project.beats[0].zh);
});
