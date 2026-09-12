"use strict";

const assert = require("node:assert/strict");
const {existsSync, readFileSync, statSync} = require("node:fs");
const {join} = require("node:path");

const root = process.cwd();
const renderer = readFileSync(join(root, "scripts", "render-preview-catalog-animations.cjs"), "utf8");
const server = readFileSync(join(root, "scripts", "project-editor-web.cjs"), "utf8");
const studio = readFileSync(join(root, "scripts", "project-studio-page.cjs"), "utf8");
const layoutsStart = renderer.indexOf("const layouts = ") + "const layouts = ".length;
const layoutsEnd = renderer.indexOf(";" + String.fromCharCode(10) + "const fps", layoutsStart);
assert.ok(layoutsStart > "const layouts = ".length && layoutsEnd > layoutsStart, "the animation renderer must declare its layout list");
const layouts = JSON.parse(renderer.slice(layoutsStart, layoutsEnd));

assert.ok(layouts.length >= 35, "the animation renderer must enumerate every registered layout");
assert.match(
  server,
  /preview-catalog-animation/,
  "the Studio server must expose animated preview assets",
);
assert.match(
  studio,
  /document\.createElement\("video"\)/,
  "the Studio must mount animated preview videos instead of static images",
);
assert.match(
  studio,
  /bindAnimatedLayoutPreview|previewLoops/,
  "the Studio must limit automatic preview playback loops",
);

for (const layout of layouts) {
  const file = join(root, "public", "preview-catalog-animation", `${layout}.mp4`);
  assert.ok(existsSync(file), `missing animation preview: ${layout}`);
  assert.ok(statSync(file).size > 10_000, `animation preview is unexpectedly small: ${layout}`);
}

console.log(JSON.stringify({layouts: layouts.length, result: "animated preview integration verified"}));
