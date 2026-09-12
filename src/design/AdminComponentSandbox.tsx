import React from "react";
import {AbsoluteFill} from "remotion";
import {LayoutEffectRenderer} from "../JasonWu/DemoEffectAdditions";
import {MotionWrapper} from "../JasonWu/components/common/MotionWrapper";
import type {BaseLayerCommonProps, JasonWuCue} from "../JasonWu/timeline";

type SandboxTokens = {padding?:number; gap?:number; position?:BaseLayerCommonProps["position"]; scale?:number; spring?:BaseLayerCommonProps["enterAnimation"]; sfx?:BaseLayerCommonProps["sfx"]; accentColor?:string; mountMode?:"center"|"left"|"right"|"top"|"bottom"|"top-left"; mountX?:number; mountY?:number; boundsX?:number; boundsY?:number; boundsWidth?:number; boundsHeight?:number};
type SandboxProps = {layout:JasonWuCue["layout"]; tokens:SandboxTokens; mockData:Record<string, unknown>};

export const AdminComponentSandbox: React.FC<SandboxProps> = ({layout, tokens, mockData}) => {
  const cue: JasonWuCue = {id:"admin-sandbox",start:0,end:4,layout,section:{eyebrow:String(mockData.eyebrow ?? "DESIGN SYSTEM"),subtitle:String(mockData.headline ?? mockData.title ?? "核心设计信号")},caption:{zh:String(mockData.effectText ?? mockData.effectZh ?? mockData.body ?? "展示可编辑的真实组件预设"),en:"Live component sandbox"},effectProps:{...mockData,designTokens:tokens}};
  const commonProps: Partial<BaseLayerCommonProps> = {position:tokens.position ?? "center",scale:tokens.scale ?? 1,enterAnimation:tokens.spring ?? "spring-up",sfx:tokens.sfx ?? "none"};
  return <AbsoluteFill style={{background:"#090d16",["--primary-accent" as string]:tokens.accentColor ?? "#00F2FE"} as React.CSSProperties}><MotionWrapper commonProps={commonProps} designTokens={tokens} beatDuration={4} entranceDurationSeconds={2.2}><LayoutEffectRenderer cue={cue} /></MotionWrapper></AbsoluteFill>;
};
