const assert = require("node:assert/strict");
const test = require("node:test");
const {mkdtemp} = require("node:fs/promises");
const {tmpdir} = require("node:os");
const {join} = require("node:path");

const {getComponentRegistry, getFamilyCandidates, moveComponentToFamily, updateComponentPreset} = require('./services/component-registry-store.cjs');

test("registry exposes 49 visual components in five families and keeps subtitles separate", async () => {
  const registry = await getComponentRegistry(process.cwd());
  assert.equal(registry.components.length, 49);
  assert.deepEqual(new Set(registry.components.map((component) => component.family)), new Set(["metrics", "steps", "chips", "narrative", "entities"]));
  assert.equal(registry.subtitleAssets.length, 1);
  assert.equal(registry.subtitleAssets[0].id, "karaoke-captions");
  const typewriter = registry.components.find((component) => component.id === "engineering-return");
  assert.equal(typewriter.tokens.mountMode, "top-left");
  assert.equal(typewriter.tokens.mountX, 0);
  assert.equal(typewriter.tokens.mountY, 0);
  assert.deepEqual([typewriter.tokens.boundsX, typewriter.tokens.boundsY, typewriter.tokens.boundsWidth, typewriter.tokens.boundsHeight], [1120, 520, 700, 130]);
  assert.equal(typewriter.family, "narrative");
  assert.equal(typewriter.mockData.contentPayload.type, "narrative");
  assert.equal(typewriter.mockData.contentPayload.bodyText, typewriter.mockData.text);
  assert.equal(typewriter.mockData.effectZh, typewriter.mockData.text);
  const dashboard = registry.components.find((component) => component.id === "capital-dashboard");
  assert.deepEqual([dashboard.tokens.boundsX, dashboard.tokens.boundsY, dashboard.tokens.boundsWidth, dashboard.tokens.boundsHeight], [1282, 382, 538, 108]);
  const diagonalChips = registry.components.find((component) => component.id === "diagonal-chips");
  const sameFamilyIds = registry.components
    .filter((component) => component.family === diagonalChips.family)
    .map((component) => component.id)
    .sort();
  assert.deepEqual(getFamilyCandidates(registry, "diagonal-chips").map((component) => component.id).sort(), sameFamilyIds);
});

test("saving a component token increments only that preset version", async () => {
  const root = await mkdtemp(join(tmpdir(), "component-registry-"));
  const before = await getComponentRegistry(root);
  const saved = await updateComponentPreset(root, "diagonal-chips", {tokens: {gap: 24, scale: 1.08}});
  const after = await getComponentRegistry(root);
  const beforeChip = before.components.find((component) => component.id === "diagonal-chips");
  const afterChip = after.components.find((component) => component.id === "diagonal-chips");
  const beforeMetric = before.components.find((component) => component.id === "capital-dashboard");
  const afterMetric = after.components.find((component) => component.id === "capital-dashboard");
  assert.equal(saved.tokens.gap, 24);
  assert.equal(afterChip.version, beforeChip.version + 1);
  assert.equal(afterMetric.version, beforeMetric.version);
});

test("moving a component to another family persists without changing its visual preset version", async () => {
  const root = await mkdtemp(join(tmpdir(), "component-family-"));
  const before = await getComponentRegistry(root);
  const original = before.components.find((component) => component.id === "capital-dashboard");
  const moved = await moveComponentToFamily(root, "capital-dashboard", "steps");
  const after = await getComponentRegistry(root);
  assert.equal(moved.family, "steps");
  assert.equal(after.components.find((component) => component.id === "capital-dashboard").family, "steps");
  assert.equal(moved.version, original.version);
});


test("component tokens support separate title and content scale and compact progress defaults", async () => {
  const root = await mkdtemp(join(tmpdir(), "component-scale-"));
  const saved = await updateComponentPreset(root, "recovery-progress-bars", {tokens: {scale: .66, headerScale: 1.05, contentScale: .58}});
  assert.equal(saved.tokens.scale, .66);
  assert.equal(saved.tokens.headerScale, 1.05);
  assert.equal(saved.tokens.contentScale, .6);
  const registry = await getComponentRegistry(process.cwd());
  const progress = registry.components.find((component) => component.id === "recovery-progress-bars");
  assert.equal(progress.tokens.mountMode, "top-left");
  assert.ok(progress.tokens.boundsWidth <= 800);
  assert.ok(progress.tokens.boundsHeight <= 560);
  assert.ok(progress.tokens.contentScale <= .7);
  assert.ok((progress.tokens.boundsWidth * progress.tokens.boundsHeight * progress.tokens.scale * progress.tokens.scale) / (1920 * 1080) <= .25);
});

