import type {BaseLayerCommonProps, CommercialTextRole, JasonWuCue, SemanticAccent} from "./timeline";

export type LayerLayoutProps = {sceneMode?: "speaker" | "cinematic"; align?: "left" | "right"};
export type EffectLayer = {
  layerId: string;
  layout: JasonWuCue["layout"];
  category?: string;
  headline?: string;
  effectText?: string;
  textRole?: CommercialTextRole;
  role?: CommercialTextRole;
  accent?: SemanticAccent;
  contentPayload?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  effectProps?: Record<string, unknown>;
  layoutProps?: LayerLayoutProps;
  commonProps?: Partial<BaseLayerCommonProps>;
  enterOffset?: number;
};

type LayeredCue = Pick<JasonWuCue, "layout" | "effectProps"> & {section?: JasonWuCue["section"]; caption?: JasonWuCue["caption"]; layers?: EffectLayer[]};
const clean = (value: unknown, fallback = "") => typeof value === "string" ? value.trim() : fallback;
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const normalizedOffset = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
const textRole = (value: unknown): CommercialTextRole | undefined => ["hook", "chain", "metric", "risk", "verdict"].indexOf(String(value || "")) >= 0 ? String(value) as CommercialTextRole : undefined;
const accent = (value: unknown): SemanticAccent => ["blue", "green", "yellow", "red"].indexOf(String(value)) >= 0 ? String(value) as SemanticAccent : "blue";
const normalizeCommonProps = (value: Partial<BaseLayerCommonProps> | undefined, legacyEnterOffset?: number): BaseLayerCommonProps => ({enterOffset: normalizedOffset(value?.enterOffset ?? legacyEnterOffset), exitOffset: normalizedOffset(value?.exitOffset), duration: typeof value?.duration === "number" && value.duration > 0 ? value.duration : undefined, offsetX: value?.offsetX ?? 0, offsetY: value?.offsetY ?? 0, scale: Math.min(1.2, Math.max(0.72, value?.scale ?? 1)), enterAnimation: value?.enterAnimation ?? "spring-up", exitAnimation: value?.exitAnimation ?? "none", sfx: value?.sfx ?? "none", faceAvoidanceMode: value?.faceAvoidanceMode ?? "auto"});
const normalizeLayoutProps = (layer: EffectLayer): LayerLayoutProps => { const source = record(layer.layoutProps); const common = record(layer.commonProps); const sceneMode = source.sceneMode === "speaker" || source.sceneMode === "cinematic" ? source.sceneMode : common.sceneModeOverride === "speaker_mode" ? "speaker" : common.sceneModeOverride === "cinematic_mode" ? "cinematic" : undefined; const align = source.align === "left" || source.align === "right" ? source.align : common.alignOverride === "left" || common.alignOverride === "right" ? common.alignOverride : undefined; return {...(sceneMode ? {sceneMode} : {}), ...(align ? {align} : {})}; };
const payloadFor = (layer: EffectLayer) => {const contentPayload=record(layer.contentPayload);const payload=record(layer.payload);if(Object.keys(contentPayload).length)return {...payload, contentPayload};if(Object.keys(payload).length)return payload;const legacy={...record(layer.effectProps)};["category","eyebrow","categoryTag","headline","title","effectText","effectZh","body","contentPayload"].forEach((key)=>delete legacy[key]);return legacy;};
const normalizeLayer = (cue: LayeredCue, layer: EffectLayer | undefined, index: number): EffectLayer => {
  const current = layer ?? {layerId: "layer-1", layout: cue.layout};
  const legacy = record(current.effectProps);
  const payload = payloadFor(current);
  const role = textRole(current.role) ?? textRole(current.textRole) ?? textRole(payload.role) ?? textRole(payload.textRole) ?? textRole(legacy.role) ?? textRole(legacy.textRole);
  const semanticAccent = accent(current.accent ?? payload.accent ?? legacy.accent);
  const contentPayload = record(payload.contentPayload);
  return {layerId: clean(current.layerId, "layer-" + (index + 1)), layout: current.layout ?? cue.layout, category: clean(current.category, clean(legacy.category, clean(legacy.eyebrow, clean(legacy.categoryTag, cue.section?.eyebrow ?? "DESIGN SYSTEM")))), headline: clean(current.headline, clean(legacy.headline, clean(legacy.title, cue.section?.subtitle ?? "核心观点"))), effectText: clean(current.effectText, clean(legacy.effectText, clean(legacy.effectZh, clean(legacy.body, cue.caption?.zh ?? "")))), ...(role ? {textRole: role, role} : {}), accent: semanticAccent, ...(Object.keys(contentPayload).length ? {contentPayload} : {}), payload: {...payload, ...(Object.keys(contentPayload).length ? {contentPayload} : {}), ...(role ? {role} : {}), accent: semanticAccent}, layoutProps: normalizeLayoutProps(current), commonProps: normalizeCommonProps(current.commonProps, current.enterOffset), enterOffset: normalizedOffset(current.commonProps?.enterOffset ?? current.enterOffset)};
};

export const normalizeCueLayers = (cue: LayeredCue): EffectLayer[] => Array.isArray(cue.layers) && cue.layers.length ? cue.layers.map((layer,index)=>normalizeLayer(cue,layer,index)) : [normalizeLayer(cue,undefined,0)];
export const activeLayerAtTime = (cue: LayeredCue, seconds: number): EffectLayer => normalizeCueLayers(cue).reduce((active, layer) => normalizedOffset(layer.commonProps?.enterOffset ?? layer.enterOffset) <= seconds ? layer : active, normalizeCueLayers(cue)[0]);
export const layerCue = (cue: JasonWuCue, layer: EffectLayer): JasonWuCue => {const motionEnterOffset=normalizedOffset(layer.commonProps?.enterOffset ?? layer.enterOffset);const category=clean(layer.category,cue.section.eyebrow);const headline=clean(layer.headline,cue.section.subtitle);const effectText=clean(layer.effectText,cue.caption.zh);const layerContentPayload=record(layer.contentPayload);const rawPayload=record(layer.payload);const contentPayload=Object.keys(layerContentPayload).length?layerContentPayload:record(rawPayload.contentPayload);const payload={...rawPayload,...(Object.keys(contentPayload).length?{contentPayload}:{})};const body=clean(payload.body,clean(payload.bodyText,effectText));const isNativeJc=String(layer.layout).startsWith("jc-");return {...cue,start: motionEnterOffset,end:Math.max(0.01,cue.end-cue.start),section:{...cue.section,eyebrow:category,subtitle:headline},caption:{...cue.caption,zh:effectText},layout:layer.layout,effectProps:{...payload,textRole:layer.textRole ?? textRole(payload.textRole),role:layer.role ?? textRole(payload.role) ?? layer.textRole ?? textRole(payload.textRole),accent:layer.accent ?? accent(payload.accent),...(isNativeJc ? {__jcUseLayerAccent:true}: {}),category,eyebrow:category,categoryTag:category,headline,title:headline,effectText:clean(payload.effectText,effectText),effectZh:clean(payload.effectZh,effectText),body,__projectLayer:true,__externalSectionLabel:true},layers:undefined};};

