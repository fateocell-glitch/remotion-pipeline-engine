"use strict";
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const root = process.cwd();
const keys = ["platform-shift-line", "tradeoff-reject-round", "recovery-progress-bars", "hud-glow-stack", "briefing-poster", "rewind-milestones", "flying-paper-stack", "checklist-editorial"];
const registry = readFileSync(join(root, "src", "JasonWu", "layoutRegistry.ts"), "utf8");
const types = readFileSync(join(root, "src", "JasonWu", "timeline.ts"), "utf8");
const components = readFileSync(join(root, "src", "JasonWu", "RecoveredEffectComponents.tsx"), "utf8");
const server = readFileSync(join(root, "scripts", "project-editor-web.cjs"), "utf8");
const previews = readFileSync(join(root, "scripts", "render-preview-catalog-animations.cjs"), "utf8");
for (const key of keys) {
  for (const source of [registry, types, components, server, previews]) assert.ok(source.includes(key), "missing recovered component integration: " + key);
}
assert.match(components, /interpolate/, "recovered layouts must use real Remotion animation");
assert.match(registry, /圆形红色否定项/, "tradeoff component metadata must identify the reference visual");
console.log(JSON.stringify({result: "eight recovered effect components registered"}));
