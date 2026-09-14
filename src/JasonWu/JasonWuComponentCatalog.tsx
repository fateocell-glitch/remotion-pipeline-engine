import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import {LayoutEffectRenderer} from "./DemoEffectAdditions";
import {componentCatalog, COMPONENT_CATALOG_SECONDS} from "./componentCatalog";
import {getLayoutDefinition} from "./layoutRegistry";
import type {JasonWuCue} from "./timeline";

const CatalogScene: React.FC<{index: number}> = ({index}) => {
  const item = componentCatalog[index];
  const definition = getLayoutDefinition(item.layout);
  const cue: JasonWuCue = {
    id: `catalog-${item.layout}`,
    start: 0,
    end: COMPONENT_CATALOG_SECONDS,
    section: {eyebrow: item.en.toUpperCase(), subtitle: item.zh},
    caption: {zh: "Standard / visual component library", en: "JasonWu component catalog"},
    layout: item.layout,
    effectProps: {...definition.defaultProps, __externalSectionLabel: true},
    steps: [
      {index: "01", title: "Core Signal", subtitle: "KEY SIGNAL", active: true, tone: "blue"},
      {index: "02", title: "Action Path", subtitle: "FLOW SYSTEM", active: true, tone: "gold"},
      {index: "03", title: "Decision Result", subtitle: "FINAL OUTPUT", active: true, tone: "blue"},
    ],
  };

  return (
    <AbsoluteFill style={{background: "#000000", fontFamily: "Inter, Noto Sans SC, Microsoft YaHei UI, Microsoft YaHei, sans-serif", overflow: "hidden"}}>
      <div style={{position: "absolute", left: 64, top: 52, zIndex: 20}}>
        <div style={{color: "#0A84FF", fontSize: 17, fontWeight: 950, letterSpacing: 4}}>JASONWU COMPONENT CATALOG</div>
        <div style={{marginTop: 9, color: "#FFFFFF", fontSize: 30, fontWeight: 950}}>{(index + 1 < 10 ? "0" : "") + String(index + 1)} · {item.zh}</div>
        <div style={{marginTop: 7, color: "rgba(255,255,255,.58)", fontSize: 15, fontWeight: 900, letterSpacing: 2}}>{item.en} · {item.category.toUpperCase()} · 5 SEC</div>
      </div>
      <div style={{position: "absolute", left: 64, right: 64, top: 145, height: 1, background: "rgba(255,255,255,.14)"}} />
      <LayoutEffectRenderer cue={cue} layout={item.layout} />
    </AbsoluteFill>
  );
};

export const JasonWuComponentCatalog: React.FC = () => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const framesPerScene = COMPONENT_CATALOG_SECONDS * fps;
  const activeIndex = Math.min(componentCatalog.length - 1, Math.floor(frame / framesPerScene));

  return (
    <AbsoluteFill style={{"--primary-accent": "#0A84FF", "--card-panel": "rgba(3,8,15,.82)"} as React.CSSProperties}>
      {componentCatalog.map((item, index) => (
        <Sequence key={item.layout} from={index * framesPerScene} durationInFrames={framesPerScene}>
          <CatalogScene index={index === activeIndex ? activeIndex : index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

