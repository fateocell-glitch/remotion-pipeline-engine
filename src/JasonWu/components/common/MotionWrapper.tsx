import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {BaseLayerCommonProps, CommercialTextRole, SemanticAccent} from "../../timeline";

type MountTokens = {
  mountMode?: "center" | "left" | "right" | "top" | "bottom" | "top-left";
  mountX?: number;
  mountY?: number;
  boundsX?: number;
  boundsY?: number;
  boundsWidth?: number;
  boundsHeight?: number;
  presenterSafeMaxWidth?: number;
  presenterSafeLogicalWidth?: number;
  presenterSafeInset?: "left" | "right" | "bottom";
  cinematicCenterCorridorPct?: number;
  bottomSubtitleSafePct?: number;
};

const BOTTOM_SUBTITLE_SAFE_PCT = 22;

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

export const MotionWrapper: React.FC<{commonProps?: Partial<BaseLayerCommonProps>; designTokens?: MountTokens; beatDuration: number; entranceDurationSeconds?: number; textRole?: CommercialTextRole; accent?: SemanticAccent; preserveNativeMotion?: boolean; children: React.ReactNode}> = ({commonProps, designTokens, beatDuration, entranceDurationSeconds = 2.2, textRole, preserveNativeMotion = false, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const props = {...DEFAULT_COMMON_PROPS, ...(commonProps ?? {})};
  const enterFrames = Math.max(0, Math.round(props.enterOffset * fps));
  const fixedFrames = props.duration ? Math.max(1, Math.round(props.duration * fps)) : Math.max(1, Math.round(beatDuration * fps) - enterFrames - Math.round((props.exitOffset ?? 0) * fps));
  const exitStart = Math.min(Math.max(enterFrames + 1, Math.round(beatDuration * fps) - Math.round((props.exitOffset ?? 0) * fps)), enterFrames + fixedFrames);
  const entranceFrames = Math.max(1, Math.round(entranceDurationSeconds * fps));
  const enterProgress = preserveNativeMotion ? 1 : interpolate(frame, [enterFrames, enterFrames + entranceFrames], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const exitProgress = props.exitAnimation === "none" ? 0 : interpolate(frame, [exitStart, exitStart + 14], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const hiddenBeforeEnter = !preserveNativeMotion && frame < enterFrames;
  const [anchorX, anchorY] = anchors[props.position] ?? anchors.center;
  const mountMode = designTokens?.mountMode ?? "center";
  const mountX = Number.isFinite(designTokens?.mountX) ? Number(designTokens?.mountX) : 0;
  const mountY = Number.isFinite(designTokens?.mountY) ? Number(designTokens?.mountY) : 0;
  const boundsX = Number.isFinite(designTokens?.boundsX) ? Number(designTokens?.boundsX) : 0;
  const boundsY = Number.isFinite(designTokens?.boundsY) ? Number(designTokens?.boundsY) : 0;
  const boundsWidth = Math.max(1, Number.isFinite(designTokens?.boundsWidth) ? Number(designTokens?.boundsWidth) : 1920);
  const boundsHeight = Math.max(1, Number.isFinite(designTokens?.boundsHeight) ? Number(designTokens?.boundsHeight) : 1080);
  const presenterSafeMaxWidth = Number.isFinite(designTokens?.presenterSafeMaxWidth) ? Number(designTokens?.presenterSafeMaxWidth) : 0;
  const presenterSafeLogicalWidth = presenterSafeMaxWidth > 0 ? Math.min(boundsWidth, Math.max(1, Number(designTokens?.presenterSafeLogicalWidth) || Math.round(presenterSafeMaxWidth / Math.max(.01, props.scale ?? 1)))) : 0;
  const presenterSafeInset = designTokens?.presenterSafeInset;
  const safeClipX = presenterSafeInset === "right" ? boundsX + Math.max(0, boundsWidth - presenterSafeLogicalWidth) : boundsX;
  const safeClipRight = presenterSafeLogicalWidth > 0 ? Math.max(0, 1920 - safeClipX - presenterSafeLogicalWidth) : 0;
  const safeClipPath = presenterSafeLogicalWidth > 0 ? "inset(" + Math.max(0, boundsY) + "px " + safeClipRight + "px " + Math.max(0, 1080 - boundsY - boundsHeight) + "px " + Math.max(0, safeClipX) + "px)" : undefined;
  const centeredOffsetX = 960 - (boundsX + boundsWidth / 2) + mountX;
  const centeredOffsetY = 540 - (boundsY + boundsHeight / 2) + mountY;
  const mountOffsetX = mountMode === "top-left" ? mountX : mountMode === "left" ? 96 - boundsX + mountX : mountMode === "right" ? 1824 - (boundsX + boundsWidth) + mountX : centeredOffsetX;
  const rawMountOffsetY = mountMode === "top-left" ? mountY : mountMode === "top" ? 216 - boundsY + mountY : mountMode === "bottom" ? 864 - (boundsY + boundsHeight) + mountY : centeredOffsetY;
  const bottomSubtitleSafePx = 1080 * ((Number.isFinite(designTokens?.bottomSubtitleSafePct) ? Number(designTokens?.bottomSubtitleSafePct) : BOTTOM_SUBTITLE_SAFE_PCT) / 100);
  const maxSafeBottomY = 1080 - bottomSubtitleSafePx;
  const maxMountOffsetY = maxSafeBottomY - boundsY - boundsHeight;
  const isFullCanvasBounds = boundsX === 0 && boundsY === 0 && boundsWidth >= 1920 && boundsHeight >= 1080;
  const clampedMountOffsetY = isFullCanvasBounds ? rawMountOffsetY : Math.min(rawMountOffsetY, maxMountOffsetY);
  const enterX = props.enterAnimation === "slide-left" ? interpolate(enterProgress, [0, 1], [-110, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : props.enterAnimation === "slide-right" ? interpolate(enterProgress, [0, 1], [110, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
  const enterY = props.enterAnimation === "spring-up" ? interpolate(enterProgress, [0, 1], [76, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
  const enterScale = props.enterAnimation === "fade-scale" ? interpolate(enterProgress, [0, 1], [0.86, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : props.enterAnimation === "glitch" ? 1 + Math.sin(frame * 2.2) * (frame < enterFrames + 10 ? 0.015 : 0) : 1;
  const exitY = props.exitAnimation === "slide-down" ? interpolate(exitProgress, [0, 1], [0, 96]) : 0;
  const exitScale = props.exitAnimation === "scale-down" ? interpolate(exitProgress, [0, 1], [1, 0.86]) : 1;
  const opacity = hiddenBeforeEnter ? 0 : props.exitAnimation === "fade-out" ? 1 - exitProgress : interpolate(enterProgress, [0, 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const scale = Math.min(1.2, Math.max(0.6, props.scale ?? 1)) * enterScale * exitScale;

  const presenterSafeCss = presenterSafeLogicalWidth > 0 ? [
    ".presenter-safe-overlay .layout-effect-root{width:var(--presenter-safe-logical-width)!important;max-width:100%!important;overflow:hidden;}",
    ".presenter-safe-overlay .layout-effect-root > *{width:100%;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}",
    ".presenter-safe-overlay .layout-effect-root [style]{max-width:100%!important;box-sizing:border-box!important;}",
  ].join("") : "";

  const commercialTextCss = !textRole ? "" : [
    ".motion-commercial-analysis [style*='color: rgb(255, 255, 255)'],.motion-commercial-analysis [style*='color: rgb(248, 250, 252)'],.motion-commercial-analysis [style*='color: #F8FAFC'],.motion-commercial-analysis [style*='color: white']{",
    "-webkit-text-stroke:none!important;text-shadow:0 5px 18px rgba(0,0,0,0.52)!important;",
    "}",
    ".motion-text-role-risk [style*='color: rgb(255, 107, 107)'],.motion-text-role-risk [style*='color: #FF6B6B']{",
    "background:rgba(162,36,48,0.92);padding:4px 10px;border-radius:5px;-webkit-text-stroke:none!important;",
    "}",
  ].join("");
  return <AbsoluteFill className={[textRole ? "motion-commercial-analysis motion-text-role-" + textRole : "", presenterSafeLogicalWidth > 0 ? "presenter-safe-overlay" : ""].filter(Boolean).join(" ")} style={{
    pointerEvents: "none",
    opacity,
    transform: "translate(" + (mountOffsetX + anchorX + (props.offsetX ?? 0) + enterX) + "px," + (clampedMountOffsetY + anchorY + (props.offsetY ?? 0) + enterY + exitY) + "px) scale(" + scale + ")",
    transformOrigin: (mountMode === "top-left" || presenterSafeInset === "left" ? boundsX : presenterSafeInset === "right" ? boundsX + boundsWidth : boundsX + boundsWidth / 2) + "px " + (mountMode === "top-left" ? boundsY : boundsY + boundsHeight / 2) + "px",
    clipPath: safeClipPath,
    "--presenter-safe-logical-width": presenterSafeLogicalWidth + "px",
    "--cinematic-center-corridor-pct": String(designTokens?.cinematicCenterCorridorPct ?? 0),
    wordBreak: "keep-all",
    overflowWrap: "break-word",
  } as React.CSSProperties}>
    <style>{presenterSafeCss + commercialTextCss}</style>
    {children}
  </AbsoluteFill>;
};
