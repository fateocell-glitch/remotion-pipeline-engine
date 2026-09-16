"use strict";

const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const test = require("node:test");

const host = readFileSync("scripts/project-editor-web.cjs", "utf8");
const worker = readFileSync("scripts/services/beat-render-worker.cjs", "utf8");

test("single-beat rendering survives a Studio service restart through a persistent worker lease", () => {
  assert.match(host, /const isProcessAlive/);
  assert.match(host, /isProcessAlive\(beat\.render\?\.workerPid\)/);
  assert.match(host, /const findPersistedBeatJob/);
  assert.match(host, /detached: true/);
  assert.match(host, /workerPid: worker\.pid/);
  assert.match(host, /const persisted = await findPersistedBeatJob\(job\[1\]\)/);
  assert.match(worker, /single-beat-worker-started/);
  assert.match(worker, /single-beat-render-completed/);
  assert.match(worker, /single-beat-render-failed/);
  assert.match(worker, /stallMs: 45000/);
  assert.match(worker, /status: "ready"/);
  assert.match(worker, /status: "failed"/);
});