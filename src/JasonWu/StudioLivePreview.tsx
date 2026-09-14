import React, {useCallback, useEffect, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {Player, type PlayerRef} from "@remotion/player";
import {AbsoluteFill} from "remotion";
import {LAYOUT_BY_KEY} from "./layoutRegistry";
import type {JasonWuCue} from "./timeline";
import type {LayoutEffectProps} from "./DemoEffectComponents";
import {getComponentPreset, getComponentTokens} from "../design/component-preset-resolver";

type PreviewPayload={previewKey:string;mode:"library"|"custom";layout:string};
type DirectLayerCanvasProps=LayoutEffectProps&{ActiveVisualComponent:React.ComponentType<LayoutEffectProps>;accentColor:string};

// This is only the full-size composition root required by absolute-positioned templates.
const DirectLayerCanvas:React.FC<DirectLayerCanvasProps>=({cue,props,ActiveVisualComponent,accentColor})=><AbsoluteFill style={{position:"relative",overflow:"hidden",background:"#090d16",["--primary-accent" as string]:accentColor}}><ActiveVisualComponent cue={cue} props={props}/></AbsoluteFill>;

const PreviewApp:React.FC<{payload:PreviewPayload}>=({payload})=>{
  const definition=LAYOUT_BY_KEY.get(payload.layout as JasonWuCue["layout"]);
  const ActiveVisualComponent=definition?.component;
  const playerRef=useRef<PlayerRef>(null);
  const replayTimer=useRef<number|undefined>(undefined);
  const [playing,setPlaying]=useState(false);
  const clearReplayTimer=useCallback(()=>{if(replayTimer.current!==undefined){window.clearTimeout(replayTimer.current);replayTimer.current=undefined}},[]);
  const reset=useCallback(()=>{clearReplayTimer();playerRef.current?.pause();playerRef.current?.seekTo(0);setPlaying(false)},[clearReplayTimer]);
  const replay=useCallback(()=>{clearReplayTimer();playerRef.current?.seekTo(0);playerRef.current?.play();setPlaying(true);replayTimer.current=window.setTimeout(()=>setPlaying(false),4000)},[clearReplayTimer]);
  useEffect(()=>{const timer=window.setTimeout(replay,0);return()=>{window.clearTimeout(timer);clearReplayTimer()}},[replay,clearReplayTimer]);
  if(!ActiveVisualComponent)return null;
  const preset=getComponentPreset(payload.layout as JasonWuCue["layout"]);
  const mockData={...definition.defaultProps,...(preset?.mockData??{})};
  const templateText=(key:string,fallback:string)=>typeof mockData[key]==="string"?mockData[key]:fallback;
  const tokens=getComponentTokens(payload.layout as never);
  const accentColor=String(tokens.accentColor??"#00F2FE");
  const cue:JasonWuCue={
    id:payload.previewKey,
    start:0,
    end:4,
    layout:payload.layout as JasonWuCue["layout"],
    section:{eyebrow:templateText("category",templateText("eyebrow","DESIGN SYSTEM")),subtitle:templateText("headline",templateText("title","核心设计信号"))},
    caption:{zh:templateText("effectText",templateText("body","展示可编辑的真实组件预设")),en:"Template preview"},
    effectProps:{...mockData,designTokens:tokens},
  };
  return <div title="当前 Layer 动画预览" onMouseEnter={replay} onMouseLeave={reset} style={{position:"relative",width:"100%",height:"100%",display:"grid",placeItems:"center",overflow:"hidden",background:"#090d16"}}>
    <Player
      ref={playerRef}
      key={payload.previewKey}
      component={DirectLayerCanvas}
      inputProps={{cue,props:cue.effectProps,ActiveVisualComponent,accentColor}}
      durationInFrames={120}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      initialFrame={0}
      style={{width:"100%",height:"100%"}}
      controls={false}
      loop={false}
    />
    <button type="button" aria-label="播放当前效果模板" onClick={replay} className={playing?"hover-preview-pill active":"hover-preview-pill"} style={{pointerEvents:"auto",cursor:"pointer"}}><span className="hover-preview-icon">{playing?"↻":"▶"}</span><span>{playing?"playing":"hover to play"}</span></button>
  </div>;
};

type PreviewHost={render:(container:HTMLElement,payload:PreviewPayload)=>void;unmount:(container:HTMLElement)=>void};
const roots=new WeakMap<HTMLElement,ReturnType<typeof createRoot>>();
const previewHost:PreviewHost={
  render(container,payload){
    let root=roots.get(container);
    if(!root){root=createRoot(container);roots.set(container,root)}
    root.render(<PreviewApp key={payload.previewKey} payload={payload}/>);
  },
  unmount(container){
    const root=roots.get(container);
    if(!root)return;
    root.unmount();
    roots.delete(container);
  },
};
(window as unknown as {StudioLayoutPreview:PreviewHost}).StudioLayoutPreview=previewHost;
window.dispatchEvent(new Event("studio-layout-preview-ready"));

