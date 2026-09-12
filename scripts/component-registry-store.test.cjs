const assert = require("node:assert/strict");
const test = require("node:test");
const {mkdtemp} = require("node:fs/promises");
const {tmpdir} = require("node:os");
const {join} = require("node:path");

const {getComponentRegistry, getFamilyCandidates, moveComponentToFamily, updateComponentPreset} = require('./services/component-registry-store.cjs');

test("registry exposes 43 visual components in five families and keeps subtitles separate", async () => {
  const registry = await getComponentRegistry(process.cwd());
  assert.equal(registry.components.length, 43);
  assert.deepEqual(new Set(registry.components.map((component) => component.family)), new Set(["metrics", "steps", "chips", "narrative", "entities"]));
  assert.equal(registry.subtitleAssets.length, 1);
  assert.equal(registry.subtitleAssets[0].id, "karaoke-captions");
  const typewriter = registry.components.find((component) => component.id === "engineering-return");
  assert.equal(typewriter.tokens.mountMode, "center");
  assert.equal(typewriter.tokens.mountX, 0);
  assert.equal(typewriter.tokens.mountY, 0);
  assert.deepEqual([typewriter.tokens.boundsX, typewriter.tokens.boundsY, typewriter.tokens.boundsWidth, typewriter.tokens.boundsHeight], [110, 210, 1580, 456]);
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
