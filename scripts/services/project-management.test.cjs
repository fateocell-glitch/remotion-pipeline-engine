const assert = require("node:assert/strict");
const test = require("node:test");
const {mkdtemp, mkdir, readFile, writeFile} = require("node:fs/promises");
const {existsSync} = require("node:fs");
const {tmpdir} = require("node:os");
const {join} = require("node:path");
const {createProjectStorage, writeProject} = require("./project-store.cjs");
const {cleanProjectPreviews, deleteProject, listProjectSummaries, renameProject} = require("./project-management.cjs");

async function makeProject(root, id, values = {}) {
  const storage = await createProjectStorage(root, id);
  await writeProject(storage, {projectId: id, name: values.name || id, createdAt: values.createdAt || "2026-09-01T00:00:00.000Z", updatedAt: values.updatedAt || "2026-09-02T00:00:00.000Z", state: values.state || "READY", beats: values.beats || [{id: "beat-001", start: 0, end: values.duration || 12, render: {status: "idle"}}], captions: [], render: values.render || {status: "idle"}});
  return storage;
}

test("lists sortable project summaries with metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-projects-"));
  await makeProject(root, "alpha", {name: "Alpha", duration: 42, updatedAt: "2026-09-01T00:00:00.000Z"});
  await makeProject(root, "beta", {name: "Beta", duration: 18, updatedAt: "2026-09-03T00:00:00.000Z"});
  const projects = await listProjectSummaries(root, {sortBy: "updatedAt", order: "desc"});
  assert.equal(projects[0].projectId, "beta");
  assert.equal(projects[0].duration, 18);
  assert.equal(projects[0].hasSourceVideo, false);
  assert.equal(projects[0].beatCount, 1);
});

test("renames a project without changing its sandbox id", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-rename-"));
  const storage = await makeProject(root, "keep-id", {name: "Old Name"});
  const project = await renameProject(root, "keep-id", "New Name");
  assert.equal(project.projectId, "keep-id");
  assert.equal(project.name, "New Name");
  assert.equal(JSON.parse(await readFile(storage.projectFile, "utf8")).name, "New Name");
});

test("cleans preview cache without deleting source or master output", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-cache-"));
  const storage = await makeProject(root, "cache-project");
  await writeFile(join(storage.previewDir, "beat-001.mp4"), "preview");
  await writeFile(storage.rawVideo, "raw");
  await writeFile(storage.masterFile, "master");
  await cleanProjectPreviews(root, "cache-project");
  assert.equal(existsSync(join(storage.previewDir, "beat-001.mp4")), false);
  assert.equal(existsSync(storage.rawVideo), true);
  assert.equal(existsSync(storage.masterFile), true);
});

test("blocks deletion while a project render is running", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-delete-"));
  const storage = await makeProject(root, "rendering-project");
  await assert.rejects(() => deleteProject(root, "rendering-project", {isRunning: () => true}), /rendering/i);
  assert.equal(existsSync(storage.projectDir), true);
  await deleteProject(root, "rendering-project", {isRunning: () => false});
  assert.equal(existsSync(storage.projectDir), false);
});
