"use strict";

const {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} = require("node:fs");
const {dirname, join} = require("node:path");
const {getComponentRegistrySync} = require("./component-registry-store.cjs");

const WEIGHTS_RELATIVE_PATH = join("src", "design", "component-weights.json");
const DEFAULT_WEIGHT = 50;

const weightsPath = (root = process.cwd()) => join(root, WEIGHTS_RELATIVE_PATH);
const normalizeWeight = (value) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : DEFAULT_WEIGHT;
const writeAtomic = (file, value) => {
  mkdirSync(dirname(file), {recursive: true});
  const temporary = file + ".tmp-" + process.pid + "-" + Date.now();
  writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(temporary, file);
};

function knownComponentIds(root) {
  return getComponentRegistrySync(root).components.map((component) => component.id);
}

function getComponentWeightsSync(root = process.cwd()) {
  const file = weightsPath(root);
  let stored = {};
  if (existsSync(file)) {
    const source = JSON.parse(readFileSync(file, "utf8"));
    if (source && typeof source === "object" && !Array.isArray(source)) stored = source;
  }
  return Object.fromEntries(knownComponentIds(root).map((id) => [id, normalizeWeight(stored[id])]));
}

async function updateComponentWeights(root = process.cwd(), patch = {}) {
  const current = getComponentWeightsSync(root);
  const next = {...current};
  for (const [id, value] of Object.entries(patch || {})) {
    if (Object.prototype.hasOwnProperty.call(next, id)) next[id] = normalizeWeight(value);
  }
  writeAtomic(weightsPath(root), next);
  return next;
}

module.exports = {DEFAULT_WEIGHT, WEIGHTS_RELATIVE_PATH, getComponentWeightsSync, updateComponentWeights, weightsPath};
