"use strict";

const assert = require("node:assert/strict");
const {existsSync, readFileSync, writeFileSync, mkdirSync, rmSync} = require("node:fs");
const {dirname, join} = require("node:path");
const {tmpdir} = require("node:os");

const {extractBeatContent} = require("./services/beat-content-extraction.cjs");
const {getComponentRegistrySync, getFamilyCandidates, updateComponentPreset} = require("./services/component-registry-store.cjs");
const {autoMatchProject, buildEffectProps} = require("./layout-matcher.cjs");
const {reconcileProjectRenderCache, renderContentHash, ensureProjectLifecycle, currentAssetPath} = require("./project-render-assets.cjs");

const allowedFamilies = new Set(["metrics", "steps", "chips", "narrative", "entities", "process", "contrast", "system"]);
const allowedIntents = new Set(["process", "metrics", "narrative", "contrast", "system"]);
const allowedVisualWeights = new Set(["heavy", "medium", "light"]);
const forbiddenCopy = ["从素材到成片", "从素材到成片的操作路径", "关键路线出现转折", "核心体验进入实测", "这一拍的核心判断"];
const topLeftRequired = new Set([
  "bare-typography", "chapter-card", "logo-wordmark", "opinion-hero", "ordered-sequence",
  "progress-donut", "platform-shift-line", "tradeoff-reject-round", "recovery-progress-bars",
  "hud-glow-stack", "briefing-poster", "rewind-milestones", "flying-paper-stack",
  "checklist-editorial", "closing-checklist",  "clipboard-note",
]);
const fullscreenLayouts = new Set(["chapter-card"]);
const selected = new Set(process.argv.slice(2).filter((arg) => arg.startsWith("test:")));
const watch = process.argv.includes("--watch");
const fixedHeaderBottom = 58 + 31 + 8 + 54;
const fixedHeaderSafeGap = 32;

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
  assert.ok(registry.components.length >= 47, "registry must contain at least the current 47 visual components");
  const ids = new Set();
  for (const component of registry.components) {
    assert.equal(typeof component.id, "string", "component id must be a string");
    assert.ok(component.id.length > 0, "component id must not be empty");
    assert.equal(ids.has(component.id), false, "component id must be unique: " + component.id);
    ids.add(component.id);
    assert.ok(allowedFamilies.has(component.family), component.id + " has unexpected family " + component.family);
    assert.ok(component.tokens && typeof component.tokens === "object" && !Array.isArray(component.tokens), component.id + " must include tokens");
    assert.ok(["side-overlay", "fullscreen-modal"].includes(component.displayIntent), component.id + " must declare displayIntent");
    assert.ok(component.mockData && typeof component.mockData === "object" && !Array.isArray(component.mockData), component.id + " must include mockData");
    assert.ok(component.manifest && typeof component.manifest === "object" && !Array.isArray(component.manifest), component.id + " must include a Component Manifest");
    assert.equal(component.manifest.id, component.id, component.id + " manifest id must mirror component id");
    assert.ok(allowedIntents.has(component.manifest.intent), component.id + " must declare a valid manifest intent");
    assert.ok(component.manifest.capacity && Number.isFinite(component.manifest.capacity.minItems) && Number.isFinite(component.manifest.capacity.maxItems), component.id + " must declare manifest capacity");
    assert.ok(component.manifest.capacity.minItems >= 1 && component.manifest.capacity.maxItems >= component.manifest.capacity.minItems, component.id + " manifest capacity must be a valid range");
    assert.ok(Array.isArray(component.manifest.keywords) && component.manifest.keywords.length >= 3, component.id + " manifest must include semantic keywords");
    assert.ok(allowedVisualWeights.has(component.manifest.visualWeight), component.id + " must declare visual weight");
  }
}

