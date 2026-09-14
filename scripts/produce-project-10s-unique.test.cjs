"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {createTenSecondUniqueProject} = require("./produce-project-10s-unique.cjs");

test("10-second unique production keeps a micro tail inside one final effect", () => {
  const project = createTenSecondUniqueProject({
    projectId: "qa-ten-second-unique",
    name: "QA",
    language: "zh",
    fps: 30,
    captions: [
      {id: "c1", start: 0, end: 8, zh: "第一段内容说明了高频购买如何形成持续复购。"},
      {id: "c2", start: 8, end: 16, zh: "第二段内容解释了规模效应如何摊薄固定成本。"},
      {id: "c3", start: 16, end: 23, zh: "最后总结小额高频才是长期利润引擎。"},
    ],
    beats: [],
  }, {targetSeconds: 10});
  assert.equal(project.beats.length, 2);
  assert.ok(project.beats.every((beat) => beat.layers.length === 1));
  const layouts = project.beats.map((beat) => beat.layers[0].layout);
  assert.equal(new Set(layouts).size, layouts.length);
  assert.equal(project.beats.at(-1).end, 23);
});

test("10-second unique production keeps extracted layer copy authoritative over component defaults", () => {
  const project = createTenSecondUniqueProject({
    projectId: "qa-layer-copy-authority", name: "QA", language: "zh", fps: 30,
    captions: [{id: "c1", start: 0, end: 10, zh: "这些东西便宜到你买的时候，可能连价格都懒得比较。", en: ""}],
    beats: [],
  }, {targetSeconds: 10});
  const beat = project.beats[0];
  assert.equal(beat.layers[0].headline, beat.subtitle);
  assert.equal(beat.layers[0].effectText, beat.effectText);
  assert.equal(beat.layers[0].payload.headline, beat.subtitle);
});
