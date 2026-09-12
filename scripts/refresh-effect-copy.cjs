"use strict";
const {existsSync, readdirSync} = require("node:fs");
const {readFile, writeFile} = require("node:fs/promises");
const {join} = require("node:path");
const {mergeProjectEdits} = require("./project-render-assets.cjs");
const {refreshProjectEffectCopy} = require("./services/effect-copy-refresh.cjs");
const root = process.cwd();
const projectsDir = join(root, "data", "projects");
const requestedId = process.argv[2];
async function refreshProject(projectId) {
  const file = join(projectsDir, projectId, "project.json");
  const original = JSON.parse(await readFile(file, "utf8"));
  const refreshed = refreshProjectEffectCopy(original);
  if (!refreshed.changed) return {projectId, changed: 0};
  const merged = mergeProjectEdits(original, refreshed.project);
  merged.updatedAt = new Date().toISOString();
  await writeFile(file, JSON.stringify(merged, null, 2) + "\n");
  return {projectId, changed: refreshed.changed};
}
async function main() {
  const ids = requestedId ? [requestedId] : readdirSync(projectsDir).filter((id) => existsSync(join(projectsDir, id, "project.json")));
  const results = [];
  for (const id of ids) results.push(await refreshProject(id));
  process.stdout.write(JSON.stringify({results}, null, 2) + "\n");
}
main().catch((error) => {console.error(error.stack || error.message); process.exitCode = 1;});
