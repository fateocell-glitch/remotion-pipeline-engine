"use strict";

const {getComponentRegistrySync} = require("./component-registry-store.cjs");

const normalizedOffset = (value) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
const normalizeCommonProps = (value, legacyEnterOffset) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {enterOffset: normalizedOffset(source.enterOffset ?? legacyEnterOffset), exitOffset: normalizedOffset(source.exitOffset), duration: typeof source.duration === "number" && Number.isFinite(source.duration) && source.duration > 0 ? source.duration : undefined, position: ["center","bottom-left","bottom-right","top-right","center-right"].includes(source.position) ? source.position : "center", offsetX: typeof source.offsetX === "number" && Number.isFinite(source.offsetX) ? source.offsetX : 0, offsetY: typeof source.offsetY === "number" && Number.isFinite(source.offsetY) ? source.offsetY : 0, scale: Math.min(1.2, Math.max(0.8, typeof source.scale === "number" && Number.isFinite(source.scale) ? source.scale : 1)), enterAnimation: ["spring-up","fade-scale","slide-left","slide-right","glitch"].includes(source.enterAnimation) ? source.enterAnimation : "spring-up", exitAnimation: ["fade-out","slide-down","scale-down","none"].includes(source.exitAnimation) ? source.exitAnimation : "none", sfx: ["whoosh","tech-click","pop","none"].includes(source.sfx) ? source.sfx : "none", ...(["auto","manual"].includes(source.faceAvoidanceMode) ? {faceAvoidanceMode: source.faceAvoidanceMode} : {}), ...(["speaker_mode","cinematic_mode"].includes(source.sceneModeOverride) ? {sceneModeOverride: source.sceneModeOverride} : {}), ...(["left","right"].includes(source.alignOverride) ? {alignOverride: source.alignOverride} : {})};
};

const clean = (value, fallback = "") => typeof value === "string" ? value.trim() : fallback;
const VALID_ROLES = new Set(["hook", "chain", "metric", "risk", "verdict"]);
const VALID_ACCENTS = new Set(["blue", "green", "yellow", "red"]);
const object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const layerPayload = (layer) => {
  const source = object(layer?.payload);
  if (Object.keys(source).length) return source;
  const legacy = {...object(layer?.effectProps)};
  ["category", "eyebrow", "categoryTag", "headline", "title", "effectText", "effectZh", "body"].forEach((key) => delete legacy[key]);
  return legacy;
};
const CHIP_CONTENT_LAYOUTS = new Set(["hud-glow-stack", "diagonal-chips", "floating-chips", "desktop-folders", "photo-wall", "product-explosion"]);
const STEP_CONTENT_LAYOUTS = new Set(["ordered-sequence", "event-timeline", "rewind-milestones", "time-rewind", "route-map", "check-progress", "org-chart", "closing-checklist", "checklist-editorial", "recovery-progress-bars", "briefing-poster", "tradeoff-reject-round", "reject-list", "pivot-list"]);
const METRIC_CONTENT_LAYOUTS = new Set(["capital-dashboard",  "progress-donut", "data-flow", "platform-shift-line"]);
const stringRows = (value) => Array.isArray(value) ? value.map((item) => typeof item === "string" ? item.trim() : typeof item?.text === "string" ? item.text.trim() : typeof item?.title === "string" ? item.title.trim() : "").filter(Boolean) : [];
const componentFamily = (layout) => { try { return getComponentRegistrySync(process.cwd()).components.find((component) => component.id === layout)?.family || "narrative"; } catch { return "narrative"; } };
const normalizeContentPayload = (payload, layout, effectText) => {
  const existing = object(payload.contentPayload);
  const explicitType = CHIP_CONTENT_LAYOUTS.has(layout) ? "chips" : METRIC_CONTENT_LAYOUTS.has(layout) ? "metrics" : STEP_CONTENT_LAYOUTS.has(layout) ? "steps" : null;
  if (["narrative", "chips", "metrics", "steps"].includes(existing.type) && (!explicitType || existing.type === explicitType)) return existing;
  const values = stringRows(payload.items).length ? stringRows(payload.items) : stringRows(payload.steps).length ? stringRows(payload.steps) : stringRows(payload.years).length ? stringRows(payload.years) : stringRows(payload.nodes).length ? stringRows(payload.nodes) : stringRows(payload.units);
  const subtitles = stringRows(payload.itemSubtitles).length ? stringRows(payload.itemSubtitles) : stringRows(payload.subLabels);
  const chipPayload = () => ({type: "chips", items: values.map((title, index) => ({title, subtitle: subtitles[index] || ""}))});
  const metricPayload = () => ({type: "metrics", value: payload.value ?? payload.progress ?? payload.metricValue ?? 75, unit: clean(payload.unit, clean(payload.metricUnit)), label: clean(payload.label, clean(payload.metricLabel, "关键指标")), detailText: clean(payload.detailText, clean(payload.body, effectText))});
  const stepsPayload = () => ({type: "steps", steps: values.map((text, index) => ({stepNumber: index + 1, text})), ...(Number.isFinite(Number(payload.progress)) ? {progress: Number(payload.progress)} : {})});
  if (CHIP_CONTENT_LAYOUTS.has(layout)) return chipPayload();
  if (METRIC_CONTENT_LAYOUTS.has(layout)) return metricPayload();
  if (STEP_CONTENT_LAYOUTS.has(layout)) return stepsPayload();
  const family = componentFamily(layout);
  if (family === "chips") return chipPayload();
  if (family === "metrics") return metricPayload();
  if (family === "steps") return stepsPayload();
  return {type: "narrative", bodyText: clean(payload.body, clean(payload.effectText, effectText))};
};
const normalizeLayer = (layer, index, beat) => {
  const legacy = object(layer?.effectProps);
  const category = clean(layer?.category, clean(legacy.category, clean(legacy.eyebrow, clean(legacy.categoryTag, clean(beat?.eyebrow, "DESIGN SYSTEM")))));
  const headline = clean(layer?.headline, clean(legacy.headline, clean(legacy.title, clean(beat?.subtitle, "核心观点"))));
  const effectText = clean(layer?.effectText, clean(legacy.effectText, clean(legacy.effectZh, clean(legacy.body, clean(beat?.effectText, clean(beat?.zh, ""))))));
  const rawPayload = layerPayload(layer);
  const textRole = clean(layer?.textRole, clean(rawPayload.textRole, clean(legacy.textRole)));
  const roleCandidate = String(layer?.role || rawPayload.role || legacy.role || textRole || "");
  const role = VALID_ROLES.has(roleCandidate) ? roleCandidate : undefined;
  const accentCandidate = String(layer?.accent || rawPayload.accent || legacy.accent || "blue");
  const accent = VALID_ACCENTS.has(accentCandidate) ? accentCandidate : "blue";
  const payload = {...rawPayload, ...(textRole ? {textRole} : {}), ...(role ? {role} : {}), accent, contentPayload: normalizeContentPayload(rawPayload, layer?.layout ?? beat?.layout, effectText)};
  return {layerId: typeof layer?.layerId === "string" && layer.layerId ? layer.layerId : "layer-" + (index + 1), layout: layer?.layout ?? beat?.layout, category, headline, effectText, ...(textRole ? {textRole} : {}), ...(role ? {role} : {}), accent, payload, commonProps: normalizeCommonProps(layer?.commonProps, layer?.enterOffset), enterOffset: normalizedOffset(layer?.commonProps?.enterOffset ?? layer?.enterOffset)};
};
const layerEnd = (layer, beatDuration) => {
  const common = layer.commonProps || {};
  const enter = normalizedOffset(common.enterOffset ?? layer.enterOffset);
  const duration = Number(common.duration);
  return Number.isFinite(duration) && duration > 0 ? enter + duration : Math.max(enter, beatDuration - normalizedOffset(common.exitOffset));
};

