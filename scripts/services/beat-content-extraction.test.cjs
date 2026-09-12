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

  assert.equal(result.headline, "市场竞争白热化");
  assert.equal(result.effectZh, "品牌差异化逐渐抹平");
  assert.ok(result.headline.length >= 4 && result.headline.length <= 8);
  assert.ok(result.effectZh.length >= 8 && result.effectZh.length <= 14);
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
