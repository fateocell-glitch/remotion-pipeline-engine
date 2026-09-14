"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {mergeShortCaptions} = require("./project-onboarding.cjs");
const {buildEffectProps} = require("./layout-matcher.cjs");
const {extractBeatContent} = require("./services/beat-content-extraction.cjs");

test("caption reflow never splits the Industry Research term inside an English word", () => {
  const captions = [{
    id: "subtitle-001", start: 0, end: 6,
    zh: "为了解决这个问题，我做了一个行业研究skill，叫Industry Research，已经开源了。", en: "",
  }];
  const rows = mergeShortCaptions(captions, {targetMin: 23, targetMax: 29});
  assert.ok(rows.some((row) => row.zh.includes("Industry Research")), JSON.stringify(rows));
  assert.equal(rows.some((row) => /Industry Resea$/.test(row.zh)), false, JSON.stringify(rows));
});

test("layout payload preserves complete mixed-language Layer copy without physical truncation", () => {
  const effectText = "Industry Research 已开源，可快速建立陌生行业认知";
  const props = buildEffectProps({
    eyebrow: "02 · AI 战略",
    subtitle: "行业研究 Skill 已开源",
    effectText,
    zh: effectText,
    visualCard: {bodyText: "通过结构化研究流程，把陌生行业的信息快速整理成可沟通的判断依据。", steps: ["确定行业范围", "核验原始资料"]},
  }, [], "briefing-poster");
  assert.equal(props.headline, "行业研究 Skill 已开源");
  assert.equal(props.effectText, effectText);
  assert.equal(props.bodyText, "通过结构化研究流程，把陌生行业的信息快速整理成可沟通的判断依据。");
});

test("extractor rejects dependent fragments and returns self-contained Layer copy", () => {
  const result = extractBeatContent("beat-completeness", [
    {start: 0, end: 5, zh: "做这个skill时，我给它加了几条明确的证据要求。", en: ""},
    {start: 5, end: 10, zh: "重要判断要能追溯到来源，事实和推断必须分开记录。", en: ""},
  ], {start: 0, end: 10}, 0);
  assert.doesNotMatch(result.headline, /^(?:做这个skill时|如果|因为|当|在|也|还|就)/);
  assert.doesNotMatch(result.headline, /(?:从|到|在|当|与|和|以及|时|被|把|谁|的|地|得|[，、])$/);
  assert.doesNotMatch(result.effectZh, /(?:从|到|在|当|与|和|以及|时|被|把|谁|的|地|得|[，、])$/);
  assert.ok(result.headline.length >= 4, result.headline);
  assert.ok(result.effectZh.length >= 6, result.effectZh);
});


test("extractor upgrades an Industry Research mention into an independent visual claim", () => {
  const result = extractBeatContent("beat-industry-research", [
    {start: 0, end: 8, zh: "为了解决陌生行业研究的问题，我做了一个行业研究skill，叫Industry Research，已经开源了。", en: ""},
  ], {start: 0, end: 8}, 0);
  assert.equal(result.headline, "行业研究 Skill 已开源");
  assert.equal(result.effectZh, "陌生行业也能快速建立认知");
});

test("extractor turns delivery-model narration into a standalone revenue insight", () => {
  const result = extractBeatContent("beat-delivery-model", [
    {start: 0, end: 8, zh: "研究工业软件时，要先分清企业卖的是软件许可，还是连同硬件和实施服务一起交付。", en: ""},
  ], {start: 0, end: 8}, 0);
  assert.equal(result.headline, "收入结构取决于交付模式");
  assert.equal(result.effectZh, "软件许可与实施服务必须分开看");
});


test("industry-tool wording does not override an earlier client-discovery Layer", () => {
  const result = extractBeatContent("beat-client-discovery", [
    {start: 0, end: 5, zh: "接到一个陌生行业的客户，明天就要开会。你可能连对方的产品卖给谁、靠什么赚钱都还没弄清楚。", en: ""},
    {start: 5, end: 8, zh: "为了解决这个问题，我做了一个行业研究skill，叫Industry Research。", en: ""},
  ], {start: 0, end: 8}, 0);
  assert.equal(result.headline, "会前先厘清行业基本盘");
  assert.equal(result.effectZh, "客户、产品与盈利模式必须明确");
});


test("extractor upgrades setup instructions into a clear AI research objective", () => {
  const result = extractBeatContent("beat-ai-objective", [
    {start: 0, end: 8, zh: "装好以后直接告诉AI，帮我快速了解中国工业软件行业，我要和一家相关企业做第一次沟通。", en: ""},
  ], {start: 0, end: 8}, 0);
  assert.equal(result.headline, "先向 AI 明确研究目标");
  assert.equal(result.effectZh, "行业范围决定后续研究质量");
});
