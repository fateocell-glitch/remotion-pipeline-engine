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
        effectProps: {headline: "Start"},
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
