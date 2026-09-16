"use strict";

const SIDE_OVERLAY_WIDTH = Math.round(1920 / 3);
const MIN_OVERLAY_SCALE = .35;
const SAFE_ISLAND_WIDTH = SIDE_OVERLAY_WIDTH;
const SAFE_ISLAND_SCALE = 1;
const ENGLISH_SAFE_WIDTH = SIDE_OVERLAY_WIDTH;
const ENGLISH_SAFE_SCALE = 1;
const CINEMATIC_WIDE_WIDTH = SIDE_OVERLAY_WIDTH;
const CINEMATIC_WIDE_SCALE = 1;
const CINEMATIC_CENTER_CORRIDOR_PCT = 35;
const BOTTOM_SUBTITLE_SAFE_PCT = 22;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const copy = (value) => ({...(value || {})});
const area = (rect) => Math.max(0, rect.w) * Math.max(0, rect.h);
const overlapArea = (left, right) => Math.max(0, Math.min(left.x + left.w, right.x + right.w) - Math.max(left.x, right.x)) * Math.max(0, Math.min(left.y + left.h, right.y + right.h) - Math.max(left.y, right.y));

function safeRect(faceZone) {
  if (!faceZone || !Number.isFinite(Number(faceZone.faceX)) || !Number.isFinite(Number(faceZone.faceY))) return null;
  return {x: clamp(Number(faceZone.safeX ?? faceZone.faceX), 0, 1), y: clamp(Number(faceZone.safeY ?? faceZone.faceY), 0, 1), w: clamp(Number(faceZone.safeW ?? faceZone.faceW), .01, 1), h: clamp(Number(faceZone.safeH ?? faceZone.faceH), .01, 1)};
}

function componentRect(tokens, commonProps) {
  const width = clamp(Number(tokens.boundsWidth || 1180) / 1920, .18, 1);
  const height = clamp(Number(tokens.boundsHeight || 520) / 1080, .12, 1);
  const scale = clamp(Number(commonProps.scale ?? tokens.scale ?? 1), MIN_OVERLAY_SCALE, 1.2);
  const w = width * scale, h = height * scale;
  const mode = tokens.mountMode || "center";
  let x = .5 - w / 2, y = .5 - h / 2;
  if (mode === "left") x = .05;
  if (mode === "right") x = .95 - w;
  if (mode === "top") y = .2;
  if (mode === "bottom") y = .8 - h;
  if (mode === "top-left") { x = .04; y = .145; }
  x += Number(commonProps.offsetX || 0) / 1920;
  y += Number(commonProps.offsetY || 0) / 1080;
  return {x: clamp(x, -1, 1), y: clamp(y, -1, 1), w, h};
}

function normalizedFaceCenterX(faceZone) {
  const x = Number(faceZone?.faceX);
  const w = Number(faceZone?.faceW);
  if (Number.isFinite(x) && Number.isFinite(w)) return clamp(x + w / 2, 0, 1);
  return .5;
}

function detectSceneMode({faceZone, sceneMode, beatIndex = 0, align} = {}) {
  const explicitMode = sceneMode === "speaker_mode" || sceneMode === "cinematic_mode" ? sceneMode : null;
  const face = safeRect(faceZone);
  const faceAreaRatio = Number(faceZone?.faceAreaRatio ?? faceZone?.areaRatio ?? (face ? Number(faceZone?.faceW || face.w) * Number(faceZone?.faceH || face.h) : 0));
  const facePresenceRatio = Number(faceZone?.facePresenceRatio ?? faceZone?.presenceRatio ?? faceZone?.durationRatio ?? (face ? 1 : 0));
  const isSpeaker = explicitMode ? explicitMode === "speaker_mode" : Boolean(face && faceAreaRatio > .10 && facePresenceRatio > .50);
  const scene = isSpeaker ? "speaker_mode" : "cinematic_mode";
  let nextAlign = align === "left" || align === "right" ? align : null;
  if (!nextAlign && scene === "speaker_mode") {
    const faceArea = faceZone?.faceArea || (normalizedFaceCenterX(faceZone) > .5 ? "right" : "left");
    nextAlign = faceArea === "right" ? "left" : faceArea === "left" ? "right" : "left";
  }
  if (!nextAlign) nextAlign = Number(beatIndex || 0) % 2 === 0 ? "left" : "right";
  return {sceneMode: scene, align: nextAlign, faceZone: face ? {...faceZone, faceAreaRatio, facePresenceRatio} : null, faceAreaRatio, facePresenceRatio};
}

function fitSideOverlay(tokens, commonProps) {
  const rawBoundsWidth = Number(tokens.boundsWidth);
  const authoredWidth = Number.isFinite(rawBoundsWidth) && rawBoundsWidth > 0 ? rawBoundsWidth : 1180;
  const fitScale = SIDE_OVERLAY_WIDTH / authoredWidth;
  tokens.presenterSafeMaxWidth = SIDE_OVERLAY_WIDTH;
  tokens.presenterSafeLogicalWidth = authoredWidth;
  commonProps.scale = Math.min(Number(commonProps.scale ?? 1), fitScale);
}

function applyPresenterSafeIsland(tokens, commonProps, faceZone, align) {
  const faceArea = faceZone?.faceArea || "center";
  const side = align === "left" || align === "right" ? align : faceArea === "right" ? "left" : faceArea === "left" ? "right" : "left";
  fitSideOverlay(tokens, commonProps);
  tokens.mountMode = side;
  tokens.presenterSafeInset = side;
  tokens.bottomSubtitleSafePct = BOTTOM_SUBTITLE_SAFE_PCT;
  if (side === "left") commonProps.offsetX = Math.min(Number(commonProps.offsetX || 0), 0);
  else commonProps.offsetX = Math.max(Number(commonProps.offsetX || 0), 0);
  return faceArea === "center" ? "presenter-safe-center-" + side : "presenter-safe-" + faceArea;
}

