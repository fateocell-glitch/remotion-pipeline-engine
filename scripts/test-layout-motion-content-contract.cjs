"use strict";
const assert = require("node:assert/strict");
const {existsSync, readFileSync} = require("node:fs");
const {join} = require("node:path");

const root = process.cwd();
const runtimeFile = join(root, "src", "JasonWu", "layoutRuntime.ts");
const demo = readFileSync(join(root, "src", "JasonWu", "DemoEffectComponents.tsx"), "utf8");
const incomplete = readFileSync(join(root, "src", "JasonWu", "IncompleteEffectComponents.tsx"), "utf8");
const catalog = readFileSync(join(root, "src", "JasonWu", "JasonWuComponentCatalog.tsx"), "utf8");
const previewRenderer = readFileSync(join(root, "scripts", "render-preview-catalog-animations.cjs"), "utf8");

assert.ok(existsSync(runtimeFile), "layoutRuntime.ts must centralize timing and content fallback rules");
const runtime = readFileSync(runtimeFile, "utf8");
assert.match(runtime, /getEntranceDurationSeconds/, "layout runtime must calculate data-aware entrance duration");
assert.match(runtime, /resolveContentItems/, "layout runtime must provide the project-only content fallback chain");
assert.match(runtime, /12/, "typewriter timing must use a minimum 12 characters per second budget");
assert.match(runtime, /Math\.max\(2\.5, 0\.8 \+ itemCount \* 0\.5\)/, "array layouts must use the approved entrance-duration formula");

for (const forbidden of ["MARKET SIGNAL", "AI NPU", "THERMAL", "TITANIUM", "MAGSAFE", "Apple Silicon", "NPU NETWORK", "Supply Chain"]) {
  assert.ok(!demo.includes(forbidden) && !incomplete.includes(forbidden) && !catalog.includes(forbidden), "render or preview catalog still contains mock fallback: " + forbidden);
}
assert.match(previewRenderer, /process\.argv\.includes\("--force"\)/, "preview renderer must support a forced rebuild after component changes");

for (const source of [demo, incomplete]) {
  assert.match(source, /resolveContentItems|resolveContentText/, "each component module must use project-backed content resolution");
}

assert.match(incomplete, /export const RouteMap: React\.FC<LayoutEffectProps> = \(\{cue, props\}\)/, "route-map must receive renderer props");
assert.match(incomplete, /listProp\(cue,\s*props,\s*"nodes"\)/, "route-map must render editable route nodes from props");
assert.doesNotMatch(incomplete, /\[170,355,"ORIGIN"/, "route-map must not hardcode ORIGIN in node labels");
assert.doesNotMatch(incomplete, /\[960,310,"PROCESS"/, "route-map must not hardcode PROCESS in node labels");
assert.doesNotMatch(incomplete, /\[1270,190,"SIGNAL"/, "route-map must not hardcode SIGNAL in node labels");
console.log(JSON.stringify({result: "layout motion and content contract verified"}));


