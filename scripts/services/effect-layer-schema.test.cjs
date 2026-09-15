const assert = require("node:assert/strict");
const test = require("node:test");

const {normalizeBeatLayers, validEffectLayers} = require("./effect-layer-schema.cjs");

test("normalizes a legacy layout into one editable effect layer", () => {
  assert.deepEqual(
    normalizeBeatLayers({
      layout: "chapter-card",
      effectProps: {headline: "Start"},
    }),
    [
      {
        layerId: "layer-1",
        layout: "chapter-card",
        category: "DESIGN SYSTEM",
        headline: "Start",
        effectText: "",
        accent: "blue",
        payload: {accent: "blue", contentPayload: {type: "narrative", bodyText: ""}},
        commonProps: {enterOffset: 0, exitOffset: 0, duration: undefined, position: "center", offsetX: 0, offsetY: 0, scale: 1, enterAnimation: "spring-up", exitAnimation: "none", sfx: "none"},
        enterOffset: 0,
      },
    ],
  );
});

test("accepts an ordered two-layer effect stack", () => {
  assert.equal(
    validEffectLayers(
      [
        {layerId: "chapter", layout: "chapter-card", enterOffset: 0},
        {layerId: "metric", layout: "value-verdict", effectProps: {headline: "12.0"}, enterOffset: 1},
      ],
      new Set(["chapter-card", "value-verdict"]),
    ),
    true,
  );
});

test("preserves explicit scene mode and alignment overrides through layer normalization", () => {
  const [layer] = normalizeBeatLayers({
    layout: "hud-glow-stack",
    start: 0,
    end: 25,
    layers: [{
      layerId: "layer-1",
      layout: "hud-glow-stack",
      commonProps: {position: "bottom-right", sceneModeOverride: "speaker_mode", alignOverride: "left"},
    }],
  });
  assert.equal(layer.commonProps.sceneModeOverride, "speaker_mode");
  assert.equal(layer.commonProps.alignOverride, "left");
  assert.equal(layer.commonProps.position, "bottom-right");
});
test("repairs a legacy second Layer that defaults to zero and overlaps the first Layer", () => {
  const layers = normalizeBeatLayers({
    start: 0,
    end: 30.44,
    layout: "chapter-card",
    layers: [
      {layerId: "layer-1", layout: "chapter-card", commonProps: {enterOffset: 0, duration: 12.03, exitAnimation: "fade-out"}},
      {layerId: "layer-2", layout: "chapter-card", commonProps: {enterOffset: 0, exitAnimation: "none"}},
    ],
  });
  assert.equal(layers[0].commonProps.duration, 12.03);
  assert.equal(layers[1].commonProps.enterOffset, 12.53);
  assert.equal(layers[1].enterOffset, 12.53);
  assert.equal(layers[1].commonProps.duration, 17.91);
});