function repairLegacyLayerTimings(layers, beat) {
  const beatDuration = Math.max(0, Number(beat?.end) - Number(beat?.start));
  if (!Number.isFinite(beatDuration) || beatDuration <= 0 || layers.length < 2) return layers;
  return layers.map((layer, index, rows) => {
    if (index === 0) return layer;
    const previous = rows[index - 1];
    const previousEnd = layerEnd(previous, beatDuration);
    const common = layer.commonProps || {};
    const enter = normalizedOffset(common.enterOffset ?? layer.enterOffset);
    const hasDuration = Number.isFinite(Number(common.duration)) && Number(common.duration) > 0;
    const isLegacyZeroOverlap = !hasDuration && enter <= previousEnd + .01;
    if (!isLegacyZeroOverlap) return layer;
    const repairedEnter = Number(Math.min(beatDuration - .01, previousEnd + .5).toFixed(2));
    if (repairedEnter <= enter || repairedEnter >= beatDuration) return layer;
    const repairedDuration = Number((beatDuration - repairedEnter).toFixed(2));
    return {...layer, commonProps: {...common, enterOffset: repairedEnter, duration: repairedDuration}, enterOffset: repairedEnter};
  });
}

const normalizeBeatLayers = (beat) => {
  const layers = Array.isArray(beat?.layers) && beat.layers.length > 0
    ? beat.layers.map((layer, index) => normalizeLayer(layer, index, beat))
    : [normalizeLayer({layerId: "layer-1", layout: beat?.layout, effectProps: beat?.effectProps, enterOffset: 0}, 0, beat)];
  return repairLegacyLayerTimings(layers, beat);
};

const validEffectLayers = (layers, layouts) =>
  Array.isArray(layers) &&
  layers.length > 0 &&
  layers.every((layer) =>
    layer &&
    typeof layer.layerId === "string" &&
    layer.layerId.length > 0 &&
    typeof layer.layout === "string" &&
    layouts.has(layer.layout) &&
    (layer.payload === undefined || (typeof layer.payload === "object" && !Array.isArray(layer.payload))) &&
    (layer.category === undefined || typeof layer.category === "string") &&
    (layer.headline === undefined || typeof layer.headline === "string") &&
    (layer.effectText === undefined || typeof layer.effectText === "string") &&
    (layer.commonProps === undefined || (typeof layer.commonProps === "object" && !Array.isArray(layer.commonProps))) &&
    (layer.enterOffset === undefined || (typeof layer.enterOffset === "number" && Number.isFinite(layer.enterOffset) && layer.enterOffset >= 0)),
  );

module.exports = {normalizeBeatLayers, normalizeCommonProps, validEffectLayers};

