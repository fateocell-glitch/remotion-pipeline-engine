"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const recommender = require("./services/component-recommender.cjs");

const readWeight = recommender.getComponentWeight || (() => undefined);

test("component weights expose configured values with a neutral fallback", () => {
  assert.equal(readWeight("hud-glow-stack"), 90);
  assert.equal(readWeight("progress-donut"), 85);
  assert.equal(readWeight("not-a-registered-component"), 50);
});

test("candidate scores include the administrator's configured component preference", () => {
  const context = recommender.buildBeatContext({
    text: "这些信号和模块会形成稳定的商业闭环。",
    captions: [{zh: "这些信号和模块会形成稳定的商业闭环。"}],
  });
  const candidate = recommender.scoreComponent("hud-glow-stack", context, []);

  assert.equal(candidate.preferenceWeight, 90);
  assert.ok(candidate.reasons.includes("人工优先级 90"));
});


test("automatic matching pipelines retain beat indexes for fatigue arbitration", () => {
  const layoutMatcher = readFileSync("scripts/layout-matcher.cjs", "utf8");
  const tenSecondProducer = readFileSync("scripts/produce-project-10s-unique.cjs", "utf8");
  const twentyFiveSecondProducer = readFileSync("scripts/produce-project-25s-dual-unique.cjs", "utf8");

  assert.match(layoutMatcher, /history\.push\(\{layout,[\s\S]{0,180}beatIndex:index/);
  assert.match(tenSecondProducer, /history\.push\(\{layout,[\s\S]{0,180}beatIndex/);
  assert.match(twentyFiveSecondProducer, /history\.push\(\{layout,[\s\S]{0,180}beatIndex/);
});