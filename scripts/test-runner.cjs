"use strict";

const assert = require("node:assert/strict");
const {existsSync, readFileSync, writeFileSync, mkdirSync, rmSync} = require("node:fs");
const {dirname, join} = require("node:path");
const {tmpdir} = require("node:os");

const {extractBeatContent} = require("./services/beat-content-extraction.cjs");
const {getComponentRegistrySync, getFamilyCandidates} = require("./services/component-registry-store.cjs");
const {autoMatchProject} = require("./layout-matcher.cjs");
const {reconcileProjectRenderCache, renderContentHash, ensureProjectLifecycle, currentAssetPath} = require("./project-render-assets.cjs");

const allowedFamilies = new Set(["metrics", "steps", "chips", "narrative", "entities"]);
const forbiddenCopy = ["从素材到成片", "从素材到成片的操作路径", "关键路线出现转折", "核心体验进入实测", "这一拍的核心判断"];
const selected = new Set(process.argv.slice(2).filter((arg) => arg.startsWith("test:")));
const watch = process.argv.includes("--watch");

function shouldRun(name) {
  return selected.size === 0 || selected.has(name);
}

async function runCase(name, fn) {
  if (!shouldRun(name)) return {name, skipped: true};
  const started = Date.now();
  await fn();
  return {name, ms: Date.now() - started};
}

function assertNoForbidden(value, label) {
  const text = JSON.stringify(value);
  for (const forbidden of forbiddenCopy) assert.equal(text.includes(forbidden), false, label + " should not contain " + forbidden);
}

async function testRegistry() {
  const registry = getComponentRegistrySync(process.cwd());
  assert.equal(registry.components.length, 43, "registry must contain 43 visual components");
  const ids = new Set();
  for (const component of registry.components) {
    assert.equal(typeof component.id, "string", "component id must be a string");
    assert.ok(component.id.length > 0, "component id must not be empty");
    assert.equal(ids.has(component.id), false, "component id must be unique: " + component.id);
    ids.add(component.id);
    assert.ok(allowedFamilies.has(component.family), component.id + " has unexpected family " + component.family);
    assert.ok(component.tokens && typeof component.tokens === "object" && !Array.isArray(component.tokens), component.id + " must include tokens");
    assert.ok(component.mockData && typeof component.mockData === "object" && !Array.isArray(component.mockData), component.id + " must include mockData");
  }
}

async function testMatcher() {
  const captions = [
    {id: "subtitle-001", start: 0, end: 3, zh: "钛金属机身让整机更轻，折痕也比上一代浅很多。", en: ""},
    {id: "subtitle-002", start: 3, end: 7, zh: "iPhone Duo 的纳米纹理玻璃配合 Apple Pencil，像一台真正的小平板。", en: ""},
    {id: "subtitle-003", start: 7, end: 11, zh: "但 Magsafe 和 IP68 才是日常体验里最容易被忽略的关键点。", en: ""},
  ];
  const extracted = extractBeatContent("beat-qa", captions, {start: 0, end: 11}, 0);
  assertNoForbidden(extracted, "semantic extraction");

  const project = ensureProjectLifecycle({
    projectId: "qa-matcher",
    fps: 30,
    globalSettings: {},
    captions,
    beats: [{id: "beat-001", start: 0, end: 11, eyebrow: "01 · 数码评测", subtitle: extracted.headline, zh: extracted.effectZh, en: "", layout: "diagonal-chips", layoutLocked: false, effectProps: {}}],
  });
  const matched = autoMatchProject(project, {force: true, effectsPerBeat: 1});
  assertNoForbidden(matched.beats[0], "matched beat copy");

  const registry = getComponentRegistrySync(process.cwd());
  const diagonal = registry.components.find((component) => component.id === "diagonal-chips");
  const candidates = getFamilyCandidates(registry, "diagonal-chips");
  assert.ok(candidates.length > 1, "family replacement should return candidates");
  for (const candidate of candidates) assert.equal(candidate.family, diagonal.family, "family replacement must not cross families");
}

async function testCache() {
  const base = ensureProjectLifecycle({projectId: "qa-cache", fps: 30, globalSettings: {}, captions: [], beats: [{id: "beat-001", start: 0, end: 4, subtitle: "稳定缓存", zh: "稳定缓存", en: "", layout: "diagonal-chips", effectProps: {}, render: {revision: 1, status: "ready"}}]});
  const beat = base.beats[0];
  const renderedVideoPath = currentAssetPath(base.projectId, beat);
  const contentHash = renderContentHash(base, beat);
  const project = {...base, beats: [{...beat, renderStatus: "rendered", renderedVideoPath, contentHash, render: {...beat.render, status: "ready", previewPath: renderedVideoPath, renderedVideoPath, contentHash}}]};
  const tmpRoot = join(tmpdir(), "qa-cache-" + process.pid + "-" + Date.now());
  const mp4 = join(tmpRoot, renderedVideoPath);
  mkdirSync(dirname(mp4), {recursive: true});
  writeFileSync(mp4, "fake mp4", "utf8");
  try {
    const restored = reconcileProjectRenderCache(project, (relativePath) => existsSync(join(tmpRoot, relativePath))).project;
    assert.equal(restored.beats[0].renderStatus, "rendered", "existing unchanged mp4 must stay rendered");
    assert.equal(restored.beats[0].render.status, "ready", "existing unchanged mp4 must stay ready");
    assert.equal(restored.beats[0].render.renderedVideoPath, renderedVideoPath, "rendered path must stay on disk");
  } finally {
    rmSync(tmpRoot, {recursive: true, force: true});
  }
}

async function runOnce() {
  const cases = [
    ["test:registry", testRegistry],
    ["test:matcher", testMatcher],
    ["test:cache", testCache],
  ];
  let passed = 0;
  for (const [name, fn] of cases) {
    const result = await runCase(name, fn);
    if (result.skipped) continue;
    passed += 1;
    console.log("ok " + name + " (" + result.ms + "ms)");
  }
  console.log("QA regression guard passed: " + passed + " suite(s).");
}

if (watch) {
  const loop = async () => {
    try { await runOnce(); }
    catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
    setTimeout(loop, 1500);
  };
  loop();
} else {
  runOnce().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
}