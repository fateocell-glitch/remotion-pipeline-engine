import {AbsoluteFill} from "remotion";
import {getLayoutDefinition, isLayoutKey} from "./layoutRegistry";
import {getComponentTokens, resolveComponentProps} from "../design/component-preset-resolver";
import {DemoAvatarFlip} from "./DemoEffectComponents";
import type {JasonWuCue} from "./timeline";

export {DemoAvatarFlip};

const resolveLayout = (cue: JasonWuCue) => {
  const overlayLayout = cue.effectProps?.overlayLayout;
  return isLayoutKey(overlayLayout) ? overlayLayout : cue.layout;
};

const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()).map((item) => item.trim()) : [];
const text = (props: Record<string, unknown>, key: string, fallback: string) => typeof props[key] === "string" && props[key].trim() ? props[key].trim() : fallback;
const controlledCue = (cue: JasonWuCue, props: Record<string, unknown>): JasonWuCue => {
  const headline = text(props, "headline", cue.section.subtitle);
  const eyebrow = text(props, "eyebrow", text(props, "categoryTag", cue.section.eyebrow));
  const body = text(props, "body", text(props, "effectZh", cue.caption.zh));
  const items = strings(props.steps).length ? strings(props.steps) : strings(props.items).length ? strings(props.items) : strings(props.units).length ? strings(props.units) : strings(props.comments).length ? strings(props.comments) : cue.steps?.map((step) => step.title) ?? [];
  return {...cue, section: {...cue.section, subtitle: headline, eyebrow}, caption: {...cue.caption, zh: body}, steps: items.map((title, index) => ({index: (index + 1 < 10 ? "0" : "") + String(index + 1), title, subtitle: "", active: false, tone: "blue"}))};
};

export const LayoutEffectRenderer: React.FC<{cue: JasonWuCue; layout?: JasonWuCue["layout"]}> = ({cue, layout}) => {
  const definition = getLayoutDefinition(layout ?? cue.layout);
  const Component = definition.component;
  const props = {...definition.defaultProps, ...resolveComponentProps(layout ?? cue.layout, cue.effectProps)};
  const inheritedTokens = getComponentTokens(layout ?? cue.layout);
  const tokens = (props.designTokens && typeof props.designTokens === "object" ? props.designTokens : inheritedTokens) as typeof inheritedTokens;
  return <AbsoluteFill style={{padding: tokens.padding, gap: tokens.gap, ["--component-accent" as string]: tokens.accentColor} as React.CSSProperties}><Component cue={controlledCue(cue, props)} props={props} /></AbsoluteFill>;
};

export const DemoEffectAdditions: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const layout = resolveLayout(cue);
  const definition = getLayoutDefinition(layout);
  return definition.renderLayer === "enhancement" ? <LayoutEffectRenderer cue={cue} layout={layout} /> : null;
};
