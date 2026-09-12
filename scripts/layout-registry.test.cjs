const assert = require("node:assert/strict");
const test = require("node:test");
const {existsSync, readFileSync} = require("node:fs");

const layouts = ["person-rank","event-timeline","pivot-list","value-verdict","capital-dashboard","cook-machine","engineering-return","market-battlefield","finale-kinetic","reject-list","check-progress","diagonal-chips","floating-chips","bare-typography","chapter-card","logo-wordmark","ordered-sequence","org-chart","draw-line","progress-donut","avatar-handoff","bull-bear","opinion-hero","photo-wall","product-explosion","newspaper-swap","route-map","data-flow","screen-recording","zoom-statement","desktop-folders","time-rewind","clipboard-note","closing-checklist","spotlight-question"];

test("layout registry defines every supported layout", () => {
  const registryPath = "src/JasonWu/layoutRegistry.ts";
  assert.equal(existsSync(registryPath), true);
  const registry = readFileSync(registryPath, "utf8");
  for (const layout of layouts) assert.match(registry, new RegExp("item\\(\\\"" + layout + "\\\""));
  assert.match(registry, /component:/);
  assert.match(registry, /editableFields/);
  assert.match(registry, /defaultProps/);
  assert.match(registry, /meta/);
  assert.match(registry, /LAYOUT_METADATA/);
});

test("every registered layout exposes a controlled Inspector schema", () => {
  const registry = readFileSync("src/JasonWu/layoutRegistry.ts", "utf8");
  assert.match(registry, /CONTROLLED_FIELDS/);
  for (const layout of layouts) assert.ok(registry.includes("\"" + layout + "\":"));
  assert.match(registry, /mergeFields\(key, editableFields\)/);
});

test("demo effects select renderers from a layout registry, never project cue ids", () => {
  const source = readFileSync("src/JasonWu/DemoEffectAdditions.tsx", "utf8");
  assert.doesNotMatch(source, /cue\.id\s*===/);
  assert.match(source, /getLayoutDefinition\(/);
  assert.match(source, /LayoutEffectRenderer/);
  assert.match(source, /overlayLayout/);
});
