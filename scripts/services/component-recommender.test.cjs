"use strict";

const assert = require("node:assert/strict");
const {test} = require("node:test");
const {
  buildBeatContext,
  classifyBeatIntent,
  componentManifest,
  componentRegistry,
  getCandidatePool,
  pickBestComponent,
  scoreComponent,
} = require("./component-recommender.cjs");

const allowedIntents = new Set(["process", "metrics", "narrative", "contrast", "system"]);

test("registers all current Studio visual components with five-intent manifest metadata", () => {
  assert.ok(Object.keys(componentRegistry).length >= 47);
  assert.ok(Object.keys(componentManifest).length >= 47);
  assert.equal(componentRegistry["draw-line"].family, "F2_TIMELINE_PROCESS");
  assert.equal(componentRegistry["hud-glow-stack"].family, "F1_QUANTITATIVE");
  assert.equal(componentRegistry["closing-checklist"].family, "F6_CHAPTER_VERDICT");
  assert.equal(componentManifest["value-verdict"].intent, "narrative");
  assert.equal("engineering-return" in componentManifest, false);
  assert.equal("finale-kinetic" in componentManifest, false);
  assert.equal("newspaper-swap" in componentRegistry, false);
  for (const [id, manifest] of Object.entries(componentManifest)) {
    assert.equal(manifest.id, id, id + " manifest id must mirror its registry key");
    assert.ok(allowedIntents.has(manifest.intent), id + " must use the five-intent router taxonomy");
    assert.ok(manifest.capacity.minItems >= 1 && manifest.capacity.maxItems >= manifest.capacity.minItems, id + " must expose valid capacity");
    assert.ok(manifest.keywords.length >= 3, id + " must expose semantic keywords");
  }
});

test("builds a 3-5 component process candidate pool before final pick", () => {
  const context = buildBeatContext({
    text: "第一阶段做贴纸，第二阶段卖服务，最后把客户沉淀到复购流程。",
    beatIndex: 1,
    totalBeats: 8,
  });
  const classified = classifyBeatIntent(context);
  const pool = getCandidatePool(classified, []);
  assert.equal(classified.targetIntent, "process");
  assert.ok(pool.length >= 3 && pool.length <= 5);
  assert.ok(pool.every((item) => item.intent === "process"));
});

test("gives number-heavy market copy to quantitative candidates", () => {
  const context = buildBeatContext({
    text: "营收增长35%，市值达到200亿美元，市场份额持续扩大。",
    captions: [{zh: "营收增长35%"}, {zh: "市值达到200亿美元"}],
    beatIndex: 2,
    totalBeats: 8,
  });
  const best = pickBestComponent(context, 0, []);
  assert.equal(componentManifest[best.componentId].intent, "metrics");
  assert.equal(componentRegistry[best.componentId].family, "F1_QUANTITATIVE");
  assert.ok(best.matchingTags.includes("metrics"));
});

test("applies beat-aware fatigue to prevent high-weight components from repeating", () => {
  const context = buildBeatContext({text: "芯片规格和性能需要重新定义。", beatIndex: 3, totalBeats: 8});
  const history = [
    {layout: "diagonal-chips", family: "F5_SPECS_MULTIDIM", intent: "system", beatIndex: 1},
    {layout: "diagonal-chips", family: "F5_SPECS_MULTIDIM", intent: "system", beatIndex: 2},
  ];
  const repeated = scoreComponent("diagonal-chips", context, history);
  const alternative = scoreComponent("product-explosion", context, history);

  assert.equal(repeated.fatiguePenalty, 120);
  assert.ok(repeated.reasons.includes("上一 Beat 出现 -80"));
  assert.ok(repeated.reasons.includes("全片累计出现 2 次 -40"));
  assert.equal(repeated.score, repeated.semanticScore * .4 + repeated.baseWeight * .6 - repeated.fatiguePenalty);
  assert.ok(alternative.score > repeated.score);
});
test("uses the commercial text role to keep risk evidence inside risk-capable layouts", () => {
  const context = buildBeatContext({
    text: "但是库存积压和现金流压力会让低价策略迅速反噬。",
    textRole: "risk",
    beatIndex: 2,
    totalBeats: 8,
    layerIndex: 1,
    layerCount: 2,
  });
  const best = pickBestComponent(context, 1, []);

  assert.equal(best.textRole, "risk");
  assert.ok(["bull-bear", "market-battlefield", "tradeoff-reject-round", "reject-list"].includes(best.componentId));
  assert.ok(best.reasons.some((reason) => reason.includes("文字角色 risk")));
});
test("includes registered JC assets in the existing weighted recommendation funnel", () => {
  const context = buildBeatContext({
    text: "采购成本下降40%，履约效率持续提升，利润空间被重新打开。",
    beatIndex: 4,
    totalBeats: 8,
  });
  const jc = scoreComponent("jc-metrics-bar-chart", context, []);

  assert.equal(componentManifest["jc-metrics-bar-chart"].intent, "metrics");
  assert.ok(componentManifest["jc-metrics-bar-chart"].textRoles.includes("metric"));
  assert.equal(componentRegistry["jc-metrics-bar-chart"].family, "metrics");
  assert.equal(jc.score, jc.semanticScore * .4 + jc.baseWeight * .6 - jc.fatiguePenalty);
  assert.equal(jc.baseWeight, 50);
  assert.ok(jc.reasons.some((reason) => reason.includes("人工优先级 50")));
});
test("backfilled runtime assets also remain eligible for recommendation", () => {
  assert.ok(componentManifest["avatar-handoff"]);
  assert.ok(componentManifest["data-flow"]);
});