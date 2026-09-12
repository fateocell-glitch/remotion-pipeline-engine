const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync} = require("node:fs");

const dispatcher = readFileSync("src/JasonWu/DemoEffectAdditions.tsx", "utf8");
const components = readFileSync("src/JasonWu/DemoEffectComponents.tsx", "utf8");
const registry = readFileSync("src/JasonWu/layoutRegistry.ts", "utf8");

test("demo effect migration keeps the avatar flip geometry in a reusable component", () => {
  assert.match(components, /export const DemoAvatarFlip/);
  assert.match(components, /left: 95, top: 210/);
  assert.match(components, /size=\{155\}/);
  assert.match(components, /size=\{220\}/);
});

test("approved demo enhancements are mapped by reusable layouts", () => {
  for (const layout of ["event-timeline", "pivot-list", "data-flow", "zoom-statement", "spotlight-question"]) {
    assert.match(registry, new RegExp(`(?:key:\\s*"${layout}"|item\\("${layout}")`));
  }
  assert.match(dispatcher, /getLayoutDefinition\(/);
  assert.doesNotMatch(dispatcher, /zhuzige-/);
});


