const assert = require("node:assert/strict");
const test = require("node:test");

const {
  recoverableTasks,
  withTaskState,
} = require("./task-state.cjs");

test("persists task states under the project without mixing lifecycle state", () => {
  const project = withTaskState(
    {projectId: "proj_1", state: "READY", tasks: []},
    {id: "task-1", type: "RENDER_BEAT", state: "RUNNING", beatId: "beat-001"},
  );

  assert.equal(project.state, "READY");
  assert.equal(project.tasks[0].state, "RUNNING");
  assert.equal(project.tasks[0].beatId, "beat-001");
});

test("marks interrupted queued and running tasks for restart recovery", () => {
  const tasks = recoverableTasks([
    {id: "a", state: "QUEUED"},
    {id: "b", state: "RUNNING"},
    {id: "c", state: "SUCCEEDED"},
  ]);

  assert.deepEqual(tasks.map((task) => task.state), ["QUEUED", "QUEUED"]);
});
