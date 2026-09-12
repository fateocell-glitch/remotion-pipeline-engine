const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const {transformSync} = require("esbuild");

function loadEffectLayers() {
  const source = fs.readFileSync("src/JasonWu/effectLayers.ts", "utf8");
  const code = transformSync(source, {loader: "ts", format: "cjs", target: "es2018"}).code;
  const module = {exports: {}};
  new Function("module", "exports", code)(module, module.exports);
  return module.exports;
}

test("later effect layer owns the section label from its enter offset", () => {
  const {activeLayerAtTime} = loadEffectLayers();
  assert.equal(typeof activeLayerAtTime, "function");
  const cue = {
    layout: "ordered-sequence",
    effectProps: {},
    layers: [
      {layerId: "layer-1", layout: "ordered-sequence", commonProps: {enterOffset: 0}, effectProps: {eyebrow: "13 · 折叠体验", headline: "第一层标题"}},
      {layerId: "layer-2", layout: "diagonal-chips", commonProps: {enterOffset: 15.5}, effectProps: {eyebrow: "14 · 核心观点", headline: "第二层标题"}},
    ],
  };
  assert.equal(activeLayerAtTime(cue, 0).layerId, "layer-1");
  assert.equal(activeLayerAtTime(cue, 15.49).layerId, "layer-1");
  assert.equal(activeLayerAtTime(cue, 15.5).layerId, "layer-2");
});
