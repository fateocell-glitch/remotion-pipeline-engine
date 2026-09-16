const assert = require("node:assert/strict");
const test = require("node:test");
const {normalizeBeatLayers, validEffectLayers} = require("./effect-layer-schema.cjs");

test("normalizes a legacy layout into one editable effect layer", () => {
  const [layer] = normalizeBeatLayers({layout: "chapter-card", effectProps: {headline: "Start"}});
  assert.equal(layer.layerId, "layer-1");
  assert.equal(layer.layout, "chapter-card");
  assert.equal(layer.headline, "Start");
  assert.deepEqual(layer.layoutProps, {});
  assert.equal(layer.commonProps.position, undefined);
  assert.equal(layer.commonProps.enterOffset, 0);
  assert.equal(layer.payload.contentPayload.type, "narrative");
});

test("accepts an ordered two-layer effect stack", () => {
  assert.equal(validEffectLayers([{layerId: "chapter", layout: "chapter-card", enterOffset: 0}, {layerId: "metric", layout: "value-verdict", effectProps: {headline: "12.0"}, enterOffset: 1}], new Set(["chapter-card", "value-verdict"])), true);
});

test("migrates legacy scene overrides into canonical layout props", () => {
  const [layer] = normalizeBeatLayers({layout: "hud-glow-stack", start: 0, end: 25, layers: [{layerId: "layer-1", layout: "hud-glow-stack", commonProps: {position: "bottom-right", sceneModeOverride: "speaker_mode", alignOverride: "left"}}]});
  assert.deepEqual(layer.layoutProps, {sceneMode: "speaker", align: "left"});
  assert.equal(layer.commonProps.sceneModeOverride, undefined);
  assert.equal(layer.commonProps.alignOverride, undefined);
  assert.equal(layer.commonProps.position, undefined);
});

test("repairs a legacy second Layer that defaults to zero and overlaps the first Layer", () => {
  const layers = normalizeBeatLayers({start: 0, end: 30.44, layout: "chapter-card", layers: [{layerId: "layer-1", layout: "chapter-card", commonProps: {enterOffset: 0, duration: 12.03, exitAnimation: "fade-out"}}, {layerId: "layer-2", layout: "chapter-card", commonProps: {enterOffset: 0, exitAnimation: "none"}}]});
  assert.equal(layers[0].commonProps.duration, 12.03);
  assert.equal(layers[1].commonProps.enterOffset, 12.53);
  assert.equal(layers[1].enterOffset, 12.53);
  assert.equal(layers[1].commonProps.duration, 17.91);
});
test("preserves layer-level contentPayload as the render payload contract", () => {
  const [layer] = normalizeBeatLayers({
    layout: "hud-glow-stack",
    start: 0,
    end: 12,
    layers: [{
      layerId: "layer-1",
      layout: "hud-glow-stack",
      contentPayload: {type: "chips", items: [{title: "MARK_ITEM_A", subtitle: "MARK_SUB_A"}]},
      payload: {tags: ["STALE_TAG"]},
    }],
  });
  assert.equal(layer.contentPayload.type, "chips");
  assert.equal(layer.contentPayload.items[0].title, "MARK_ITEM_A");
  assert.deepEqual(layer.payload.contentPayload, layer.contentPayload);
  assert.deepEqual(layer.payload.tags, ["MARK_ITEM_A"]);
});
