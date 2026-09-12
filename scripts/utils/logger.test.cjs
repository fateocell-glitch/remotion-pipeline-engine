const assert = require("node:assert/strict");
const test = require("node:test");
const {mkdtemp, readFile} = require("node:fs/promises");
const {tmpdir} = require("node:os");
const {join} = require("node:path");

const {createLogger} = require("./logger.cjs");

test("writes one JSON-line record to global and project logs", async () => {
  const root = await mkdtemp(join(tmpdir(), "video-studio-log-"));
  const logger = createLogger({root});

  await logger.info({
    traceId: "trace-1",
    projectId: "proj_20260909_log",
    stage: "UPLOAD",
    message: "Upload received",
  });

  const globalRow = JSON.parse((await readFile(join(root, "logs", "system.log"), "utf8")).trim());
  const projectRow = JSON.parse((await readFile(join(root, "data", "projects", "proj_20260909_log", "logs", "execution.log"), "utf8")).trim());
  assert.equal(globalRow.traceId, "trace-1");
  assert.equal(projectRow.stage, "UPLOAD");
  assert.equal(projectRow.level, "INFO");
});
