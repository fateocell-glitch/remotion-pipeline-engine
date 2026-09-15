import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {getLayoutDefinition, isLayoutKey} from "./layoutRegistry";
import {getComponentTokens, resolveComponentProps} from "../design/component-preset-resolver";
import {normalizeComponentContent, toRendererContentProps} from "../design/component-content";
import {DemoAvatarFlip} from "./DemoEffectComponents";
import type {JasonWuCue, SemanticAccent} from "./timeline";
import {getAccentTheme} from "../design/tokens";

export {DemoAvatarFlip};

const resolveLayout = (cue: JasonWuCue) => {
  const overlayLayout = cue.effectProps?.overlayLayout;
  return isLayoutKey(overlayLayout) ? overlayLayout : cue.layout;
};

const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()).map((item) => item.trim()) : [];
const numberToken = (props: Record<string, unknown>, key: string, fallback: number) => Number.isFinite(Number(props[key])) ? Math.max(.6, Math.min(1.2, Number(props[key]))) : fallback;
const text = (props: Record<string, unknown>, key: string, fallback: string) => typeof props[key] === "string" ? String(props[key]) : fallback;
const controlledCue = (cue: JasonWuCue, props: Record<string, unknown>): JasonWuCue => {
  const normalized = normalizeComponentContent(props);
  const contentProps = toRendererContentProps(props);
  const body = text(contentProps, "body", text(contentProps, "effectText", cue.caption.zh));
  const values = strings(contentProps.steps).length ? strings(contentProps.steps) : strings(contentProps.items).length ? strings(contentProps.items) : strings(contentProps.units).length ? strings(contentProps.units) : strings(contentProps.comments).length ? strings(contentProps.comments) : cue.steps?.map((step) => step.title) ?? [];
  return {...cue, section: {...cue.section, subtitle: normalized.headline, eyebrow: normalized.category}, caption: {...cue.caption, zh: body}, steps: values.map((title, index) => ({index: (index + 1 < 10 ? "0" : "") + String(index + 1), title, subtitle: "", active: false, tone: "blue"}))};
};

const semanticAccents = new Set<SemanticAccent>(["blue", "green", "yellow", "red"]);
const headerAccentOf = (value: unknown): SemanticAccent => semanticAccents.has(value as SemanticAccent) ? value as SemanticAccent : "blue";

export const StandardComponentHeader: React.FC<{category: string; headline: string; accent?: SemanticAccent}> = ({category, headline, accent = "blue"}) => {
  const frame = useCurrentFrame();
  const theme = getAccentTheme(accent);
  const headerFadeIn = interpolate(frame, [0, 15], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return <div className="static-header-anchor" style={{position: "absolute", left: 76, top: 58, zIndex: 50, maxWidth: 860, pointerEvents: "none", opacity: headerFadeIn, borderLeft: "5px solid " + theme.primary, paddingLeft: 18, textShadow: "0 2px 14px rgba(0,0,0,0.55)"}}><div style={{color: theme.primary, fontSize: 22, fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", textShadow: "0 0 20px " + theme.glow}}>{category}</div><div style={{marginTop: 8, color: "#FFFFFF", fontSize: 44, lineHeight: 1.1, fontWeight: 900}}>{headline}</div></div>;
};
const resolveHeaderContent = (cue: JasonWuCue, layout?: JasonWuCue["layout"]) => {
  const sourceProps = {...getLayoutDefinition(layout ?? cue.layout).defaultProps, ...resolveComponentProps(layout ?? cue.layout, cue.effectProps)};
  const content = normalizeComponentContent(sourceProps);
  return {...content, category: typeof cue.section?.eyebrow === "string" ? cue.section.eyebrow : content.category, headline: typeof cue.section?.subtitle === "string" ? cue.section.subtitle : content.headline};
};
export const LayoutEffectHeader: React.FC<{cue: JasonWuCue; layout?: JasonWuCue["layout"]}> = ({cue, layout}) => { const content = resolveHeaderContent(cue, layout); const accent = headerAccentOf(cue.effectProps?.accent ?? cue.effectProps?.contentPayload?.accent); return <StandardComponentHeader category={content.category} headline={content.headline} accent={accent} />; };

export const LayoutEffectRenderer: React.FC<{cue: JasonWuCue; layout?: JasonWuCue["layout"]; showStandardHeader?: boolean}> = ({cue, layout, showStandardHeader = true}) => {
  const definition = getLayoutDefinition(layout ?? cue.layout);
  const Component = definition.component;
  const sourceProps = {...definition.defaultProps, ...resolveComponentProps(layout ?? cue.layout, cue.effectProps)};
  const normalized = normalizeComponentContent(sourceProps);
  const props: Record<string, unknown> = {...sourceProps, ...toRendererContentProps(sourceProps), __externalSectionLabel: true};
  const inheritedTokens = getComponentTokens(layout ?? cue.layout);
  const tokens = (props.designTokens && typeof props.designTokens === "object" ? props.designTokens : inheritedTokens) as typeof inheritedTokens;
  const isCopyOpen = String(layout ?? cue.layout).startsWith("copyopen-");
  const isJcLayout = String(layout ?? cue.layout).startsWith("jc-");
  const contentScale = isJcLayout ? 1 : numberToken(props, "contentScale", 1);
  const contentSlotStyle = isCopyOpen ? {
    position: "absolute",
    left: tokens.boundsX,
    top: tokens.boundsY,
    width: tokens.boundsWidth,
    height: tokens.boundsHeight,
    transform: "scale(" + contentScale + ")",
    transformOrigin: "top left",
    overflow: "visible",
  } as React.CSSProperties : {
    position: "absolute",
    inset: 0,
    transform: "scale(" + contentScale + ")",
    transformOrigin: "top left",
  } as React.CSSProperties;
  return <AbsoluteFill className="layout-effect-root component-container" style={{padding: tokens.padding, gap: tokens.gap, ["--component-accent" as string]: tokens.accentColor} as React.CSSProperties}>{showStandardHeader && !isJcLayout ? <StandardComponentHeader category={normalized.category} headline={normalized.headline} /> : null}<div className="layout-effect-content animated-content-slot" style={contentSlotStyle}><Component cue={controlledCue(cue, props)} props={props} /></div></AbsoluteFill>;
};

export const DemoEffectAdditions: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const layout = resolveLayout(cue);
  const definition = getLayoutDefinition(layout);
  return definition.renderLayer === "enhancement" ? <LayoutEffectRenderer cue={cue} layout={layout} /> : null;
};