async function testVisualPresets() {
  const registry = getComponentRegistrySync(process.cwd());
  for (const component of registry.components) {
    const tokens = component.tokens || {};
    if (component.displayIntent === "fullscreen-modal") continue;
    assert.ok(["center", "left", "right", "top", "bottom", "top-left"].includes(tokens.mountMode), component.id + " must declare a valid mount mode");
    const isNativeJc = component.id.startsWith("jc-");
    if (isNativeJc) {
      assert.equal(tokens.boundsX, 0, component.id + " must keep native left coordinates");
      assert.equal(tokens.boundsY, 0, component.id + " must keep native top coordinates");
      assert.equal(tokens.boundsWidth, 1920, component.id + " must keep native canvas width");
      assert.equal(tokens.boundsHeight, 1080, component.id + " must keep native canvas height");
      assert.equal(tokens.scale, 1, component.id + " must not be globally scaled before face avoidance");
      assert.equal(tokens.contentScale, 1, component.id + " must not receive content double-scaling");
    } else {
      assert.ok(tokens.boundsX >= 60, component.id + " must register a real visual boundsX with safe left margin");
      assert.ok(tokens.boundsY >= 58, component.id + " must register a real visual boundsY with safe top margin");
      assert.ok(tokens.boundsWidth > 0 && tokens.boundsWidth <= 1920, component.id + " must declare a legal visual width");
      assert.ok(tokens.boundsHeight > 0 && tokens.boundsHeight <= 1080, component.id + " must declare a legal visual height");
    }
  }
  for (const component of registry.components.filter((item) => fullscreenLayouts.has(item.id))) {
    assert.equal(component.displayIntent, "fullscreen-modal", component.id + " must be explicitly fullscreen");
  }
  for (const component of registry.components.filter((item) => topLeftRequired.has(item.id) && !fullscreenLayouts.has(item.id))) {
    assert.equal(component.tokens.mountMode, "top-left", component.id + " must default to the left/top-left visual zone");
  }
  const ordered = registry.components.find((component) => component.id === "ordered-sequence");
  assert.ok(ordered, "ordered-sequence must exist in the visual registry");
  assert.equal(ordered.tokens.mountMode, "top-left", "ordered-sequence content should start from the authored top-left content zone");
  assert.ok(ordered.tokens.boundsY >= fixedHeaderBottom + fixedHeaderSafeGap, "ordered-sequence content must stay below the fixed global header safe zone");
  const briefing = registry.components.find((component) => component.id === "briefing-poster");
  assert.ok(briefing, "briefing-poster must exist in the visual registry");
  assert.ok(briefing.tokens.boundsY >= fixedHeaderBottom + fixedHeaderSafeGap, "briefing-poster paper card must stay below the fixed global header safe zone");
  assert.ok(briefing.tokens.boundsHeight <= 760, "briefing-poster must stay compact enough for side-overlay use");
  const rewind = registry.components.find((component) => component.id === "rewind-milestones");
  assert.ok(rewind, "rewind-milestones must exist in the visual registry");
  assert.ok(rewind.tokens.defaultItemCount >= 5, "rewind-milestones must default to five editable milestones");
  assert.ok(rewind.tokens.boundsY >= fixedHeaderBottom + fixedHeaderSafeGap, "rewind-milestones content must stay below the fixed global header safe zone");
  assert.ok(rewind.tokens.boundsWidth <= 1280, "rewind-milestones must stay compact enough for side-overlay use");
  assert.equal(registry.components.some((component) => component.id === "engineering-return"), false, "engineering-return must be removed from the visual registry");
  assert.equal(registry.components.some((component) => component.id === "finale-kinetic"), false, "finale-kinetic must be removed from the visual registry");
  const motionWrapper = readFileSync(join(process.cwd(), "src/JasonWu/components/common/MotionWrapper.tsx"), "utf8");
  assert.equal(motionWrapper.includes("mountMode === \"top-left\" ? 76 - boundsY"), false, "top-left content must not be pulled into the fixed header band");
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
  const hud = buildEffectProps({eyebrow: "LIVE SIGNAL", subtitle: "core signal", effectText: "Current Beat semantic content", zh: "Current Beat semantic content"}, captions, "hud-glow-stack");
  assert.equal(hud.contentPayload.type, "chips", "HUD extraction must use the shared chips payload");
  assert.equal(hud.contentPayload.items[0].title, hud.items[0], "chip title must mirror the renderer item");
  assert.ok(Array.isArray(hud.contentPayload.items), "HUD hydrated payload must keep item array safe for rendering");
  assert.equal(typeof hud.contentPayload.items[0].subtitle, "string", "HUD hydrated payload must preserve subtitle fallback");
  assert.equal(buildEffectProps({eyebrow: "BRIEF", subtitle: "brief", effectText: "details"}, captions, "briefing-poster").contentPayload.type, "steps", "briefing poster must use the shared list payload");
}

