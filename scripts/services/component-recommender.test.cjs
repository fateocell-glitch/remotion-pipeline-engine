"use strict";

const assert = require("node:assert/strict");
const {test} = require("node:test");
const {buildBeatContext, componentRegistry, pickBestComponent, scoreComponent} = require("./component-recommender.cjs");

test("registers all 43 Studio visual components across six families", () => {
  assert.equal(Object.keys(componentRegistry).length, 43);
  assert.equal(componentRegistry["draw-line"].family, "F2_TIMELINE_PROCESS");
  assert.equal(componentRegistry["hud-glow-stack"].family, "F1_QUANTITATIVE");
  assert.equal(componentRegistry["closing-checklist"].family, "F6_CHAPTER_VERDICT");
});

test("gives number-heavy market copy to quantitative candidates", () => {
  const context = buildBeatContext({
    text: "营收增长35%，市值达到200亿美元，市场份额持续扩大。",
    captions: [{zh: "营收增长35%"}, {zh: "市值达到200亿美元"}],
    beatIndex: 2,
    totalBeats: 8,
  });
  const best = pickBestComponent(context, 0, []);
  assert.equal(componentRegistry[best.componentId].family, "F1_QUANTITATIVE");
  assert.ok(best.matchingTags.includes("metrics"));
});

test("applies the hard immediate-repeat penalty and rewards unused alternatives", () => {
  const context = buildBeatContext({text: "芯片规格和性能需要重新定义。", beatIndex: 3, totalBeats: 8});
  const history = [{layout: "diagonal-chips", family: "F5_SPECS_MULTIDIM"}];
  const repeated = scoreComponent("diagonal-chips", context, history);
  const alternative = scoreComponent("product-explosion", context, history);

  assert.ok(repeated.reasons.includes("上一层同组件 -100"));
  assert.ok(alternative.score > repeated.score);
});
