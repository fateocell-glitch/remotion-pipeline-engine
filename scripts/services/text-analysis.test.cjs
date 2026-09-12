const assert = require("node:assert/strict");
const test = require("node:test");
const {deriveBeatText} = require("./text-analysis.cjs");
const {rebuildProjectText} = require("../project-onboarding.cjs");

const foldableCaptions = [
  {start: 225, end: 227, zh: "后面的等零售机我在一个一个室吧"},
  {start: 227, end: 230, zh: "但是说实话，凡是做到这种 iPad 折叠的"},
  {start: 230, end: 234, zh: "内屏可以衔接多任务"},
  {start: 234, end: 238, zh: "好不好用我们一个一个来看"},
];

test("derives foldable multi-tasking copy from the local caption window", () => {
  const result = deriveBeatText(foldableCaptions, 15);
  assert.equal(result.chapter, "16 · 折叠体验");
  assert.match(result.headline, /(折叠|内屏|多任务)/);
  assert.match(result.effectZh, /(折叠|内屏|多任务)/);
  assert.notEqual(result.headline, result.effectZh);
  assert.notEqual(result.headline, "折叠设备进入实测");
  assert.notEqual(result.effectZh, "多任务体验决定实用性");
});

test("rebuilds every auto-derived project title without overwriting manual titles", () => {
  const project = {
    captions: foldableCaptions,
    beats: [
      {id: "beat-001", start: 225, end: 240, eyebrow: "01 · 核心观点", subtitle: "后面的等零售机我在一个一个室", zh: "突出这一拍的关键业务价值", en: "", textSource: "auto", effectCopySource: "auto", layoutLocked: false},
      {id: "beat-002", start: 225, end: 240, eyebrow: "手工章节", subtitle: "手工标题不应改动", zh: "手工效果文案", en: "", textSource: "manual", effectCopySource: "manual", layoutLocked: false},
    ],
  };
  const next = rebuildProjectText(project);
  assert.match(next.beats[0].subtitle, /(折叠|内屏|多任务)/);
  assert.notEqual(next.beats[0].subtitle, "折叠设备进入实测");
  assert.equal(next.beats[1].subtitle, "手工标题不应改动");
});

test("never emits legacy generic copy when a local caption window is available", () => {
  const result = deriveBeatText([{zh: "钛金属基板配合层叠结构，苹果重点解决折痕问题"}], 0);
  const forbidden = ["从素材到成片的操作路径", "关键路线出现转折", "核心体验进入实测", "这一拍的核心判断"];
  assert.equal(forbidden.includes(result.headline), false);
  assert.equal(forbidden.includes(result.effectZh), false);
  assert.match(result.headline + result.effectZh, /(钛金属|层叠|折痕)/);
});


test("prefers foldable hardware evidence over a noisy opening sentence for effect copy", () => {
  const result = deriveBeatText([
    {zh: "我只想按下去的时候也不会有任何话"},
    {zh: "苹果对于折痕可以说是下足了功夫"},
    {zh: "首先它整个苹果最底面是一个钛金属基板"},
    {zh: "是一个完全平整的，带来非常好的支撑"},
  ], 0);
  assert.equal(result.headline, "钛金属基板");
  assert.equal(result.effectZh, "钛金属基板提供平整支撑");
});

test("derives a hardware-specific effect sentence for foldable corner support", () => {
  const result = deriveBeatText([
    {zh: "但是它四个边角可以按下去"},
    {zh: "Apple 这个 iPhone Duo 四个边角完全是按不下去的"},
    {zh: "非常的平整"},
  ], 1);
  assert.match(result.headline, /(折叠|iPhone|四角)/);
  assert.equal(result.effectZh, "四角平整增强机身支撑");
});
