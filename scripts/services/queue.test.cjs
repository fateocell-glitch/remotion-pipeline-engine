const assert = require("node:assert/strict");
const test = require("node:test");

const {LocalQueue} = require("./queue.cjs");

test("runs no more than configured concurrency", async () => {
  let active = 0;
  let maximum = 0;
  const queue = new LocalQueue({
    maxConcurrency: 2,
    handlers: {
      TEST: async () => {
        active += 1;
        maximum = Math.max(maximum, active);
        await new Promise((resolve) => setTimeout(resolve, 20));
        active -= 1;
      },
    },
  });

  await Promise.all([queue.enqueue({type: "TEST"}), queue.enqueue({type: "TEST"}), queue.enqueue({type: "TEST"})]);
  assert.equal(maximum, 2);
});

test("records task state transitions for restart recovery", async () => {
  const states = [];
  const queue = new LocalQueue({
    handlers: {TEST: async () => {}},
    onTaskState: (task) => states.push(task.state),
  });

  await queue.enqueue({id: "task-1", projectId: "proj_1", type: "TEST"});

  assert.deepEqual(states, ["QUEUED", "RUNNING", "SUCCEEDED"]);
});
