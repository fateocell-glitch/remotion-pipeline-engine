const assert = require("node:assert/strict");
const test = require("node:test");

const {renderProgress} = require("./render-progress.cjs");

test("reports bounded whole-project render progress from completed beats", () => {
  assert.equal(renderProgress(0, 31), 5);
  assert.equal(renderProgress(15, 31), 51);
  assert.equal(renderProgress(31, 31), 100);
});
