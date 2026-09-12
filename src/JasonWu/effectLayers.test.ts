const assertDeepEqual = (actual: unknown, expected: unknown) => {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`Expected ${right}, received ${left}`);
  }
};

import {normalizeCueLayers} from "./effectLayers";

const legacyCue = {
  layout: "chapter-card" as const,
  effectProps: {headline: "Opening signal"},
};

assertDeepEqual(normalizeCueLayers(legacyCue), [
  {layerId: "layer-1", layout: "chapter-card", effectProps: {headline: "Opening signal"}, enterOffset: 0},
]);

const layeredCue = {
  layout: "chapter-card" as const,
  layers: [
    {layerId: "chapter", layout: "chapter-card" as const},
    {layerId: "metric", layout: "value-verdict" as const, effectProps: {headline: "12.0"}, enterOffset: 1.25},
  ],
};

assertDeepEqual(normalizeCueLayers(layeredCue), [
  {layerId: "chapter", layout: "chapter-card", effectProps: {}, enterOffset: 0},
  {layerId: "metric", layout: "value-verdict", effectProps: {headline: "12.0"}, enterOffset: 1.25},
]);