"use strict";

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
  const scale = clamp(Number(commonProps.scale ?? tokens.scale ?? 1), .8, 1.2);
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

function resolveFaceAwareLayer({layout, commonProps, tokens, faceZone, family, candidates}) {
  const sourceCommon = copy(commonProps);
  const sourceTokens = copy(tokens);
  const face = safeRect(faceZone);
  const base = {layout, commonProps: sourceCommon, tokens: sourceTokens, avoidance: {applied: false, reason: "no-face", collision: 0, faceArea: faceZone?.faceArea || null}};
  if (!face) return base;
  if (sourceCommon.faceAvoidanceMode === "manual") return {...base, avoidance: {...base.avoidance, reason: "manual"}};
  const before = componentRect(sourceTokens, sourceCommon);
  const collision = area(face) ? overlapArea(before, face) / area(face) : 0;
  if (collision < .06) return {...base, avoidance: {...base.avoidance, reason: "clear", collision}};
  const nextCommon = copy(sourceCommon);
  const nextTokens = copy(sourceTokens);
  const faceArea = faceZone.faceArea || "center";
  let reason = "collision";
  if (faceArea === "right") { nextTokens.mountMode = "left"; nextCommon.offsetX = Math.min(Number(nextCommon.offsetX || 0), -44); reason = "face-right"; }
  else if (faceArea === "left") { nextTokens.mountMode = "right"; nextCommon.offsetX = Math.max(Number(nextCommon.offsetX || 0), 44); reason = "face-left"; }
  else if (Number(faceZone.faceH || 0) >= .4) { nextTokens.mountMode = "bottom"; nextCommon.scale = .8; nextCommon.offsetY = Math.max(Number(nextCommon.offsetY || 0), 32); reason = "large-center-face"; }
  else { nextTokens.mountMode = "bottom"; nextCommon.offsetY = Math.max(Number(nextCommon.offsetY || 0), 24); reason = "face-center"; }
  const after = componentRect(nextTokens, nextCommon);
  const remaining = area(face) ? overlapArea(after, face) / area(face) : 0;
  let nextLayout = layout;
  if (remaining > .28 && Array.isArray(candidates)) {
    const currentScore = Number(candidates.find((item) => item.id === layout)?.occupancyScore ?? 1);
    const compact = candidates.filter((item) => item.family === family && item.id !== layout && item.faceAvoidanceEligible !== false && Number(item.occupancyScore ?? 1) < currentScore).sort((left, right) => Number(left.occupancyScore ?? 1) - Number(right.occupancyScore ?? 1))[0];
    if (compact) { nextLayout = compact.id; reason += "+compact"; }
  }
  return {layout: nextLayout, commonProps: nextCommon, tokens: nextTokens, avoidance: {applied: true, reason, collision, remainingCollision: remaining, faceArea}};
}

module.exports = {componentRect, resolveFaceAwareLayer};
