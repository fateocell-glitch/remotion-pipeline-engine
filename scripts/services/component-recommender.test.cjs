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
  assert.equal(Object.keys(componentRegistry).length, 49);
  assert.equal(Object.keys(componentManifest).length, 49);
  assert.equal(componentRegistry["draw-line"].family, "F2_TIMELINE_PROCESS");
  assert.equal(componentRegistry["hud-glow-stack"].family, "F1_QUANTITATIVE");
  assert.equal(componentRegistry["closing-checklist"].family, "F6_CHAPTER_VERDICT");
  assert.equal(componentManifest["value-verdict"].intent, "narrative");
  assert.equal(componentManifest["engineering-return"].intent, "narrative");
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

test("applies full-project de-duplication and rewards unused alternatives", () => {
  const context = buildBeatContext({text: "芯片规格和性能需要重新定义。", beatIndex: 3, totalBeats: 8});
  const history = [{layout: "diagonal-chips", family: "F5_SPECS_MULTIDIM", intent: "system"}];
  const repeated = scoreComponent("diagonal-chips", context, history);
  const alternative = scoreComponent("product-explosion", context, history);

  assert.ok(repeated.reasons.includes("上一层同组件 -100"));
  assert.ok(repeated.reasons.includes("全片已使用，硬排除"));
  assert.ok(alternative.score > repeated.score);
});