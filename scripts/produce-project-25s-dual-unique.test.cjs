"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {createTwentyFiveSecondDualUniqueProject} = require("./produce-project-25s-dual-unique.cjs");

test("25-second dual production uses two 11-second layers separated by a 3-second gap", () => {
  const project = createTwentyFiveSecondDualUniqueProject({
    projectId: "qa-25s-dual", name: "QA", language: "zh", fps: 30,
    captions: [
      {id: "c1", start: 0, end: 12, zh: "这些东西便宜到你买的时候，可能连价格都懒得比较。", en: ""},
      {id: "c2", start: 12, end: 25, zh: "小交易每天重复很多次，最终会积累成规模。", en: ""},
      {id: "c3", start: 25, end: 36, zh: "长期深耕细节才能形成竞争壁垒。", en: ""},
    ], beats: [],
  }, {targetSeconds: 25});
  assert.equal(project.beats.length, 2);
  assert.equal(project.beats[0].layers.length, 2);
  assert.deepEqual(project.beats[0].layers.map((layer) => ({enter: layer.commonProps.enterOffset, duration: layer.commonProps.duration})), [{enter: 0, duration: 11}, {enter: 14, duration: 11}]);
  assert.deepEqual(project.beats[0].layers.map((layer) => layer.textRole), ["hook", "metric"]);
  assert.deepEqual(project.beats[0].layers.map((layer) => layer.payload.textRole), ["hook", "metric"]);
  assert.equal(project.beats[1].layers.length, 1);
  const layouts = project.beats.flatMap((beat) => beat.layers.map((layer) => layer.layout));
  assert.equal(new Set(layouts).size, layouts.length);
});


test("layer windows do not borrow a barely-overlapping caption from the next semantic segment", () => {
  const project = createTwentyFiveSecondDualUniqueProject({
    projectId: "qa-window-isolation", name: "QA", language: "zh", fps: 30,
    captions: [
      {id: "c1", start: 0, end: 10.8, zh: "这些东西便宜到你买的时候，可能连价格都懒得比较。", en: ""},
      {id: "c2", start: 10.8, end: 18, zh: "一亿件的产量会让采购和物流成本完全不同。", en: ""},
      {id: "c3", start: 18, end: 25, zh: "客户会因此更愿意反复购买。", en: ""},
    ], beats: [],
  }, {targetSeconds: 25});
  const first = project.beats[0].layers[0];
  assert.equal(first.headline, "超低客单绕过理性比价");
  assert.doesNotMatch(first.payload.bodyText || "", /一亿件|采购|物流/);
});

test("keeps primary commercial layers inside the chain candidate pool when unique layouts are exhausted", () => {
  const captions = Array.from({length: 7}, (_, index) => {
    const start = index * 25;
    return [
      {id: "primary-" + index, start, end: start + 11, zh: "通过低价入口让客户试用，再用复购把交易持续做深。", en: ""},
      {id: "secondary-" + index, start: start + 14, end: start + 25, zh: "判断好生意，要看客户是否会持续回来购买。", en: ""},
    ];
  }).flat();
  const project = createTwentyFiveSecondDualUniqueProject({
    projectId: "qa-role-pool", name: "QA", language: "zh", fps: 30, captions, beats: [],
  }, {targetSeconds: 25});
  const {ROLE_LAYOUTS} = require("./services/commercial-analysis-preset.cjs");
  const primaryLayers = project.beats.map((beat) => beat.layers[0]);

  assert.equal(primaryLayers.length, 7);
  assert.ok(primaryLayers.every((layer) => layer.textRole === "chain"));
  assert.ok(primaryLayers.every((layer) => ROLE_LAYOUTS.chain.includes(layer.layout)));
  assert.equal(new Set(primaryLayers.map((layer) => layer.layout)).size, primaryLayers.length);
});
