"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {extractBeatContent} = require("./beat-content-extraction.cjs");

test("separates a market-competition beat into a concise title and a distinct effect sentence", () => {
  const result = extractBeatContent("beat-015", [
    {start: 210, end: 213, zh: "随着中端寿司市场的竞争白热化"},
    {start: 213, end: 216, zh: "各大连锁品牌之间的差异化似乎正在被逐渐抹平"},
    {start: 216, end: 220, zh: "品牌需要持续做出改变和升级"},
  ], {start: 210, end: 225}, 14);

  assert.equal(result.headline, "红海竞争倒逼品牌升级");
  assert.equal(result.effectZh, "同质化加剧迫使品牌持续升级");
  assert.ok(result.headline.length >= 8 && result.headline.length <= 14);
  assert.ok(result.effectZh.length >= 10 && result.effectZh.length <= 18);
  assert.ok(result.bodyText.length >= 20 && result.bodyText.length <= 35);
  assert.notEqual(result.headline, result.effectZh);
});


test("diversity repair prefers a second local semantic topic over a time marker", () => {
  const {enforceHeadlineDiversity} = require("./beat-content-extraction.cjs");
  const beats = [{id:"beat-001",start:0,end:12,subtitle:"市场竞争白热化",zh:"中端市场竞争升温"},{id:"beat-002",start:12,end:24,subtitle:"市场竞争白热化",zh:"品牌差异化逐渐抹平"},{id:"beat-003",start:24,end:36,subtitle:"供需缺口显现",zh:"中端需求缺少承接"},{id:"beat-004",start:36,end:48,subtitle:"供需缺口显现",zh:"排队人数持续增加"}];
  const captions = [{start:0,end:12,zh:"中端市场竞争正在白热化"},{start:12,end:18,zh:"中端市场竞争正在白热化，各大连锁品牌之间的差异化逐渐抹平"},{start:18,end:24,zh:"品牌还需要持续升级"}];
  const next = enforceHeadlineDiversity(beats,captions).beats;
  assert.equal(next[1].subtitle,"品牌差异收窄");
  assert.equal(/^核心观点 ·/.test(next[1].subtitle),false);
});


test("turns a spoken low-price fragment into an independent visual card", () => {
  const result = extractBeatContent("beat-low-price", [{start: 0, end: 6, zh: "这些东西便宜到你买的时候，可能连价格都懒得比较。"}], {start: 0, end: 6}, 0);
  assert.equal(result.headline, "超低客单绕过理性比价");
  assert.equal(result.effectZh, "价格低到让购买变成顺手决定");
  assert.ok(result.bodyText.length >= 20 && result.bodyText.length <= 35);
  assert.ok(Array.isArray(result.steps) && result.steps.length >= 2);
  assert.ok(!result.headline.includes("你买的时候"));
});

test("keeps headline, summary, and narrative body below the duplicate threshold", () => {
  const {overlap} = require("./beat-content-extraction.cjs");
  const result = extractBeatContent("beat-dedupe", [{start: 0, end: 6, zh: "这些东西便宜到你买的时候，可能连价格都懒得比较。"}], {start: 0, end: 6}, 0);
  assert.ok(overlap(result.headline, result.effectZh) < .7);
  assert.ok(overlap(result.headline, result.bodyText) < .7);
  assert.ok(overlap(result.effectZh, result.bodyText) < .7);
});

test("ships the visual-card extraction prompt contract with a bad and good few-shot example", () => {
  const {VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT} = require("./beat-extractor-prompt.cjs");
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /严禁直接机械截断原句/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /Bad Case/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /Good Case/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /8~14 字/);
});


test("extracts a second independent card for repeated small transactions", () => {
  const result = extractBeatContent("beat-frequency", [{start: 0, end: 8, zh: "一次只花几十块，但这些小交易每天重复几百万、几千万次，最后就能堆出惊人的生意。"}], {start: 0, end: 8}, 1);
  assert.equal(result.headline, "高频小额聚成大生意");
  assert.equal(result.effectZh, "海量小交易会持续累积商业规模");
});


test("turns a final small-item fragment into a complete concluding card", () => {
  const result = extractBeatContent("beat-final", [{start: 0, end: 6, zh: "真正的机会有时候就在脚边，只是大多数人嫌它太小，懒得弯腰。"}], {start: 0, end: 6}, 0);
  assert.equal(result.headline, "脚边机会常被低估");
  assert.equal(result.effectZh, "不起眼的小需求也能孕育大生意");
});


test("turns high-frequency demand and trial friction into independent business cards", () => {
  const demand = extractBeatContent("beat-demand", [{start: 0, end: 8, zh: "第一，找高品需求，不要只问什么东西最贵。普通人每天每周都会做，需求不性感但很稳定。"}], {start: 0, end: 8}, 0);
  assert.equal(demand.headline, "高频需求胜过高价单品");
  const trial = extractBeatContent("beat-trial", [{start: 0, end: 8, zh: "普通人每天每周都会做，需求不性感但很稳定。第二，降低第一次决策成本，不要一开始就让客户付一大笔钱。"}], {start: 0, end: 8}, 1);
  assert.equal(trial.headline, "稳定需求降低试用门槛");
  assert.ok(!/^(?:找|周|是|点|西)/.test(demand.headline + trial.headline));
});
