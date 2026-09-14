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
  assert.equal(project.beats[1].layers.length, 1);
  const layouts = project.beats.flatMap((beat) => beat.layers.map((layer) => layer.layout));
  assert.equal(new Set(layouts).size, layouts.length);
});
