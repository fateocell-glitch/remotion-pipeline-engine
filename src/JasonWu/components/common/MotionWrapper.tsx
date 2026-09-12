import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {BaseLayerCommonProps} from "../../timeline";
import {getContrastStyle} from "../../utils/contrast";

type MountTokens = {
  mountMode?: "center" | "left" | "right" | "top" | "bottom" | "top-left";
  mountX?: number;
  mountY?: number;
  boundsX?: number;
  boundsY?: number;
  boundsWidth?: number;
  boundsHeight?: number;
};

const anchors: Record<BaseLayerCommonProps["position"], [number, number]> = {
  center: [0, 0],
  "bottom-left": [-470, 260],
  "bottom-right": [470, 260],
  "top-right": [470, -245],
  "center-right": [520, 0],
};

export const DEFAULT_COMMON_PROPS: BaseLayerCommonProps = {
  enterOffset: 0,
  exitOffset: 0,
  position: "center",
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  enterAnimation: "spring-up",
  exitAnimation: "none",
  sfx: "none",
};

export const MotionWrapper: React.FC<{commonProps?: Partial<BaseLayerCommonProps>; designTokens?: MountTokens; beatDuration: number; entranceDurationSeconds?: number; autoContrastStroke?: boolean; children: React.ReactNode}> = ({commonProps, designTokens, beatDuration, entranceDurationSeconds = 2.2, autoContrastStroke = true, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const props = {...DEFAULT_COMMON_PROPS, ...(commonProps ?? {})};
  const enterFrames = Math.max(0, Math.round(props.enterOffset * fps));
  const fixedFrames = props.duration ? Math.max(1, Math.round(props.duration * fps)) : Math.max(1, Math.round(beatDuration * fps) - enterFrames - Math.round((props.exitOffset ?? 0) * fps));
  const exitStart = Math.min(Math.max(enterFrames + 1, Math.round(beatDuration * fps) - Math.round((props.exitOffset ?? 0) * fps)), enterFrames + fixedFrames);
  const entranceFrames = Math.max(1, Math.round(entranceDurationSeconds * fps));
  const enterProgress = interpolate(frame, [enterFrames, enterFrames + entranceFrames], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const exitProgress = props.exitAnimation === "none" ? 0 : interpolate(frame, [exitStart, exitStart + 14], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const hiddenBeforeEnter = frame < enterFrames;
  const [anchorX, anchorY] = anchors[props.position];
  const mountMode = designTokens?.mountMode ?? "center";
  const mountX = Number.isFinite(designTokens?.mountX) ? Number(designTokens?.mountX) : 0;
  const mountY = Number.isFinite(designTokens?.mountY) ? Number(designTokens?.mountY) : 0;
  const boundsX = Number.isFinite(designTokens?.boundsX) ? Number(designTokens?.boundsX) : 0;
  const boundsY = Number.isFinite(designTokens?.boundsY) ? Number(designTokens?.boundsY) : 0;
  const boundsWidth = Math.max(1, Number.isFinite(designTokens?.boundsWidth) ? Number(designTokens?.boundsWidth) : 1920);
  const boundsHeight = Math.max(1, Number.isFinite(designTokens?.boundsHeight) ? Number(designTokens?.boundsHeight) : 1080);
  const centeredOffsetX = 960 - (boundsX + boundsWidth / 2) + mountX;
  const centeredOffsetY = 540 - (boundsY + boundsHeight / 2) + mountY;
  const mountOffsetX = mountMode === "top-left" ? 76 - boundsX + mountX : mountMode === "left" ? 96 - boundsX + mountX : mountMode === "right" ? 1824 - (boundsX + boundsWidth) + mountX : centeredOffsetX;
  const mountOffsetY = mountMode === "top-left" ? 156 - boundsY + mountY : mountMode === "top" ? 216 - boundsY + mountY : mountMode === "bottom" ? 864 - (boundsY + boundsHeight) + mountY : centeredOffsetY;
  const enterX = props.enterAnimation === "slide-left" ? interpolate(enterProgress, [0, 1], [-110, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : props.enterAnimation === "slide-right" ? interpolate(enterProgress, [0, 1], [110, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
  const enterY = props.enterAnimation === "spring-up" ? interpolate(enterProgress, [0, 1], [76, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
  const enterScale = props.enterAnimation === "fade-scale" ? interpolate(enterProgress, [0, 1], [0.86, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : props.enterAnimation === "glitch" ? 1 + Math.sin(frame * 2.2) * (frame < enterFrames + 10 ? 0.015 : 0) : 1;
  const exitY = props.exitAnimation === "slide-down" ? interpolate(exitProgress, [0, 1], [0, 96]) : 0;
  const exitScale = props.exitAnimation === "scale-down" ? interpolate(exitProgress, [0, 1], [1, 0.86]) : 1;
  const opacity = hiddenBeforeEnter ? 0 : props.exitAnimation === "fade-out" ? 1 - exitProgress : interpolate(enterProgress, [0, 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const scale = Math.min(1.2, Math.max(0.8, props.scale ?? 1)) * enterScale * exitScale;

  const whiteContrast = getContrastStyle("#FFFFFF", autoContrastStroke);
  const darkContrast = getContrastStyle("#000000", autoContrastStroke);
  const contrastCss = [
    ".motion-auto-contrast [style*=\"color: rgb(255, 255, 255)\"],",
    ".motion-auto-contrast [style*=\"color: white\"],",
    ".motion-auto-contrast [style*=\"color: rgba(255, 255, 255\"] {",
    "-webkit-text-stroke:var(--contrast-white-stroke);text-shadow:var(--contrast-white-shadow);",
    "}",
    ".motion-auto-contrast [style*=\"color: rgb(0, 0, 0)\"],",
    ".motion-auto-contrast [style*=\"color: black\"],",
    ".motion-auto-contrast [style*=\"color: rgb(11, 15, 23)\"],",
    ".motion-auto-contrast [style*=\"color: rgb(17, 24, 39)\"] {",
    "-webkit-text-stroke:var(--contrast-dark-stroke);text-shadow:var(--contrast-dark-shadow);",
    "}",
  ].join("");

  return <AbsoluteFill className="motion-auto-contrast" style={{
    pointerEvents: "none",
    opacity,
    transform: "translate(" + (mountOffsetX + anchorX + (props.offsetX ?? 0) + enterX) + "px," + (mountOffsetY + anchorY + (props.offsetY ?? 0) + enterY + exitY) + "px) scale(" + scale + ")",
    transformOrigin: (boundsX + boundsWidth / 2) + "px " + (boundsY + boundsHeight / 2) + "px",
    wordBreak: "keep-all",
    overflowWrap: "break-word",
    "--contrast-white-stroke": whiteContrast.WebkitTextStroke ?? "none",
    "--contrast-white-shadow": whiteContrast.textShadow ?? "none",
    "--contrast-dark-stroke": darkContrast.WebkitTextStroke ?? "none",
    "--contrast-dark-shadow": darkContrast.textShadow ?? "none",
  } as React.CSSProperties}>
    <style>{contrastCss}</style>
    {children}
  </AbsoluteFill>;
};