async function testLayerOwnedCopy() {
  const project = ensureProjectLifecycle({projectId: "qa-layer-copy", fps: 30, globalSettings: {}, captions: [], beats: [{id: "beat-001", start: 0, end: 30, eyebrow: "Legacy category", subtitle: "Legacy headline", zh: "Legacy copy", layout: "chapter-card", effectProps: {}, layers: [{layerId: "layer-1", layout: "chapter-card", category: "01 · Layer", headline: "Layer one", effectText: "First layer copy", payload: {body: "First layer copy"}}, {layerId: "layer-2", layout: "hud-glow-stack", category: "02 · Layer", headline: "Layer two", effectText: "Second layer copy", payload: {items: ["One", "Two"]}}]}]});
  const [first, second] = project.beats[0].layers;
  assert.equal(first.category, "01 · Layer");
  assert.equal(first.headline, "Layer one");
  assert.equal(first.effectText, "First layer copy");
  assert.equal(second.category, "02 · Layer");
  assert.equal(second.headline, "Layer two");
  assert.equal(second.effectText, "Second layer copy");
  assert.deepEqual(second.payload.items, ["One", "Two"]);
  assert.equal(second.payload.contentPayload.type, "chips", "legacy chip rows must normalize to the shared payload");
  assert.deepEqual(second.payload.contentPayload.items.map((item) => item.title), ["One", "Two"]);
}

async function testCompositionSourceIsParseable() {
  const composition = readFileSync(join(process.cwd(), "src", "JasonWu", "JasonWuComposition.tsx"), "utf8");
  assert.equal(composition.includes(";\
    const "), false, "composition source must not contain a literal \
 between TypeScript statements");
}

