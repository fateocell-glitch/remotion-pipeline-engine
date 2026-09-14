import type {BaseLayerCommonProps, JasonWuCue} from "./timeline";

export type EffectLayer = {
  layerId: string;
  layout: JasonWuCue["layout"];
  category?: string;
  headline?: string;
  effectText?: string;
  payload?: Record<string, unknown>;
  effectProps?: Record<string, unknown>;
  commonProps?: Partial<BaseLayerCommonProps>;
  enterOffset?: number;
};

type LayeredCue = Pick<JasonWuCue, "layout" | "effectProps"> & {section?: JasonWuCue["section"]; caption?: JasonWuCue["caption"]; layers?: EffectLayer[]};
const clean = (value: unknown, fallback = "") => typeof value === "string" ? value.trim() : fallback;
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const normalizedOffset = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
const normalizeCommonProps = (value: Partial<BaseLayerCommonProps> | undefined, legacyEnterOffset?: number): BaseLayerCommonProps => ({enterOffset: normalizedOffset(value?.enterOffset ?? legacyEnterOffset), exitOffset: normalizedOffset(value?.exitOffset), duration: typeof value?.duration === "number" && value.duration > 0 ? value.duration : undefined, position: value?.position ?? "center", offsetX: value?.offsetX ?? 0, offsetY: value?.offsetY ?? 0, scale: Math.min(1.2, Math.max(0.72, value?.scale ?? 1)), enterAnimation: value?.enterAnimation ?? "spring-up", exitAnimation: value?.exitAnimation ?? "none", sfx: value?.sfx ?? "none", faceAvoidanceMode: value?.faceAvoidanceMode ?? "auto"});
const payloadFor = (layer: EffectLayer) => {const payload=record(layer.payload);if(Object.keys(payload).length)return payload;const legacy={...record(layer.effectProps)};["category","eyebrow","categoryTag","headline","title","effectText","effectZh","body","contentPayload"].forEach((key)=>delete legacy[key]);return legacy;};
const normalizeLayer = (cue: LayeredCue, layer: EffectLayer | undefined, index: number): EffectLayer => {const current=layer ?? {layerId:"layer-1",layout:cue.layout};const legacy=record(current.effectProps);return {layerId:clean(current.layerId,"layer-"+(index+1)),layout:current.layout ?? cue.layout,category:clean(current.category,clean(legacy.category,clean(legacy.eyebrow,clean(legacy.categoryTag,cue.section?.eyebrow ?? "DESIGN SYSTEM")))),headline:clean(current.headline,clean(legacy.headline,clean(legacy.title,cue.section?.subtitle ?? "核心观点"))),effectText:clean(current.effectText,clean(legacy.effectText,clean(legacy.effectZh,clean(legacy.body,cue.caption?.zh ?? "")))),payload:payloadFor(current),commonProps:normalizeCommonProps(current.commonProps,current.enterOffset),enterOffset:normalizedOffset(current.commonProps?.enterOffset ?? current.enterOffset)};};

export const normalizeCueLayers = (cue: LayeredCue): EffectLayer[] => Array.isArray(cue.layers) && cue.layers.length ? cue.layers.map((layer,index)=>normalizeLayer(cue,layer,index)) : [normalizeLayer(cue,undefined,0)];
export const activeLayerAtTime = (cue: LayeredCue, seconds: number): EffectLayer => normalizeCueLayers(cue).reduce((active, layer) => normalizedOffset(layer.commonProps?.enterOffset ?? layer.enterOffset) <= seconds ? layer : active, normalizeCueLayers(cue)[0]);
export const layerCue = (cue: JasonWuCue, layer: EffectLayer): JasonWuCue => {const motionEnterOffset=normalizedOffset(layer.commonProps?.enterOffset ?? layer.enterOffset);const category=clean(layer.category,cue.section.eyebrow);const headline=clean(layer.headline,cue.section.subtitle);const effectText=clean(layer.effectText,cue.caption.zh);return {...cue,start: motionEnterOffset,end:Math.max(0.01,cue.end-cue.start),section:{...cue.section,eyebrow:category,subtitle:headline},caption:{...cue.caption,zh:effectText},layout:layer.layout,effectProps:{...(layer.payload ?? {}),category,eyebrow:category,categoryTag:category,headline,title:headline,effectText,effectZh:effectText,body:effectText,__externalSectionLabel: true},layers:undefined};};

