"use strict";

const {copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} = require("node:fs");
const {dirname, join} = require("node:path");

const REGISTRY_RELATIVE_PATH = join("src", "design", "components.registry.json");
const TOKEN_KEYS = new Set(["padding", "gap", "position", "scale", "spring", "sfx", "accentColor", "defaultItemCount", "staggerFrames", "mountMode", "mountX", "mountY", "boundsX", "boundsY", "boundsWidth", "boundsHeight"]);
const POSITIONS = new Set(["center", "bottom-left", "bottom-right", "top-right", "center-right"]);
const MOUNT_MODES = new Set(["center", "left", "right", "top", "bottom", "top-left"]);
const FAMILIES = new Set(["metrics", "steps", "chips", "narrative", "entities"]);
const SPRINGS = new Set(["spring-up", "fade-scale", "slide-left", "slide-right", "glitch"]);
const SFX = new Set(["none", "whoosh", "tech-click", "pop"]);

const registryPath = (root = process.cwd()) => join(root, REGISTRY_RELATIVE_PATH);
const seedPath = () => join(process.cwd(), REGISTRY_RELATIVE_PATH);
const writeAtomic = (file, value) => {mkdirSync(dirname(file), {recursive:true}); const temp = file + ".tmp-" + process.pid + "-" + Date.now(); writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", "utf8"); renameSync(temp, file);};
const ensureRegistry = (root) => {const file = registryPath(root); if (!existsSync(file)) {mkdirSync(dirname(file), {recursive:true}); copyFileSync(seedPath(), file);} return file;};
const validateRegistry = (registry) => {if (!registry || !Array.isArray(registry.components) || registry.components.length !== 43 || !Array.isArray(registry.subtitleAssets)) throw new Error("组件资产注册表无效。"); const ids = new Set(); for (const component of registry.components) {if (!component?.id || ids.has(component.id) || !component.family || !component.tokens) throw new Error("组件资产记录无效。"); ids.add(component.id);} return registry;};
const getComponentRegistrySync = (root = process.cwd()) => validateRegistry(JSON.parse(readFileSync(ensureRegistry(root), "utf8")));
const getComponentRegistry = async (root = process.cwd()) => getComponentRegistrySync(root);
const getFamilyCandidates = (registry, componentId) => {const selected = registry.components.find((component) => component.id === componentId); if (!selected) return []; return registry.components.filter((component) => component.family === selected.family);};
const sanitizeTokens = (source, current) => {const next = {...current}; for (const [key, value] of Object.entries(source || {})) {if (!TOKEN_KEYS.has(key)) continue; if (key === "position" && POSITIONS.has(value)) next[key] = value; else if (key === "mountMode" && MOUNT_MODES.has(value)) next[key] = value; else if (key === "spring" && SPRINGS.has(value)) next[key] = value; else if (key === "sfx" && SFX.has(value)) next[key] = value; else if (["padding", "gap", "defaultItemCount", "staggerFrames"].includes(key) && Number.isFinite(Number(value))) next[key] = Math.max(0, Math.round(Number(value))); else if (["mountX", "boundsX"].includes(key) && Number.isFinite(Number(value))) next[key] = Math.max(-1920, Math.min(3840, Math.round(Number(value)))); else if (["mountY", "boundsY"].includes(key) && Number.isFinite(Number(value))) next[key] = Math.max(-1080, Math.min(2160, Math.round(Number(value)))); else if (["boundsWidth", "boundsHeight"].includes(key) && Number.isFinite(Number(value))) next[key] = Math.max(1, Math.min(3840, Math.round(Number(value)))); else if (key === "scale" && Number.isFinite(Number(value))) next[key] = Math.max(.8, Math.min(1.2, Number(value))); else if (key === "accentColor" && /^#[0-9a-f]{6}$/i.test(String(value))) next[key] = String(value).toUpperCase();} return next;};
const updateComponentPreset = async (root, componentId, patch) => {const registry = await getComponentRegistry(root); const index = registry.components.findIndex((component) => component.id === componentId); if (index < 0) throw new Error("未找到组件资产：" + componentId); const current = registry.components[index]; const next = {...current, tokens:sanitizeTokens(patch?.tokens, current.tokens), sfx:{...current.sfx, ...(patch?.sfx || {})}, mockData:{...current.mockData, ...(patch?.mockData || {})}, version:Math.max(1, Number(current.version) || 1) + 1, updatedAt:new Date().toISOString()}; registry.components[index] = next; registry.updatedAt = next.updatedAt; writeAtomic(registryPath(root), registry); return next;};
const moveComponentToFamily = async (root, componentId, family) => {if (!FAMILIES.has(family)) throw new Error("未知组件分组：" + family); const registry = await getComponentRegistry(root); const index = registry.components.findIndex((component) => component.id === componentId); if (index < 0) throw new Error("未找到组件资产：" + componentId); const current = registry.components[index]; if (current.family === family) return current; const updatedAt = new Date().toISOString(); const next = {...current, family, updatedAt}; registry.components[index] = next; registry.updatedAt = updatedAt; writeAtomic(registryPath(root), registry); return next;};
const componentPresetFingerprintSync = (root, layouts) => {const registry = getComponentRegistrySync(root); return (layouts || []).map((layout) => {const component = registry.components.find((entry) => entry.id === layout); return component ? {id:component.id, version:component.version, tokens:component.tokens, sfx:component.sfx} : {id:layout, version:0};});};
const componentPresetFingerprint = async (root, layouts) => componentPresetFingerprintSync(root, layouts);
module.exports = {REGISTRY_RELATIVE_PATH, componentPresetFingerprint, componentPresetFingerprintSync, getComponentRegistry, getComponentRegistrySync, getFamilyCandidates, moveComponentToFamily, registryPath, updateComponentPreset};




