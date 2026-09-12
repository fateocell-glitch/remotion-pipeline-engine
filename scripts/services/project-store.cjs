"use strict";

const {copyFile, mkdir, readFile, writeFile} = require("node:fs/promises");
const {join} = require("node:path");

const validProjectId = (projectId) => typeof projectId === "string" && /^[a-z0-9_-]+$/i.test(projectId);

function projectPaths(root, projectId) {
  if (!validProjectId(projectId)) throw new Error("Invalid project id.");
  const projectDir = join(root, "data", "projects", projectId);
  return {
    projectId,
    projectDir,
    projectFile: join(projectDir, "project.json"),
    sourceDir: join(projectDir, "source"),
    rawVideo: join(projectDir, "source", "raw.mp4"),
    audioFile: join(projectDir, "source", "audio.wav"),
    captionsFile: join(projectDir, "source", "captions.json"),
    captionsCleanedFile: join(projectDir, "source", "captions.cleaned.json"),
    captionsDraftFile: join(projectDir, "source", "captions.draft.json"),
    captionsConfirmedFile: join(projectDir, "source", "captions.confirmed.json"),
    previewDir: join(projectDir, "previews"),
    rendersDir: join(projectDir, "renders"),
    beatRendersDir: join(projectDir, "renders", "beats"),
    finalRendersDir: join(projectDir, "renders", "final"),
    finalRenderFile: join(projectDir, "renders", "final", projectId + "-final.mp4"),
    outputDir: join(projectDir, "output"),
    masterFile: join(projectDir, "output", "master.mp4"),
    logDir: join(projectDir, "logs"),
    executionLog: join(projectDir, "logs", "execution.log"),
    publicMediaDir: join(root, "public", "project-media", projectId),
  };
}

async function createProjectStorage(root, projectId) {
  const storage = projectPaths(root, projectId);
  await Promise.all([
    mkdir(storage.sourceDir, {recursive: true}),
    mkdir(storage.previewDir, {recursive: true}),
    mkdir(storage.rendersDir, {recursive: true}),
    mkdir(storage.beatRendersDir, {recursive: true}),
    mkdir(storage.finalRendersDir, {recursive: true}),
    mkdir(storage.outputDir, {recursive: true}),
    mkdir(storage.logDir, {recursive: true}),
    mkdir(storage.publicMediaDir, {recursive: true}),
  ]);
  return storage;
}

async function migrateLegacyProject({root, legacyProjectFile}) {
  const legacy = JSON.parse(await readFile(legacyProjectFile, "utf8"));
  const storage = await createProjectStorage(root, legacy.projectId);
  const publicDir = join(root, "public");
  const copyIfPresent = async (source, target) => {
    try { await copyFile(source, target); } catch (error) { if (error.code !== "ENOENT") throw error; }
  };
  await copyIfPresent(join(publicDir, legacy.videoSrc || ""), storage.rawVideo);
  await copyIfPresent(join(publicDir, legacy.audioSrc || ""), storage.audioFile);
  const project = {
    ...legacy,
    schemaVersion: 2,
    state: legacy.state || "READY",
    createdAt: legacy.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    media: {rawVideo: "source/raw.mp4", audio: "source/audio.wav", captions: "source/captions.json"},
  };
  await writeFile(storage.captionsFile, `${JSON.stringify(legacy.captions ?? [], null, 2)}\n`);
  await writeProject(storage, project);
  return storage;
}
const readProject = async (storage) => JSON.parse(await readFile(storage.projectFile, "utf8"));
const writeProject = async (storage, project) => writeFile(storage.projectFile, `${JSON.stringify(project, null, 2)}\n`);

module.exports = {createProjectStorage, migrateLegacyProject, projectPaths, readProject, validProjectId, writeProject};
