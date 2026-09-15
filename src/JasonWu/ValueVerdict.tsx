import React from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {LayoutEffectProps} from "./DemoEffectComponents";
import type {SemanticAccent} from "./timeline";
import {getAccentTheme} from "../design/tokens";

const clean = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const metricText = (value: unknown) => value === undefined || value === null ? "" : String(value).trim();
const accentOf = (value: unknown): SemanticAccent => ["blue", "green", "yellow", "red"].includes(String(value)) ? String(value) as SemanticAccent : "blue";

export const ValueVerdict: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const title = clean(props?.headline, cue.section.subtitle);
  const body = clean(props?.body, clean(props?.effectText, cue.caption.zh));
  const value = metricText(props?.metricValue ?? props?.value ?? cue.metric?.value);
  const label = clean(props?.metricLabel, clean(props?.label, cue.metric?.label ?? "KEY SIGNAL"));
  const unit = clean(props?.metricUnit, clean(props?.unit, cue.metric?.suffix ?? ""));
  const hasMetric = Boolean(value);
  const theme = getAccentTheme(accentOf(props?.accent));
  const opacity = interpolate(frame, [start, start + 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const translateX = interpolate(frame, [start, start + 24], [-42, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return <div style={{position:"absolute",left:86,top:300,width:hasMetric?760:620,padding:"26px 30px 24px",borderRadius:14,color:"#FFFFFF",background:"rgba(5,12,21,.76)",border:"1px solid " + theme.primary,boxShadow:"0 12px 34px rgba(0,0,0,.32), 0 0 26px " + theme.glow,opacity,transform:"translateX("+translateX+"px)"}}>
    <div style={{color:theme.primary,fontSize:17,fontWeight:950,letterSpacing:4}}>VALUE VERDICT</div>
    <div style={{marginTop:10,maxWidth:hasMetric?430:560,fontSize:42,lineHeight:"52px",fontWeight:950,overflowWrap:"break-word"}}>{title}</div>
    {body ? <div style={{marginTop:12,maxWidth:hasMetric?430:560,color:"rgba(255,255,255,.78)",fontSize:25,lineHeight:"34px",fontWeight:750,overflowWrap:"break-word"}}>{body}</div> : null}
    {hasMetric ? <div style={{position:"absolute",right:24,top:24,minWidth:210,padding:"16px 18px",borderRadius:12,background:theme.bg,border:"1px solid " + theme.primary,textAlign:"right",opacity:interpolate(frame,[start+12,start+28],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}),transform:"scale("+interpolate(frame,[start+12,start+28],[.9,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})+")"}}><div style={{fontSize:14,fontWeight:950,letterSpacing:2,color:theme.primary}}>{label}</div><div style={{marginTop:2,fontSize:52,lineHeight:"58px",fontWeight:950}}>{value}</div>{unit ? <div style={{fontSize:21,fontWeight:900,color:"rgba(255,255,255,.8)"}}>{unit}</div> : null}</div> : null}
  </div>;
};

