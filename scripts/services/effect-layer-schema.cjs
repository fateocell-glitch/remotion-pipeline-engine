"use strict";

const normalizedOffset = (value) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
const normalizeCommonProps = (value, legacyEnterOffset) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {enterOffset: normalizedOffset(source.enterOffset ?? legacyEnterOffset), exitOffset: normalizedOffset(source.exitOffset), duration: typeof source.duration === "number" && Number.isFinite(source.duration) && source.duration > 0 ? source.duration : undefined, position: ["center","bottom-left","bottom-right","top-right","center-right"].includes(source.position) ? source.position : "center", offsetX: typeof source.offsetX === "number" && Number.isFinite(source.offsetX) ? source.offsetX : 0, offsetY: typeof source.offsetY === "number" && Number.isFinite(source.offsetY) ? source.offsetY : 0, scale: Math.min(1.2, Math.max(0.8, typeof source.scale === "number" && Number.isFinite(source.scale) ? source.scale : 1)), enterAnimation: ["spring-up","fade-scale","slide-left","slide-right","glitch"].includes(source.enterAnimation) ? source.enterAnimation : "spring-up", exitAnimation: ["fade-out","slide-down","scale-down","none"].includes(source.exitAnimation) ? source.exitAnimation : "none", sfx: ["whoosh","tech-click","pop","none"].includes(source.sfx) ? source.sfx : "none"};
};

const normalizeBeatLayers = (beat) => {
  if (Array.isArray(beat?.layers) && beat.layers.length > 0) {
    return beat.layers.map((layer, index) => ({
      layerId: typeof layer?.layerId === "string" && layer.layerId ? layer.layerId : `layer-${index + 1}`,
      layout: layer?.layout,
      effectProps: layer?.effectProps && typeof layer.effectProps === "object" && !Array.isArray(layer.effectProps)
        ? layer.effectProps
        : {},
      commonProps: normalizeCommonProps(layer?.commonProps, layer?.enterOffset),
      enterOffset: normalizedOffset(layer?.commonProps?.enterOffset ?? layer?.enterOffset),
    }));
  }

  return [
    {
      layerId: "layer-1",
      layout: beat?.layout,
      effectProps: beat?.effectProps && typeof beat.effectProps === "object" && !Array.isArray(beat.effectProps)
        ? beat.effectProps
        : {},
      commonProps: normalizeCommonProps(undefined, 0),
      enterOffset: 0,
    },
  ];
};

const validEffectLayers = (layers, layouts) =>
  Array.isArray(layers) &&
  layers.length > 0 &&
  layers.every((layer) =>
    layer &&
    typeof layer.layerId === "string" &&
    layer.layerId.length > 0 &&
    typeof layer.layout === "string" &&
    layouts.has(layer.layout) &&
    (layer.effectProps === undefined || (typeof layer.effectProps === "object" && !Array.isArray(layer.effectProps))) &&
    (layer.commonProps === undefined || (typeof layer.commonProps === "object" && !Array.isArray(layer.commonProps))) &&
    (layer.enterOffset === undefined || (typeof layer.enterOffset === "number" && Number.isFinite(layer.enterOffset) && layer.enterOffset >= 0)),
  );

module.exports = {normalizeBeatLayers, normalizeCommonProps, validEffectLayers};
