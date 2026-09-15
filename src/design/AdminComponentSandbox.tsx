import React from "react";
import {AbsoluteFill} from "remotion";
import {LayoutEffectHeader, LayoutEffectRenderer} from "../JasonWu/DemoEffectAdditions";
import {getLayoutDefinition} from "../JasonWu/layoutRegistry";
import {MotionWrapper} from "../JasonWu/components/common/MotionWrapper";
import {JcNativeStageBackdrop} from "../JasonWu/JcNativeRecipes";
import type {BaseLayerCommonProps, JasonWuCue, SemanticAccent} from "../JasonWu/timeline";
import {normalizeComponentContent, toRendererContentProps} from "./component-content";

type SandboxTokens = {padding?:number; gap?:number; position?:BaseLayerCommonProps["position"]; scale?:number; headerScale?:number; contentScale?:number; spring?:BaseLayerCommonProps["enterAnimation"]; sfx?:BaseLayerCommonProps["sfx"]; accentColor?:string; mountMode?:"center"|"left"|"right"|"top"|"bottom"|"top-left"; mountX?:number; mountY?:number; boundsX?:number; boundsY?:number; boundsWidth?:number; boundsHeight?:number};
type SandboxProps = {layout:JasonWuCue["layout"]; tokens:SandboxTokens; mockData:Record<string, unknown>};
const resolveSandboxAccent = (requested: unknown, color: unknown): SemanticAccent => {
  if (["blue", "green", "yellow", "red"].indexOf(String(requested)) >= 0) return String(requested) as SemanticAccent;
  const hex = String(color ?? "").match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!hex) return "blue";
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  if (red > green * 1.25 && red > blue * 1.25) return "red";
  if (green > red * 1.15 && green > blue * 1.15) return "green";
  if (red > 140 && green > 110 && blue < 150) return "yellow";
  return "blue";
};

export const AdminComponentSandbox: React.FC<SandboxProps> = ({layout, tokens, mockData}) => {
  const base = normalizeComponentContent(mockData);
  const contentProps = toRendererContentProps(mockData);
  const commonProps: Partial<BaseLayerCommonProps> = {position:tokens.position ?? "center",scale:tokens.scale ?? 1,enterAnimation:tokens.spring ?? "spring-up",sfx:tokens.sfx ?? "none"};
  const definition = getLayoutDefinition(layout);
  const isNativeJc = String(layout).startsWith("jc-");
  const sandboxAccent = resolveSandboxAccent(mockData.accent, tokens.accentColor);
  const cue: JasonWuCue = {id:"admin-sandbox",start:0,end:4,layout,section:{eyebrow:base.category,subtitle:base.headline},caption:{zh:String(contentProps.body ?? contentProps.effectText ?? "展示可编辑的真实组件预设"),en:"Live component sandbox"},effectProps:{...mockData,...contentProps,accent:sandboxAccent,designTokens:tokens,...(isNativeJc?{__jcStageBackdropProvided:true}:{}),...(definition.usesInternalMotionWrapper?{__jcMotion:{commonProps,designTokens:tokens,beatDuration:4,entranceDurationSeconds:2.2,accent:sandboxAccent}}:{})}};
  const auditValues = Object.keys(contentProps).reduce<string[]>((values, key) => {const value = contentProps[key]; const list = Array.isArray(value) ? value : [value]; return values.concat(list.map((item) => typeof item === "string" || typeof item === "number" ? String(item) : "").filter(Boolean));}, []);
  const auditText = [base.category, base.headline, ...auditValues].join(" ");
  const scene = <LayoutEffectRenderer cue={cue} showStandardHeader={false} />;
  const stage = isNativeJc ? <JcNativeStageBackdrop>{scene}</JcNativeStageBackdrop> : scene;
  const shellStyle = {...(isNativeJc ? {} : {background:"#090d16"}),["--primary-accent" as string]:tokens.accentColor ?? "#00F2FE"} as React.CSSProperties;
  return <AbsoluteFill data-component-audit={auditText} style={shellStyle}><LayoutEffectHeader cue={cue} />{definition.usesInternalMotionWrapper?stage:<MotionWrapper commonProps={commonProps} designTokens={tokens} beatDuration={4} entranceDurationSeconds={2.2}>{stage}</MotionWrapper>}</AbsoluteFill>;
};



