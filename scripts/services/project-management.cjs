"use strict";

const {existsSync, readdirSync} = require("node:fs");
const {mkdir, readFile, rm, writeFile} = require("node:fs/promises");
const {join, relative} = require("node:path");
const {projectPaths, validProjectId} = require("./project-store.cjs");

const sortable = new Set(["updatedAt", "createdAt", "name", "duration"]);
const totalDuration = (project) => Math.max(0, ...(project.beats ?? []).map((beat) => Number(beat.end) || 0));
const projectStatus = (project) => {
  if (project.render?.status === "done" || project.render?.status === "completed") return "COMPLETED";
  if (project.render?.status === "rendering" || project.state === "RENDERING") return "RENDERING";
  if ((project.beats ?? []).some((beat) => ["stale", "failed"].includes(beat.render?.status))) return "DIRTY";
  return "READY";
};
const safeProjectPath = (root, projectId) => {
  const paths = projectPaths(root, projectId);
  const expected = join(root, "data", "projects");
  if (relative(expected, paths.projectDir).startsWith("..")) throw new Error("Invalid project storage path.");
  return paths;
};

async function listProjectSummaries(root, {sortBy = "updatedAt", order = "desc"} = {}) {
  const key = sortable.has(sortBy) ? sortBy : "updatedAt";
  const direction = order === "asc" ? 1 : -1;
  const base = join(root, "data", "projects");
  if (!existsSync(base)) return [];
  const entries = await Promise.all(readdirSync(base).filter(validProjectId).map(async (projectId) => {
    const paths = safeProjectPath(root, projectId);
    if (!existsSync(paths.projectFile)) return null;
    const project = JSON.parse(await readFile(paths.projectFile, "utf8"));
    return {
      projectId,
      name: project.name || projectId,
      createdAt: project.createdAt || "",
      updatedAt: project.updatedAt || project.createdAt || "",
      duration: totalDuration(project),
      beatCount: (project.beats ?? []).length,
      status: projectStatus(project),
      hasSourceVideo: existsSync(paths.rawVideo),
      hasOutput: existsSync(paths.masterFile),
    };
  }));
  return entries.filter(Boolean).sort((a, b) => {
    const left = key === "name" ? a[key].toLocaleLowerCase() : a[key];
    const right = key === "name" ? b[key].toLocaleLowerCase() : b[key];
    return left < right ? -direction : left > right ? direction : a.projectId.localeCompare(b.projectId);
  });
}

async function renameProject(root, projectId, name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new Error("Project name is required.");
  const paths = safeProjectPath(root, projectId);
  const project = JSON.parse(await readFile(paths.projectFile, "utf8"));
  const updated = {...project, name: trimmed, updatedAt: new Date().toISOString()};
  await writeFile(paths.projectFile, JSON.stringify(updated, null, 2) + "\n");
  return updated;
}

async function cleanProjectPreviews(root, projectId) {
  const paths = safeProjectPath(root, projectId);
  await rm(paths.previewDir, {recursive: true, force: true});
  await mkdir(paths.previewDir, {recursive: true});
  return {projectId, previewDir: paths.previewDir};
}

async function deleteProject(root, projectId, {isRunning = () => false} = {}) {
  if (isRunning(projectId)) throw new Error("Project is rendering and cannot be deleted.");
  const paths = safeProjectPath(root, projectId);
  await rm(paths.projectDir, {recursive: true, force: true});
  await rm(paths.publicMediaDir, {recursive: true, force: true});
  return {projectId};
}

module.exports = {cleanProjectPreviews, deleteProject, listProjectSummaries, renameProject};
