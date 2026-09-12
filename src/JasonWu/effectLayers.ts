import type {BaseLayerCommonProps, JasonWuCue} from "./timeline";

export type EffectLayer = {
  layerId: string;
  layout: JasonWuCue["layout"];
  effectProps?: Record<string, unknown>;
  commonProps?: Partial<BaseLayerCommonProps>;
  enterOffset?: number;
};

type LayeredCue = Pick<JasonWuCue, "layout" | "effectProps"> & {
  layers?: EffectLayer[];
};

const normalizedOffset = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
const normalizeCommonProps = (value: Partial<BaseLayerCommonProps> | undefined, legacyEnterOffset?: number): BaseLayerCommonProps => ({enterOffset: normalizedOffset(value?.enterOffset ?? legacyEnterOffset), exitOffset: normalizedOffset(value?.exitOffset), duration: typeof value?.duration === "number" && value.duration > 0 ? value.duration : undefined, position: value?.position ?? "center", offsetX: value?.offsetX ?? 0, offsetY: value?.offsetY ?? 0, scale: Math.min(1.2, Math.max(0.8, value?.scale ?? 1)), enterAnimation: value?.enterAnimation ?? "spring-up", exitAnimation: value?.exitAnimation ?? "none", sfx: value?.sfx ?? "none", faceAvoidanceMode: value?.faceAvoidanceMode ?? "auto"});

export const normalizeCueLayers = (cue: LayeredCue): EffectLayer[] => {
  if (Array.isArray(cue.layers) && cue.layers.length > 0) {
    return cue.layers.map((layer, index) => ({
      layerId: typeof layer.layerId === "string" && layer.layerId ? layer.layerId : `layer-${index + 1}`,
      layout: layer.layout,
      effectProps: layer.effectProps ?? {},
      commonProps: normalizeCommonProps(layer.commonProps, layer.enterOffset),
      enterOffset: normalizedOffset(layer.commonProps?.enterOffset ?? layer.enterOffset),
    }));
  }

  return [
    {
      layerId: "layer-1",
      layout: cue.layout,
      effectProps: cue.effectProps ?? {},
      commonProps: normalizeCommonProps(undefined, 0),
      enterOffset: 0,
    },
  ];
};

export const activeLayerAtTime = (cue: LayeredCue, seconds: number): EffectLayer => {
  const layers = normalizeCueLayers(cue);
  return layers.reduce((active, layer) => (
    normalizedOffset(layer.commonProps?.enterOffset ?? layer.enterOffset) <= seconds ? layer : active
  ), layers[0]);
};

export const layerCue = (cue: JasonWuCue, layer: EffectLayer): JasonWuCue => {
  const motionEnterOffset = normalizedOffset(layer.commonProps?.enterOffset ?? layer.enterOffset);
  return {
  ...cue,
  start: motionEnterOffset,
  end: Math.max(0.01, cue.end - cue.start),
  layout: layer.layout,
  effectProps: {
    effectText: cue.effectProps?.effectText ?? cue.caption.zh,
    effectZh: cue.effectProps?.effectText ?? cue.caption.zh,
    ...(layer.effectProps ?? {}),
    __externalSectionLabel: true,
  },
  layers: undefined,
};
};