test("all visual components expose a base category headline and polymorphic content payload", async () => {
  const registry = await getComponentRegistry(process.cwd());
  for (const component of registry.components) {
    assert.equal(typeof component.mockData.category, "string", component.id + " must expose category");
    assert.ok(component.mockData.category.trim(), component.id + " category must not be blank");
    assert.equal(typeof component.mockData.headline, "string", component.id + " must expose headline");
    assert.ok(component.mockData.headline.trim(), component.id + " headline must not be blank");
    assert.ok(component.mockData.contentPayload && ["narrative", "chips", "metrics", "steps"].includes(component.mockData.contentPayload.type), component.id + " must expose a valid content payload");
  }
});

test("check-progress keeps its progress value separate from editable confirmation steps", async () => {
  const registry = await getComponentRegistry(process.cwd());
  const component = registry.components.find((item) => item.id === "check-progress");
  assert.equal(component.mockData.contentPayload.type, "steps");
  assert.equal(typeof component.mockData.contentPayload.progress, "number");
  assert.ok(component.mockData.contentPayload.steps.length >= 2);
});

test("HUD glow stack stores editable subtitles per item", async () => {
  const registry = await getComponentRegistry(process.cwd());
  const hud = registry.components.find((component) => component.id === "hud-glow-stack");
  assert.ok(hud);
  assert.equal(hud.mockData.contentPayload.type, "chips");
  assert.ok(hud.mockData.contentPayload.items.every((item) => typeof item.subtitle === "string"));
});
test("reject list stores editable body rows and subtitles like HUD chips", async () => {
  const registry = await getComponentRegistry(process.cwd());
  const reject = registry.components.find((component) => component.id === "reject-list");
  assert.ok(reject);
  assert.equal(reject.mockData.contentPayload.type, "chips");
  assert.ok(reject.mockData.contentPayload.items.length >= 3);
  assert.ok(reject.mockData.contentPayload.items.every((item) => typeof item.title === "string" && typeof item.subtitle === "string"));
});



test("progress donut exposes editable body and detail text instead of a unit-only payload", async () => {
  const registry = await getComponentRegistry(process.cwd());
  const progress = registry.components.find((component) => component.id === "progress-donut");
  assert.ok(progress);
  assert.equal(progress.mockData.contentPayload.type, "metrics");
  assert.equal(typeof progress.mockData.contentPayload.bodyText, "string");
  assert.ok(progress.mockData.contentPayload.bodyText.trim());
  assert.equal(typeof progress.mockData.contentPayload.detailText, "string");
  assert.ok(progress.mockData.contentPayload.detailText.trim());
});


test("value verdict remains a registered editable component asset", async () => {
  const registry = await getComponentRegistry(process.cwd());
  assert.equal(registry.components.some((component) => component.id === "value-verdict"), true);
  assert.equal(registry.components.some((component) => component.id === "newspaper-swap"), false);
});


test("CopyOpen imported components expose editable content payloads", async () => {
  const registry = await getComponentRegistry(process.cwd());
  const expected = [
    ["copyopen-hero-title", "narrative"],
    ["copyopen-progress-bar", "metrics"],
    ["copyopen-comparison-card", "metrics"],
    ["copyopen-terminal-scene", "steps"],
    ["copyopen-end-tag", "narrative"],
    ["copyopen-bar-chart", "steps"],
    ["copyopen-line-chart", "steps"],
    ["copyopen-pie-chart", "steps"],
    ["copyopen-kpi-grid", "steps"],
  ];
  for (const [id, payloadType] of expected) {
    const component = registry.components.find((item) => item.id === id);
    assert.ok(component, id + " must be registered");
    assert.ok(["metrics", "steps", "chips", "narrative", "entities"].includes(component.family), id + " must remain in a valid administrator-configured family");
    assert.equal(component.mockData.contentPayload.type, payloadType, id + " must expose an editable payload");
    assert.equal(typeof component.mockData.category, "string");
    assert.equal(typeof component.mockData.headline, "string");
  }
});