async function testEmptyFieldsStayEmpty() {
  const root = join(tmpdir(), "component-empty-fields-" + process.pid + "-" + Date.now());
  mkdirSync(join(root, "src", "design"), {recursive: true});
  const emptyPayload = {type: "narrative", bodyText: "", highlightQuote: ""};
  await updateComponentPreset(root, "logo-wordmark", {mockData: {category: "", eyebrow: "", categoryTag: "", label: "", headline: "", title: "", body: "", bodyText: "", effectText: "", text: "", highlightQuote: "", contentPayload: emptyPayload}});
  const registry = getComponentRegistrySync(root);
  const component = registry.components.find((item) => item.id === "logo-wordmark");
  assert.ok(component, "logo-wordmark must exist in copied registry");
  assert.equal(component.mockData.category, "", "empty category must not fall back to DESIGN SYSTEM");
  assert.equal(component.mockData.headline, "", "empty headline must not fall back to default headline");
  assert.equal(component.mockData.contentPayload.bodyText, "", "empty body text must remain empty");
  assert.equal(component.mockData.contentPayload.highlightQuote, "", "empty sub text must remain empty");
  rmSync(root, {recursive: true, force: true});
}async function testEmptyListItemsStayEditable() {
  const componentContent = readFileSync(join(process.cwd(), "src", "design", "component-content.ts"), "utf8");
  assert.doesNotMatch(componentContent, /payload\.items[\s\S]{0,220}\.filter\(\(item\) => item\.title\)/, "chip payload rows must not be removed when title is empty");
  assert.doesNotMatch(componentContent, /payload\.steps[\s\S]{0,220}\.filter\(\(item\) => item\.text\)/, "step payload rows must not be removed when text is empty");
  assert.match(componentContent, /payload\.items[\s\S]{0,180}subtitle: typeof item\?\.subtitle === "string" \? item\.subtitle : ""/, "chip subtitle rows must preserve empty strings");
  assert.match(componentContent, /payload\.steps[\s\S]{0,180}text: stringValue\(item\?\.text\)/, "step rows must preserve empty text strings");
}
async function testAddedListItemsAreRenderable() {
  const adminClient = readFileSync(join(process.cwd(), "src", "design", "admin-components-client.tsx"), "utf8");
  const recoveredEffects = readFileSync(join(process.cwd(), "src", "JasonWu", "RecoveredEffectComponents.tsx"), "utf8");
  const incompleteEffects = readFileSync(join(process.cwd(), "src", "JasonWu", "IncompleteEffectComponents.tsx"), "utf8");
  assert.match(adminClient, /payloadItemCount=\(payload:ComponentContentPayload\)=>payload\.type==="chips"\?payload\.items\.length:payload\.type==="steps"\?payload\.steps\.length:0/, "adding rows must update the render item count token");
  assert.match(adminClient, /defaultItemCount:Math\.min\(8,count\)/, "new list rows must raise defaultItemCount so they render after saving");
  assert.match(recoveredEffects, /Math\.max\(itemLimit\(props, maxItems\), rows\.length\)/, "recovered list components must render explicit rows beyond the old default count");
  assert.match(incompleteEffects, /Math\.max\(itemLimit\(props, fallback\), rows\.length\)/, "incomplete list components must render explicit rows beyond the old default count");
}
async function testStudioSchemaForm() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["scripts/test-studio-schema-form.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}

async function testComponentWeights() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["--test", "scripts/component-weighting.test.cjs", "scripts/component-weights-admin.test.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}

async function testCommercialAnalysisPreset() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["--test", "scripts/services/beat-content-extraction.test.cjs", "scripts/services/component-recommender.test.cjs", "scripts/produce-project-25s-dual-unique.test.cjs", "scripts/commercial-analysis-visual-style.test.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}
async function testComponentIntakeGuard() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["scripts/component-generator.test.cjs"], {cwd: process.cwd(), stdio: "pipe"});
  const registry = getComponentRegistrySync(process.cwd());
  for (const component of registry.components) {
    assert.ok(component.editorSchema && Array.isArray(component.editorSchema.fields), component.id + " must expose editorSchema.fields");
    const seen = new Set();
    for (const field of component.editorSchema.fields) {
      assert.equal(typeof field.key, "string", component.id + " schema field key must be a string");
      assert.ok(field.key.length > 0, component.id + " schema field key must not be empty");
      assert.equal(seen.has(field.key), false, component.id + " schema field key must be unique: " + field.key);
      seen.add(field.key);
      assert.equal(typeof field.label, "string", component.id + " schema field label must be a string");
      assert.ok(field.label.length > 0, component.id + " schema field label must not be empty");
      const fieldType = field.type || field.control;
      assert.ok(["text", "number", "select", "textarea", "string-list", "string_array", "key-value-list", "chips", "chip-list", "list", "image"].includes(fieldType), component.id + " schema field type is invalid: " + fieldType);
      assert.ok(Object.prototype.hasOwnProperty.call(component.mockData, field.key), component.id + " mockData must contain schema field " + field.key);
    }
    assert.ok(component.mockData.contentPayload && ["narrative", "chips", "metrics", "steps"].includes(component.mockData.contentPayload.type), component.id + " must use one of the four standard payload families");
  }
}
async function testSemanticAccent() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["--test", "scripts/semantic-accent.test.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}
async function testJcComponents() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["scripts/qa-test-jc-components.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}

async function testContractCheck() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["scripts/qa-contract-check.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}

async function testMultilingualRouting() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["--test", "scripts/multilingual-routing.test.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}

async function testDurableBeatWorker() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["--test", "scripts/durable-beat-render-worker.test.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}
async function testFullRenderOutputIsolation() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["--test", "scripts/project-render-plan.test.cjs"], {cwd: process.cwd(), stdio: "pipe"});
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

async function testFaceAwareLayout() {
  const {execFileSync} = require("node:child_process");
  execFileSync(process.execPath, ["--test", "scripts/services/face-detector.test.cjs", "scripts/services/face-aware-layout.test.cjs", "scripts/english-layout-rendering.test.cjs"], {cwd: process.cwd(), stdio: "pipe"});
}
async function runOnce() {
  const cases = [
    ["test:registry", testRegistry],
    ["test:visual-presets", testVisualPresets],
    ["test:matcher", testMatcher],
    ["test:layer-owned-copy", testLayerOwnedCopy],
    ["test:composition-source", testCompositionSourceIsParseable],
    ["test:empty-fields", testEmptyFieldsStayEmpty],
    ["test:empty-list-items", testEmptyListItemsStayEditable],
    ["test:added-list-items", testAddedListItemsAreRenderable],
    ["test:studio-schema-form", testStudioSchemaForm],
    ["test:component-weights", testComponentWeights],
    ["test:face-aware-layout", testFaceAwareLayout],
    ["test:commercial-analysis", testCommercialAnalysisPreset],
    ["test:component-intake", testComponentIntakeGuard],
    ["test:semantic-accent", testSemanticAccent],
    ["test:multilingual-routing", testMultilingualRouting],
    ["test:jc-components", testJcComponents],
    ["test:durable-beat-worker", testDurableBeatWorker],
    ["test:full-render-output", testFullRenderOutputIsolation],
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

