const assert = require("node:assert/strict");
const test = require("node:test");

const {buildProjectRenderPlan} = require("./project-render-plan.cjs");

test("builds one frame-accurate render segment for every variable-length beat", () => {
  const plan = buildProjectRenderPlan({
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
        fps: 30,
        beats: [
          {id: "beat-001", start: 0, end: 12},
          {id: "beat-002", start: 12.1, end: 20},
        ],
      }),
    /contiguous/,
  );
});
