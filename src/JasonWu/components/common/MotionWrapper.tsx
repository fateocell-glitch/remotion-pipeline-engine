import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {BaseLayerCommonProps, CommercialTextRole, SemanticAccent} from "../../timeline";

type LayoutProps = {sceneMode?: "speaker" | "cinematic"; align?: "left" | "right"};
type MountTokens = {mountMode?: "center" | "left" | "right" | "top" | "bottom" | "top-left"; mountX?: number; mountY?: number; boundsX?: number; boundsY?: number; boundsWidth?: number; boundsHeight?: number; presenterSafeInset?: "left" | "right" | "bottom"; cinematicCenterCorridorPct?: number; bottomSubtitleSafePct?: number};
const BOTTOM_SUBTITLE_SAFE_PCT = 22;

export const DEFAULT_COMMON_PROPS: BaseLayerCommonProps = {enterOffset: 0, exitOffset: 0, offsetX: 0, offsetY: 0, scale: 1, enterAnimation: "spring-up", exitAnimation: "none", sfx: "none"};

export const MotionWrapper: React.FC<{commonProps?: Partial<BaseLayerCommonProps>; layoutProps?: LayoutProps; designTokens?: MountTokens; beatDuration: number; entranceDurationSeconds?: number; textRole?: CommercialTextRole; accent?: SemanticAccent; language?: "zh" | "en"; preserveNativeMotion?: boolean; children: React.ReactNode}> = ({commonProps, layoutProps, designTokens, beatDuration, entranceDurationSeconds = 2.2, textRole, language = "zh", preserveNativeMotion = false, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const props = {...DEFAULT_COMMON_PROPS, ...(commonProps ?? {})};
  const enterFrames = Math.max(0, Math.round(props.enterOffset * fps));
  const fixedFrames = props.duration ? Math.max(1, Math.round(props.duration * fps)) : Math.max(1, Math.round(beatDuration * fps) - enterFrames - Math.round((props.exitOffset ?? 0) * fps));
  const exitStart = Math.min(Math.max(enterFrames + 1, Math.round(beatDuration * fps) - Math.round((props.exitOffset ?? 0) * fps)), enterFrames + fixedFrames);
  const entranceFrames = Math.max(1, Math.round(entranceDurationSeconds * fps));
  const enterProgress = preserveNativeMotion ? 1 : interpolate(frame, [enterFrames, enterFrames + entranceFrames], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const exitProgress = props.exitAnimation === "none" ? 0 : interpolate(frame, [exitStart, exitStart + 14], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const mountMode = layoutProps?.align ?? designTokens?.mountMode ?? "center";
  const mountX = Number.isFinite(designTokens?.mountX) ? Number(designTokens?.mountX) : 0;
  const mountY = Number.isFinite(designTokens?.mountY) ? Number(designTokens?.mountY) : 0;
  const boundsX = Number.isFinite(designTokens?.boundsX) ? Number(designTokens?.boundsX) : 0;
  const boundsY = Number.isFinite(designTokens?.boundsY) ? Number(designTokens?.boundsY) : 0;
  const boundsWidth = Math.max(1, Number.isFinite(designTokens?.boundsWidth) ? Number(designTokens?.boundsWidth) : 1920);
  const boundsHeight = Math.max(1, Number.isFinite(designTokens?.boundsHeight) ? Number(designTokens?.boundsHeight) : 1080);
  const presenterSafeInset = designTokens?.presenterSafeInset;
  const centeredOffsetX = 960 - (boundsX + boundsWidth / 2) + mountX;
  const centeredOffsetY = 540 - (boundsY + boundsHeight / 2) + mountY;
  const mountOffsetX = mountMode === "top-left" ? mountX : mountMode === "left" ? 96 - boundsX + mountX : mountMode === "right" ? 1824 - (boundsX + boundsWidth) + mountX : centeredOffsetX;
  const rawMountOffsetY = mountMode === "top-left" ? mountY : mountMode === "top" ? 216 - boundsY + mountY : mountMode === "bottom" ? 864 - (boundsY + boundsHeight) + mountY : centeredOffsetY;
  const bottomSubtitleSafePx = 1080 * ((Number.isFinite(designTokens?.bottomSubtitleSafePct) ? Number(designTokens?.bottomSubtitleSafePct) : BOTTOM_SUBTITLE_SAFE_PCT) / 100);
  const maxMountOffsetY = 1080 - bottomSubtitleSafePx - boundsY - boundsHeight;
  const isFullCanvasBounds = boundsX === 0 && boundsY === 0 && boundsWidth >= 1920 && boundsHeight >= 1080;
  const clampedMountOffsetY = isFullCanvasBounds ? rawMountOffsetY : Math.min(rawMountOffsetY, maxMountOffsetY);
  const enterX = props.enterAnimation === "slide-left" ? interpolate(enterProgress, [0, 1], [-110, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : props.enterAnimation === "slide-right" ? interpolate(enterProgress, [0, 1], [110, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
  const enterY = props.enterAnimation === "spring-up" ? interpolate(enterProgress, [0, 1], [76, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
  const enterScale = props.enterAnimation === "fade-scale" ? interpolate(enterProgress, [0, 1], [0.86, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1;
  const exitY = props.exitAnimation === "slide-down" ? interpolate(exitProgress, [0, 1], [0, 96]) : 0;
  const exitScale = props.exitAnimation === "scale-down" ? interpolate(exitProgress, [0, 1], [1, 0.86]) : 1;
  const opacity = frame < enterFrames && !preserveNativeMotion ? 0 : props.exitAnimation === "fade-out" ? 1 - exitProgress : enterProgress;
  const scale = Math.min(1.2, Math.max(.35, props.scale ?? 1)) * enterScale * exitScale;
  const isEnglish = language === "en";
  const englishTextCss = isEnglish ? ".motion-language-en .layout-effect-root :is(div,span,p,h1,h2,h3){min-width:0!important;overflow-wrap:break-word!important;word-break:keep-all!important;hyphens:auto!important}.motion-language-en .layout-effect-root{font-size:.85em;line-height:1.38}" : "";
  const commercialTextCss = !textRole ? "" : ".motion-commercial-analysis [style*=\"color: white\"],.motion-commercial-analysis [style*=\"color: #F8FAFC\"]{-webkit-text-stroke:none!important;text-shadow:0 5px 18px rgba(0,0,0,0.52)!important}" + (textRole === "risk" ? ".motion-text-role-risk [style*=\"color: #FF6B6B\"]{background:rgba(162,36,48,.92);padding:4px 10px;border-radius:5px;-webkit-text-stroke:none!important}" : "");
  return <AbsoluteFill className={[textRole ? "motion-commercial-analysis motion-text-role-" + textRole : "", isEnglish ? "motion-language-en" : ""].filter(Boolean).join(" ")} style={{pointerEvents: "none", opacity, transform: "translate(" + (mountOffsetX + (props.offsetX ?? 0) + enterX) + "px," + (clampedMountOffsetY + (props.offsetY ?? 0) + enterY + exitY) + "px) scale(" + scale + ")", transformOrigin: (mountMode === "top-left" || presenterSafeInset === "left" ? boundsX : presenterSafeInset === "right" ? boundsX + boundsWidth : boundsX + boundsWidth / 2) + "px " + (mountMode === "top-left" ? boundsY : boundsY + boundsHeight / 2) + "px", wordBreak: "keep-all", overflowWrap: "break-word", hyphens: "auto", lineHeight: isEnglish ? 1.38 : undefined, fontSize: isEnglish ? "0.85em" : undefined} as React.CSSProperties}><style>{englishTextCss + commercialTextCss}</style>{children}</AbsoluteFill>;
};