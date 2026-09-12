const assert = require("node:assert/strict");
const test = require("node:test");
const {mkdtemp, readFile, writeFile} = require("node:fs/promises");
const {tmpdir} = require("node:os");
const {join} = require("node:path");

const {
  createProjectStorage,
  migrateLegacyProject,
  readProject,
  writeProject,
} = require("./project-store.cjs");

test("creates a project-isolated runtime directory tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "video-studio-store-"));
  const storage = await createProjectStorage(root, "proj_20260909_abcd");

  assert.equal(storage.projectDir, join(root, "data", "projects", "proj_20260909_abcd"));
  assert.equal(storage.projectFile, join(storage.projectDir, "project.json"));
  assert.equal(storage.rawVideo, join(storage.projectDir, "source", "raw.mp4"));
  assert.equal(storage.audioFile, join(storage.projectDir, "source", "audio.wav"));
  assert.equal(storage.previewDir, join(storage.projectDir, "previews"));
  assert.equal(storage.masterFile, join(storage.projectDir, "output", "master.mp4"));
  assert.equal(storage.executionLog, join(storage.projectDir, "logs", "execution.log"));
});

test("writes and reads project metadata only from its sandbox", async () => {
  const root = await mkdtemp(join(tmpdir(), "video-studio-store-"));
  const storage = await createProjectStorage(root, "proj_20260909_meta");
  const project = {projectId: "proj_20260909_meta", state: "CREATED", beats: [], captions: []};

  await writeProject(storage, project);

  assert.deepEqual(await readProject(storage), project);
});

test("migrates legacy metadata and media into a project sandbox without deleting originals", async () => {
  const root = await mkdtemp(join(tmpdir(), "video-studio-migrate-"));
  const legacyDir = join(root, "src", "JasonWu", "projects");
  const publicDir = join(root, "public");
  await require("node:fs/promises").mkdir(legacyDir, {recursive: true});
  await require("node:fs/promises").mkdir(publicDir, {recursive: true});
  await writeFile(join(publicDir, "legacy.mp4"), "video");
  await writeFile(join(publicDir, "legacy.wav"), "audio");
  await writeFile(join(legacyDir, "legacy.json"), JSON.stringify({projectId: "legacy", name: "Legacy", videoSrc: "legacy.mp4", audioSrc: "legacy.wav", beats: [], captions: []}));
  const storage = await migrateLegacyProject({root, legacyProjectFile: join(legacyDir, "legacy.json")});
  assert.equal((await readFile(storage.rawVideo, "utf8")), "video");
  assert.equal((await readFile(storage.audioFile, "utf8")), "audio");
  assert.equal((await readProject(storage)).schemaVersion, 2);
  assert.equal((await readFile(join(publicDir, "legacy.mp4"), "utf8")), "video");
});
test("creates a project-local render tree for beat and final MP4 assets", async () => {
  const root = await mkdtemp(join(tmpdir(), "video-studio-renders-"));
  const storage = await createProjectStorage(root, "proj_render_paths");
  assert.equal(storage.rendersDir, join(storage.projectDir, "renders"));
  assert.equal(storage.beatRendersDir, join(storage.projectDir, "renders", "beats"));
  assert.equal(storage.finalRendersDir, join(storage.projectDir, "renders", "final"));
  assert.equal(storage.finalRenderFile, join(storage.projectDir, "renders", "final", "proj_render_paths-final.mp4"));
});
