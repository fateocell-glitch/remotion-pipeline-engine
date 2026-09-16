declare const require: (path: string) => unknown;
import type {BaseLayerCommonProps, JasonWuCue} from "../JasonWu/timeline";
import registryJson from "./components.registry.json";

const {resolveFaceAwareLayer} = require("../../scripts/services/face-aware-layout.cjs") as {resolveFaceAwareLayer: (input: Record<string, unknown>) => {layout: string; commonProps: Partial<BaseLayerCommonProps>; tokens: Record<string, unknown>; avoidance: Record<string, unknown>}};
export type ComponentDesignTokens = {padding:number; gap:number; position?:BaseLayerCommonProps["position"]; scale:number; headerScale:number; contentScale:number; spring:BaseLayerCommonProps["enterAnimation"]; sfx:BaseLayerCommonProps["sfx"]; accentColor:string; defaultItemCount:number; staggerFrames:number; mountMode:"center"|"left"|"right"|"top"|"bottom"|"top-left"; mountX:number; mountY:number; boundsX:number; boundsY:number; boundsWidth:number; boundsHeight:number; presenterSafeMaxWidth?:number; presenterSafeLogicalWidth?:number; presenterSafeInset?:"left"|"right"|"bottom"; cinematicCenterCorridorPct?:number; bottomSubtitleSafePct?:number};
type Tokens = ComponentDesignTokens;
type ComponentPreset = {id:string; family?:string; displayIntent?:"side-overlay"|"fullscreen-modal"; version:number; occupancyScore?:number; faceAvoidanceEligible?:boolean; tokens:Tokens; sfx:{enter:string; exit:string; volume:number}; defaultPayload?:Record<string, unknown>; mockData:Record<string, unknown>};
type Registry = {components:ComponentPreset[]};
export type FaceZone = {faceX:number; faceY:number; faceW:number; faceH:number; safeX?:number; safeY?:number; safeW?:number; safeH?:number; faceArea:"left"|"center"|"right"; detectorVersion?:string; sourceFingerprint?:string; faceAreaRatio?:number; areaRatio?:number; facePresenceRatio?:number; presenceRatio?:number; durationRatio?:number};
type LayoutProps = {sceneMode?:"speaker"|"cinematic";align?:"left"|"right"};
const registry = registryJson as unknown as Registry;
const fallbackTokens: Tokens = {padding:48,gap:16,scale:1,headerScale:1,contentScale:1,spring:"spring-up",sfx:"none",accentColor:"#00F2FE",defaultItemCount:1,staggerFrames:15,mountMode:"center",mountX:0,mountY:0,boundsX:0,boundsY:0,boundsWidth:1920,boundsHeight:1080};
export const getComponentPreset = (layout: JasonWuCue["layout"]): ComponentPreset | undefined => registry.components.find((component) => component.id === layout);
export const getComponentTokens = (layout: JasonWuCue["layout"]): Tokens => ({...fallbackTokens, ...(getComponentPreset(layout)?.tokens ?? {})});
const isTokenObject = (value: unknown): value is Partial<Tokens> => !!value && typeof value === "object" && !Array.isArray(value);
export const resolveComponentProps = (layout: JasonWuCue["layout"], effectProps: Record<string, unknown> | undefined): Record<string, unknown> => { const preset = getComponentPreset(layout); return {defaultPayload: preset?.defaultPayload ?? preset?.mockData?.contentPayload, ...(effectProps ?? {}), designTokens:{...getComponentTokens(layout), ...(isTokenObject(effectProps?.designTokens) ? effectProps.designTokens : {})}, designPresetVersion:preset?.version ?? 0}; };
export const resolveMotionWithPreset = (layout: JasonWuCue["layout"], commonProps: Partial<BaseLayerCommonProps> | undefined): Partial<BaseLayerCommonProps> => { const tokens = getComponentTokens(layout); const source = commonProps ?? {}; return {...source, scale: typeof source.scale === "number" && source.scale !== 1 ? source.scale : tokens.scale, enterAnimation: source.enterAnimation && source.enterAnimation !== "spring-up" ? source.enterAnimation : tokens.spring, sfx: source.sfx && source.sfx !== "none" ? source.sfx : tokens.sfx}; };
export const resolveFaceAwareLayerForRender = (
  layout: JasonWuCue["layout"],
  commonProps: Partial<BaseLayerCommonProps> | undefined,
  layoutProps?: LayoutProps,
  faceZone?: FaceZone | null,
  beatIndex = 0,
  sceneMode?: "speaker_mode" | "cinematic_mode",
  language?: "zh" | "en",
) => {
  const sourceTokens = getComponentTokens(layout);
  const sourcePreset = getComponentPreset(layout);
  const resolved = resolveFaceAwareLayer({
    layout,
    commonProps: resolveMotionWithPreset(layout, commonProps),
    layoutProps,
    tokens: sourceTokens,
    faceZone,
    family: sourcePreset?.family,
    displayIntent: sourcePreset?.displayIntent ?? "side-overlay",
    candidates: registry.components,
    beatIndex,
    sceneMode,
    language,
  });
  const effectiveLayout = resolved.layout as JasonWuCue["layout"];
  const candidateTokens = getComponentTokens(effectiveLayout);
  return {
    layout: effectiveLayout,
    commonProps: resolveMotionWithPreset(effectiveLayout, resolved.commonProps),
    tokens: {...candidateTokens, ...resolved.tokens} as Tokens,
    avoidance: resolved.avoidance,
  };
};
