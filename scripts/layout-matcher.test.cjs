"use strict";

const assert = require("node:assert/strict");
const {test} = require("node:test");
const {autoMatchProject, findSemanticHandoff} = require("./layout-matcher.cjs");

test("auto layout stores caption-derived ordered steps in the primary layer", () => {
  const project = {
    beats: [{id: "beat-001", start: 0, end: 12, eyebrow: "01 · 产品判断", subtitle: "折叠屏价值需要验证", zh: "大屏体验取决于软件适配", layout: "ordered-sequence", layoutSource: "auto", layoutLocked: false, effectProps: {}, layers: [{layerId: "layer-1", layout: "ordered-sequence", effectProps: {}, commonProps: {enterOffset: 0}}]}],
    captions: [{start: 0, end: 3, zh: "折叠屏需要验证实际价值"}, {start: 3, end: 6, zh: "软件适配决定大屏体验"}, {start: 6, end: 9, zh: "多任务能力影响日常使用"}],
  };
  const next = autoMatchProject(project);
  const beat = next.beats[0];
  assert.equal(beat.layout, "chapter-card");
  assert.equal(beat.effectProps.headline, "折叠屏价值需要验证");
  assert.ok(Array.isArray(beat.effectProps.items));
  assert.equal(beat.layers[0].effectProps.headline, beat.effectProps.headline);
});

test("non-opening ordered layout receives concise steps from its captions", () => {
  const project = {
    beats: [{id: "beat-001", start: 0, end: 12, eyebrow: "01 · 产品判断", subtitle: "折叠屏价值需要验证", zh: "大屏体验取决于软件适配", layout: "chapter-card", layoutSource: "auto", layoutLocked: false, effectProps: {}, layers: [{layerId: "layer-1", layout: "chapter-card", effectProps: {}, commonProps: {enterOffset: 0}}]}, {id: "beat-002", start: 12, end: 24, eyebrow: "02 · 流程拆解", subtitle: "适配体验决定价值", zh: "多任务与应用适配影响日常使用", layout: "ordered-sequence", layoutSource: "auto", layoutLocked: false, effectProps: {}, layers: [{layerId: "layer-1", layout: "ordered-sequence", effectProps: {}, commonProps: {enterOffset: 0}}]}, {id: "beat-003", start: 24, end: 36, eyebrow: "03 · 总结", subtitle: "结论", zh: "总结", layout: "chapter-card", layoutSource: "auto", layoutLocked: false, effectProps: {}, layers: [{layerId: "layer-1", layout: "chapter-card", effectProps: {}, commonProps: {enterOffset: 0}}]}],
    captions: [{start: 12, end: 15, zh: "第一步是软件适配决定大屏体验"}, {start: 15, end: 18, zh: "第二步看多任务能力是否顺畅"}, {start: 18, end: 21, zh: "第三步验证产品价值"}],
  };
  const next = autoMatchProject(project);
  const beat = next.beats[1];
  assert.equal(beat.layout, "ordered-sequence");
  assert.ok(beat.effectProps.steps.length >= 2);
  assert.deepEqual(beat.layers[0].effectProps.steps, beat.effectProps.steps);
  assert.ok(beat.effectProps.steps.every((item) => !["发现问题", "形成判断"].includes(item)));
});


test("zoom statement uses effect copy for its impact text when refreshing props", () => {
  const project = {
    beats: [{
      id: "beat-001",
      start: 0,
      end: 12,
      eyebrow: "01 · 市场竞争",
      subtitle: "市场竞争白热化",
      zh: "品牌差异化逐渐抹平",
      layout: "zoom-statement",
      layoutSource: "auto",
      layoutLocked: false,
      effectProps: {},
      layers: [{layerId: "layer-1", layout: "zoom-statement", effectProps: {}, commonProps: {enterOffset: 0}}],
    }],
    captions: [{start: 0, end: 12, zh: "中端市场竞争白热化，品牌差异化逐渐抹平"}],
  };

  const beat = autoMatchProject(project, {preserveLayout: true}).beats[0];
  assert.equal(beat.layout, "zoom-statement");
  assert.equal(beat.effectProps.headline, "品牌差异化逐渐抹平");
  assert.equal(beat.effectProps.title, "市场竞争白热化");
  assert.notEqual(beat.effectProps.headline, beat.effectProps.title);
});


test("two timed effects split a thirty second Beat into independent semantic windows", () => {
  const project = {
    beats: [{id: "beat-001", start: 0, end: 30, eyebrow: "CHAPTER 01", subtitle: "Key Point 1", zh: "文案要点 1", en: "", layout: "chapter-card", layoutLocked: false, effectProps: {}, layers: []}],
    captions: [{start: 0, end: 7, zh: "Google官方文件明确了生成式搜索的规则边界"}, {start: 7, end: 14, zh: "投机切块和关键词堆砌不会带来额外收益"}, {start: 15, end: 22, zh: "网站可抓取性依然决定内容是否进入答案"}, {start: 22, end: 30, zh: "真实经验和清晰结构才是长期可见性基础"}],
  };
  const beat = autoMatchProject(project, {force: true}).beats[0];
  assert.equal(beat.layers.length, 2);
  assert.equal(beat.layers[0].commonProps.enterOffset, 0);
  assert.equal(beat.layers[0].commonProps.duration, 13.5);
  assert.equal(beat.layers[0].commonProps.exitAnimation, "fade-out");
  assert.equal(beat.layers[1].commonProps.enterOffset, 14);
  assert.equal(beat.layers[1].commonProps.exitAnimation, "none");
  assert.match(beat.layers[0].effectProps.headline + beat.layers[0].effectProps.effectText, /谷歌|官方|边界|泡沫/);
  assert.match(beat.layers[1].effectProps.headline + beat.layers[1].effectProps.effectText, /网站|可抓取性|长期|成交/);
  assert.notDeepEqual(beat.layers[0].effectProps.items, beat.layers[1].effectProps.items);
});


test("dual timed layers hand off at the nearest semantic endpoint", () => {
  const beat = {start: 0, end: 30};
  const captions = [{start:0,end:7,zh:"前半判断"},{start:7,end:14.2,zh:"前半完整分句，"},{start:14.2,end:21,zh:"后半论据"},{start:21,end:30,zh:"结论收束。"}];
  assert.equal(findSemanticHandoff(captions, beat), 14.2);
});

