"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync} = require("node:fs");

const {buildProjectRenderPlan} = require("./project-render-plan.cjs");

test("builds one frame-accurate render segment for every variable-length beat", () => {
  const plan = buildProjectRenderPlan( {
    projectId: "example",
    fps: 30,
    beats: [
      {id: "beat-001", start: 0, end: 12},
      {id: "beat-002", start: 12, end: 24.5},
      {id: "beat-003", start: 24.5, end: 25.02},
    ],
  });

  assert.deepEqual(plan, [
    {id: "beat-001", frames: "0-359"},
    {id: "beat-002", frames: "360-734"},
    {id: "beat-003", frames: "735-750"},
  ]);
});

test("rejects a project whose beats overlap or leave a frame gap", () => {
  assert.throws(
    () =>
      buildProjectRenderPlan({
        projectId: "broken",
        fps:30,
        beats: [
          {id: "beat-001", start: 0, end: 12},
          {id: "beat-002", start: 12.1, end: 20},
        ],
      }),
    /contiguous/,
  );
});

test("full project renderer builds Remotion once and renders beats from the bundle", () => {
  const source = readFileSync(require.resolve("./render-project-full.cjs"), "utf8");
  assert.match(source, /const bundleEntry = join\(root, "build"\)/);
  assert.equal(source.includes("[remotionCli, \"bundle\", \"src/index.ts\"]"), true);
  assert.equal(source.includes("[remotionCli, \"render\", bundleEntry, \"ProjectEditor\", target"), true);
  assert.equal(source.includes("[\"render\", \"src/index.ts\", \"ProjectEditor\", target"), false);
  assert.equal(source.includes("project.render = {...project.render, status: \"ready\""), true);
});
