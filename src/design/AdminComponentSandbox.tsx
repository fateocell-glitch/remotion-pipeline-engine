import React from "react";
import {AbsoluteFill} from "remotion";
import {LayoutEffectHeader, LayoutEffectRenderer} from "../JasonWu/DemoEffectAdditions";
import {MotionWrapper} from "../JasonWu/components/common/MotionWrapper";
import type {BaseLayerCommonProps, JasonWuCue} from "../JasonWu/timeline";
import {normalizeComponentContent, toRendererContentProps} from "./component-content";

type SandboxTokens = {padding?:number; gap?:number; position?:BaseLayerCommonProps["position"]; scale?:number; headerScale?:number; contentScale?:number; spring?:BaseLayerCommonProps["enterAnimation"]; sfx?:BaseLayerCommonProps["sfx"]; accentColor?:string; mountMode?:"center"|"left"|"right"|"top"|"bottom"|"top-left"; mountX?:number; mountY?:number; boundsX?:number; boundsY?:number; boundsWidth?:number; boundsHeight?:number};
type SandboxProps = {layout:JasonWuCue["layout"]; tokens:SandboxTokens; mockData:Record<string, unknown>};

export const AdminComponentSandbox: React.FC<SandboxProps> = ({layout, tokens, mockData}) => {
  const base = normalizeComponentContent(mockData);
  const contentProps = toRendererContentProps(mockData);
  const cue: JasonWuCue = {id:"admin-sandbox",start:0,end:4,layout,section:{eyebrow:base.category,subtitle:base.headline},caption:{zh:String(contentProps.body ?? contentProps.effectText ?? "展示可编辑的真实组件预设"),en:"Live component sandbox"},effectProps:{...mockData,...contentProps,designTokens:tokens}};
  const commonProps: Partial<BaseLayerCommonProps> = {position:tokens.position ?? "center",scale:tokens.scale ?? 1,enterAnimation:tokens.spring ?? "spring-up",sfx:tokens.sfx ?? "none"};
  const auditValues = Object.keys(contentProps).reduce<string[]>((values, key) => {const value = contentProps[key]; const list = Array.isArray(value) ? value : [value]; return values.concat(list.map((item) => typeof item === "string" || typeof item === "number" ? String(item) : "").filter(Boolean));}, []);
  const auditText = [base.category, base.headline, ...auditValues].join(" ");
  return <AbsoluteFill data-component-audit={auditText} style={{background:"#090d16",["--primary-accent" as string]:tokens.accentColor ?? "#00F2FE"} as React.CSSProperties}><LayoutEffectHeader cue={cue} /><MotionWrapper commonProps={commonProps} designTokens={tokens} beatDuration={4} entranceDurationSeconds={2.2}><LayoutEffectRenderer cue={cue} showStandardHeader={false} /></MotionWrapper></AbsoluteFill>;
};



