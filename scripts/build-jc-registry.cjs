"use strict";

const {readFileSync, writeFileSync} = require("node:fs");
const {join} = require("node:path");
const {JC_COMPONENT_DEFINITIONS, backfilledRuntimeAssets} = require("./jc-component-definitions.cjs");

const root = process.cwd();
const registryPath = join(root, "src", "design", "components.registry.json");
const weightsPath = join(root, "src", "design", "component-weights.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const weights = JSON.parse(readFileSync(weightsPath, "utf8"));

const importedAssets = [...backfilledRuntimeAssets, ...JC_COMPONENT_DEFINITIONS];
const importedIds = new Set(importedAssets.map((asset) => asset.id));
const existingImportedAssets = new Map(registry.components.filter((component) => importedIds.has(component.id)).map((component) => [component.id, component]));
const allowedIntents = new Set(["narrative", "metrics", "process", "contrast", "system"]);
const preserveConfiguredAsset = (asset) => {
  const current = existingImportedAssets.get(asset.id);
  if (!current) return asset;
  const currentIntent = current?.manifest?.intent;
  return {
    ...asset,
    name: typeof current.name === "string" ? current.name : asset.name,
    family: typeof current.family === "string" ? current.family : asset.family,
    tokens: {...asset.tokens, ...(current.tokens || {})},
    sfx: {...asset.sfx, ...(current.sfx || {})},
    mockData: {...asset.mockData, ...(current.mockData || {})},
    version: Number.isFinite(Number(current.version)) ? Number(current.version) : asset.version,
    ...(typeof current.updatedAt === "string" ? {updatedAt: current.updatedAt} : {}),
    manifest: {...asset.manifest, ...(allowedIntents.has(currentIntent) ? {intent: currentIntent} : {})},
  };
};
const retained = registry.components.filter((component) => !importedIds.has(component.id));
const components = [...retained, ...importedAssets.map(preserveConfiguredAsset)];
const ids = components.map((component) => component.id);

if (new Set(ids).size !== ids.length) {
  throw new Error("JC registry build aborted: duplicate component IDs detected");
}
if (JC_COMPONENT_DEFINITIONS.length !== 38) {
  throw new Error(`JC registry build aborted: expected 38 JC definitions, found ${JC_COMPONENT_DEFINITIONS.length}`);
}
if (components.length !== 87) {
  throw new Error(`JC registry build aborted: expected 87 total visual assets, found ${components.length}`);
}

const familyNames = new Map((registry.families ?? []).map((family) => [family.id, family.name]));
for (const family of [
  ["narrative", "叙事与观点"],
  ["metrics", "指标与数据"],
  ["process", "流程与时序"],
  ["contrast", "对比与风险"],
  ["system", "系统与结构"],
]) {
  familyNames.set(family[0], family[1]);
}

registry.schemaVersion = Math.max(Number(registry.schemaVersion) || 1, 4);
registry.updatedAt = new Date().toISOString();
registry.families = [...familyNames.entries()].map(([id, name]) => ({id, name}));
registry.components = components;

for (const component of [...backfilledRuntimeAssets, ...JC_COMPONENT_DEFINITIONS]) {
  if (!Object.prototype.hasOwnProperty.call(weights, component.id)) {
    weights[component.id] = 50;
  }
}

writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
writeFileSync(weightsPath, `${JSON.stringify(weights, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  totalAssets: registry.components.length,
  jcAssets: JC_COMPONENT_DEFINITIONS.length,
  backfilledAssets: backfilledRuntimeAssets.length,
  weightsAdded: [...backfilledRuntimeAssets, ...JC_COMPONENT_DEFINITIONS].filter((component) => weights[component.id] === 50).length,
}, null, 2));