function applyCinematicWing(tokens, commonProps, align) {
  const side = align === "right" ? "right" : "left";
  fitSideOverlay(tokens, commonProps);
  tokens.mountMode = side;
  tokens.presenterSafeInset = side;
  tokens.cinematicCenterCorridorPct = CINEMATIC_CENTER_CORRIDOR_PCT;
  tokens.bottomSubtitleSafePct = BOTTOM_SUBTITLE_SAFE_PCT;
  commonProps.offsetX = side === "left" ? Math.min(Number(commonProps.offsetX || 0), 0) : Math.max(Number(commonProps.offsetX || 0), 0);
  return "cinematic-wide-" + side;
}

function resolveFaceAwareLayer({layout, commonProps, layoutProps, tokens, faceZone, family, candidates, displayIntent = "side-overlay", sceneMode, beatIndex = 0, language}) {
  const sourceCommon = copy(commonProps);
  const sourceTokens = copy(tokens);
  const sourceLayout = copy(layoutProps);
  const explicitSceneMode = sourceLayout.sceneMode === "speaker" ? "speaker_mode" : sourceLayout.sceneMode === "cinematic" ? "cinematic_mode" : sceneMode;
  const explicitAlign = sourceLayout.align === "left" || sourceLayout.align === "right" ? sourceLayout.align : undefined;
  const scene = detectSceneMode({faceZone, sceneMode: explicitSceneMode, beatIndex, align: explicitAlign});
  const face = safeRect(scene.faceZone);
  const base = {layout, commonProps: sourceCommon, tokens: sourceTokens, avoidance: {applied: false, reason: scene.sceneMode === "cinematic_mode" ? "cinematic" : "no-face", collision: 0, faceArea: scene.faceZone?.faceArea || null, displayIntent, sceneMode: scene.sceneMode, align: scene.align}};
  if (displayIntent === "fullscreen-modal") return {...base, avoidance: {...base.avoidance, reason: "fullscreen-modal"}};
  if (sourceCommon.faceAvoidanceMode === "manual" && !explicitAlign && !sourceLayout.sceneMode) return {...base, avoidance: {...base.avoidance, reason: "manual"}};
  if (scene.sceneMode === "cinematic_mode") {
    const nextCommon = copy(sourceCommon);
    const nextTokens = copy(sourceTokens);
    const reason = applyCinematicWing(nextTokens, nextCommon, scene.align, language);
    return {layout, commonProps: nextCommon, tokens: nextTokens, avoidance: {...base.avoidance, applied: true, reason, maxWidth: nextTokens.presenterSafeMaxWidth}};
  }
  if (!face) {
    const nextCommon = copy(sourceCommon);
    const nextTokens = copy(sourceTokens);
    fitSideOverlay(nextTokens, nextCommon);
    nextTokens.mountMode = scene.align;
    nextTokens.presenterSafeInset = scene.align;
    nextTokens.bottomSubtitleSafePct = BOTTOM_SUBTITLE_SAFE_PCT;
    nextCommon.offsetX = scene.align === "left" ? Math.min(Number(nextCommon.offsetX || 0), 0) : Math.max(Number(nextCommon.offsetX || 0), 0);
    return {layout, commonProps: nextCommon, tokens: nextTokens, avoidance: {...base.avoidance, applied: true, reason: "side-lane-" + scene.align, maxWidth: nextTokens.presenterSafeMaxWidth}};
  }
  const before = componentRect(sourceTokens, sourceCommon);
  const collision = area(face) ? overlapArea(before, face) / area(face) : 0;
  const nextCommon = copy(sourceCommon);
  const nextTokens = copy(sourceTokens);
  const faceArea = scene.faceZone.faceArea || "center";
  const reason = applyPresenterSafeIsland(nextTokens, nextCommon, scene.faceZone, scene.align, language);
  const after = componentRect(nextTokens, nextCommon);
  const remaining = area(face) ? overlapArea(after, face) / area(face) : 0;
  let nextLayout = layout;
  if (remaining > .28 && Array.isArray(candidates)) {
    const currentScore = Number(candidates.find((item) => item.id === layout)?.occupancyScore ?? 1);
    const compact = candidates.filter((item) => item.family === family && item.id !== layout && item.faceAvoidanceEligible !== false && Number(item.occupancyScore ?? 1) < currentScore).sort((left, right) => Number(left.occupancyScore ?? 1) - Number(right.occupancyScore ?? 1))[0];
    if (compact) nextLayout = compact.id;
  }
  return {layout: nextLayout, commonProps: nextCommon, tokens: nextTokens, avoidance: {applied: true, reason, collision, remainingCollision: remaining, faceArea, displayIntent, maxWidth: nextTokens.presenterSafeMaxWidth, sceneMode: scene.sceneMode, align: scene.align}};
}

module.exports = {BOTTOM_SUBTITLE_SAFE_PCT, CINEMATIC_CENTER_CORRIDOR_PCT, CINEMATIC_WIDE_SCALE, CINEMATIC_WIDE_WIDTH, ENGLISH_SAFE_SCALE, ENGLISH_SAFE_WIDTH, MIN_OVERLAY_SCALE, SAFE_ISLAND_SCALE, SAFE_ISLAND_WIDTH, SIDE_OVERLAY_WIDTH, componentRect, detectSceneMode, resolveFaceAwareLayer};