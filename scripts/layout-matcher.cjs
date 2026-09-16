"use strict";

const {diversifyVisualCard, extractBeatContent, extractComponentPayload, matchWindowCaptions} = require("./services/beat-content-extraction.cjs");
const {inferCommercialTextRole, assignSemanticAccent} = require("./services/commercial-analysis-preset.cjs");
const {buildBeatContext, componentManifest, componentRegistry, pickBestComponent, summarizeComponentUsage} = require("./services/component-recommender.cjs");
const {getComponentRegistrySync} = require("./services/component-registry-store.cjs");

const fillerPattern = /^(?:嗯|啊|呃|这个|那个|然后|就是|其实|所以|好的|ok|OK|我觉得|你看|拿到手)/;

function inferLayoutFromContent(text, beatIndex, totalBeats, history = [], layerIndex = 0, captions = [], layerCount = 1, textRole = "") {
  // Kept as a small compatibility wrapper for callers that only need an ID.
  const normalizedHistory = Array.isArray(history) ? history.map((item) => ({...item, intent: item.intent ?? componentManifest[item.layout]?.intent})) : history ? [{layout: history, family: componentRegistry[history]?.family, intent: componentManifest[history]?.intent}] : [];
  const context = buildBeatContext({text, captions, beatIndex, totalBeats, layerIndex, layerCount, textRole});
  return pickBestComponent(context, layerIndex, normalizedHistory).componentId;
}

const compact = (value) => String(value ?? "")
  .replace(/^\s*(?:主持人|旁白)\s*[:：]?\s*/i, "")
  .replace(/[。！？!?；;]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .replace(fillerPattern, "")
  .trim();


function getItemCapacity(layout) {
  try {
    const registry = getComponentRegistrySync(process.cwd());
    const component = registry.components.find((entry) => entry.id === layout);
    const count = Number(component?.tokens?.defaultItemCount);
    return Number.isFinite(count) ? Math.max(1, Math.min(8, Math.round(count))) : 4;
  } catch {
    return 4;
  }
}

function takeItems(layout, items, max = getItemCapacity(layout)) {
  return items.slice(0, max);
}

const CHIP_CONTENT_LAYOUTS = new Set(["hud-glow-stack", "diagonal-chips", "floating-chips", "desktop-folders", "photo-wall", "product-explosion"]);
const STEP_CONTENT_LAYOUTS = new Set(["ordered-sequence", "event-timeline", "rewind-milestones", "time-rewind", "route-map", "check-progress", "org-chart", "closing-checklist", "checklist-editorial", "recovery-progress-bars", "briefing-poster", "tradeoff-reject-round", "reject-list", "pivot-list"]);
const METRIC_CONTENT_LAYOUTS = new Set(["capital-dashboard",  "progress-donut", "data-flow", "platform-shift-line"]);
const PLACEHOLDER_LAYER_VALUES = new Set(["识别关键机制", "降低行动阻力", "持续放大优势", "把局部优势做成增长结构", "用更低阻力推动持续成交"]);
const isPlaceholderLayerValue = (value) => PLACEHOLDER_LAYER_VALUES.has(String(value || "").trim());

function numericValuesFromCaptions(captions) {
  const source = (captions || []).map((caption) => String(caption?.zh || caption?.en || "")).join(" ");
  return [...source.matchAll(/(?:^|[^\d])(\d+(?:\.\d+)?)(?=(?:\s|$|[%％万亿倍元件款年]))/g)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value));
}
function componentDefinition(layout) {
  try { return getComponentRegistrySync(process.cwd()).components.find((component) => component.id === layout) || null; } catch { return null; }
}
function hydrateLayerWithPayload(layout, effectProps = {}, captions = []) {
  const component = componentDefinition(layout);
  const extraction = extractComponentPayload({
    layout,
    editorSchema: component?.editorSchema || {},
    family: component?.family || "",
    captions,
    defaultPayload: component?.defaultPayload || component?.mockData?.contentPayload,
    mockData: component?.mockData || {},
    copy: {
      headline: effectProps.headline,
      effectText: effectProps.effectText || effectProps.effectZh,
      effectZh: effectProps.effectZh || effectProps.effectText,
      bodyText: effectProps.bodyText || effectProps.body,
      steps: effectProps.contentPayload?.steps?.map((item) => item?.text) || effectProps.steps || effectProps.items,
    },
  });
  const contentPayload = extraction.contentPayload;
  const next = {...effectProps, ...extraction.fields, contentPayload};
  if (contentPayload.type === "chips") {
    const items = contentPayload.items.map((item) => item.title);
    next.items = items; next.steps = items; next.comments = items;
    next.itemSubtitles = contentPayload.items.map((item) => item.subtitle || "");
    next.subLabels = next.itemSubtitles;
  } else if (contentPayload.type === "steps") {
    Object.assign(next, extraction.fields);
    const items = contentPayload.steps.map((item) => item.text);
    next.items = items; next.steps = items; next.years = items; next.nodes = items; next.units = items; next.comments = items;
    if (contentPayload.bodyText) { next.bodyText = contentPayload.bodyText; next.body = contentPayload.bodyText; }
  } else if (contentPayload.type === "metrics") {
    next.value = contentPayload.value; next.progress = contentPayload.value; next.unit = contentPayload.unit;
    next.label = contentPayload.label; next.metric = contentPayload.label;
    next.bodyText = contentPayload.bodyText || next.bodyText || "";
    next.detailText = contentPayload.detailText || next.detailText || "";
    next.body = next.detailText || next.bodyText;
  } else {
    next.bodyText = contentPayload.bodyText; next.body = contentPayload.bodyText;
    next.highlightQuote = contentPayload.highlightQuote || next.highlightQuote || "";
    if (contentPayload.bearText) next.bearText = contentPayload.bearText;
  }
  return next;
}

function contentPayloadFor(layout, headline, effectText, items, bodyText = effectText, metrics = []) {
  let family = "narrative";
  try { family = getComponentRegistrySync(process.cwd()).components.find((component) => component.id === layout)?.family || family; } catch {}
  const values = takeItems(layout, items).filter((value) => !isPlaceholderLayerValue(value));
  if (CHIP_CONTENT_LAYOUTS.has(layout)) return {type: "chips", items: values.map((title, index) => ({title, subtitle: index === 0 ? effectText : ""}))};
  if (METRIC_CONTENT_LAYOUTS.has(layout)) return {type: "metrics", value: metrics[0] ?? "", unit: metrics.length ? "%" : "", label: headline, detailText: bodyText};
  if (STEP_CONTENT_LAYOUTS.has(layout)) return {type: "steps", steps: values.map((text, index) => ({stepNumber: index + 1, text}))};
  if (family === "chips") return {type: "chips", items: values.map((title, index) => ({title, subtitle: index === 0 ? effectText : ""}))};
  if (family === "metrics") return {type: "metrics", value: metrics[0] ?? "", unit: metrics.length ? "%" : "", label: headline, detailText: bodyText};
  if (family === "steps") return {type: "steps", steps: values.map((text, index) => ({stepNumber: index + 1, text}))};
  if (layout === "bull-bear") return {type: "narrative", bodyText, bearText: effectText, highlightQuote: headline};
  return {type: "narrative", bodyText};
}
function extractListItems(captions, beat, max = 4) {
  const source = Array.isArray(captions) ? captions : [];
  const items = [];
  for (const caption of source) {
    const segments = String(caption?.zh ?? "").split(/[，,。！？!?；;]+/);
    for (const segment of segments) {
      const text = compact(segment);
      if (text.length < 3 || items.includes(text)) continue;
      items.push(text);
      if (items.length >= max) return items;
    }
  }
  const fallback = [compact(beat?.subtitle), compact(beat?.zh)].filter((item, index, all) => item.length >= 3 && all.indexOf(item) === index);
  return [...items, ...fallback.filter((item) => !items.includes(item))].slice(0, max);
}

function buildEffectProps(beat, captions, layout, previousAccent = "", language = "zh") {
  const isEnglish = language === "en";
  const card = beat.visualCard || {};
  const sourceText = (captions || []).map((caption) => String(caption.zh || caption.en || "")).join(" ");
  const textRole = typeof card.role === "string" ? card.role : typeof card.textRole === "string" ? card.textRole : typeof beat.role === "string" ? beat.role : typeof beat.textRole === "string" ? beat.textRole : inferCommercialTextRole({captions, layerIndex: 0, layerCount: 1});
  const accent = assignSemanticAccent({role: textRole, text: sourceText, previousAccent});
  const derivedSteps = Array.isArray(card.steps) ? card.steps.filter((value) => !isPlaceholderLayerValue(value)) : [];
  const items = derivedSteps.length ? derivedSteps : extractListItems(captions, beat, getItemCapacity(layout)).filter((value) => !isPlaceholderLayerValue(value));
  const headline = compact(beat.subtitle) || items[0];
  const effectZh = compact(beat.effectText || beat.zh) || items[1] || items[0];
  if (!headline || !effectZh) throw new Error("LayerContentError: source captions did not yield usable Layer copy");
  const bodyText = String(card.bodyText || effectZh).replace(/\s+/g, " ").trim() || effectZh;
  const metrics = numericValuesFromCaptions(captions);
  const contentPayload = contentPayloadFor(layout, headline, effectZh, items, bodyText, metrics);
  const shared = {textRole, role: textRole, accent, headline, eyebrow: compact(beat.eyebrow), effectText: effectZh, effectZh, body: bodyText, bodyText, title: headline, items: takeItems(layout, items), steps: takeItems(layout, items), units: takeItems(layout, items), comments: takeItems(layout, items), contentPayload, ...(contentPayload.type === "chips" ? {itemSubtitles: contentPayload.items.map((item) => item.subtitle || ""), subLabels: contentPayload.items.map((item) => item.subtitle || "")} : {})};
  if (layout === "platform-shift-line") return {...shared, count: Math.max(1, items.length), metricLabel: isEnglish ? "PRODUCT LINE" : "产品线", milestones: takeItems(layout, items), startLabel: isEnglish ? "START" : "起点", endLabel: isEnglish ? "TARGET STAGE" : "目标阶段", summary: effectZh};
  if (layout === "tradeoff-reject-round") return {...shared, label: isEnglish ? "RISK SCREEN" : "风险排除", title: headline, items: takeItems(layout, items)};
  if (layout === "recovery-progress-bars") return {...shared, label: isEnglish ? "EXECUTION" : "执行进度", title: headline, items: takeItems(layout, items), values: takeItems(layout, items).map((_, index) => 76 - index * 14)};
  if (layout === "hud-glow-stack") return {...shared, subLabel: beat.eyebrow || "LIVE SIGNAL", items: takeItems(layout, items)};
  if (layout === "briefing-poster") return {...shared, label: isEnglish ? "BRIEF SUMMARY" : "简报摘要", title: headline, items: takeItems(layout, items)};
  if (layout === "rewind-milestones") return {...shared, label: isEnglish ? "MILESTONE REVIEW" : "时间回溯", title: headline, years: takeItems(layout, items), milestoneLabel: isEnglish ? "CAPABILITY SHIFT" : "能力演进"};
  if (layout === "flying-paper-stack") return {...shared, headline, ghostTitle: items[0] || headline, body: effectZh};
  if (layout === "checklist-editorial") return {...shared, label: isEnglish ? "FINAL CHECK" : "最终确认", title: headline, items: takeItems(layout, items)};
  if (layout === "ordered-sequence") return {...shared, categoryTag: beat.eyebrow || (isEnglish ? "CORE STEPS" : "核心步骤")};
  if (layout === "diagonal-chips" || layout === "floating-chips" || layout === "photo-wall" || layout === "desktop-folders" || layout === "product-explosion") return shared;
  if (layout === "pivot-list") return {...shared, text: effectZh};
  if (layout === "zoom-statement") return {...shared, headline: effectZh, title: headline, body: effectZh};
  if (layout === "data-flow" || layout === "cook-machine") return {...shared, leftLabel: items[0] || headline, leftValue: items[1] || headline, rightLabel: items[2] || (isEnglish ? "KEY TAKEAWAY" : "关键结论"), rightValue: effectZh, from: 0, to: 100};
  if (layout === "event-timeline") return {...shared, years: takeItems(layout, items)};
  if (layout === "capital-dashboard") return {...shared, marketLabel: items[0] || headline, marketTo: metrics[0] ?? "", marketSuffix: metrics.length ? "%" : "", engineeringLabel: items[1] || effectZh, engineeringTo: metrics[1] ?? "", engineeringSuffix: metrics.length > 1 ? "%" : ""};
  if (layout === "progress-donut" || layout === "check-progress") return {...shared, label: headline, progress: metrics[0] ?? "", value: metrics[0] ?? "", metric: effectZh};
  if (layout === "person-rank" || layout === "avatar-handoff") return {...shared, leftName: items[0] || headline, leftRole: beat.eyebrow || (isEnglish ? "PREVIOUS ROLE" : "前序角色"), rightName: items[1] || effectZh, rightRole: isEnglish ? "TARGET ROLE" : "目标角色"};
  if (layout === "org-chart") return {...shared, leader: headline, leaderRole: beat.eyebrow || (isEnglish ? "CORE NODE" : "核心节点")};
  if (layout === "bull-bear") return {...shared, bullLabel: isEnglish ? "BULL CASE" : "多方观点", bullText: contentPayload.bodyText || bodyText, bearLabel: isEnglish ? "BEAR CASE" : "空方观点", bearText: contentPayload.bearText || effectZh, highlightQuote: contentPayload.highlightQuote || headline};
  if (layout === "closing-checklist" || layout === "reject-list" || layout === "clipboard-note") return {...shared, boxColor: "auto"};
  if (layout === "newspaper-swap") return {...shared, oldLabel: isEnglish ? "PREVIOUS VIEW" : "此前判断", oldHeadline: effectZh, newLabel: beat.eyebrow || (isEnglish ? "LATEST VIEW" : "最新判断"), newHeadline: headline, footer: effectZh};
  if (layout === "route-map" || layout === "market-battlefield") return {...shared, nodes: takeItems(layout, items)};
  return shared;
}
function applyEffectProps(beat, layout, effectProps) {
  const layers = Array.isArray(beat.layers) ? beat.layers.map((layer) => ({...layer, effectProps: {...(layer.effectProps || {})}})) : [];
  const found = layers.findIndex((layer) => layer.layout === layout);
  const index = found < 0 ? 0 : found;
  if (!layers.length) layers.push({layerId: "layer-1", layout, effectProps: {}, commonProps: {enterOffset: 0}, enterOffset: 0});
  layers[index] = {...layers[index], layout, category: effectProps.eyebrow, headline: effectProps.headline, effectText: effectProps.effectText, textRole: effectProps.textRole, role: effectProps.role || effectProps.textRole, accent: effectProps.accent, contentPayload: effectProps.contentPayload, payload: {...effectProps}, effectProps: {...effectProps}};
  return {...beat, layout, effectProps: {...effectProps}, layers};
}

const windowCaptions = (captions, start, end) => matchWindowCaptions(captions || [], {start, end}, .35).captions;

const semanticContinuationStart = /^(?:也|还|并|而|才|就|却|根本|他们|我们才|大家|这个|这些|这|那|其|搞清楚|真的|的|如果|因为|所以|最后|接着|再|在|到底|就是|能|会|要|不|没有|包括|从|对|把|给|跟|和|但|但是)/;
const semanticIncompleteTail = /(?:的|地|得|在|把|将|让|给|跟|和|对|从|向|于|是|有|要|会|能|想|被|这一年|这个|这些|这种)$/;
const semanticTerminalTail = /(?:了|吗|吧|呢|啊|呀|顾问|答案|指南|结论|问题|策略|基础|价值|方向)$/;
const semanticDependentLead = /^(?:如果|虽然|因为|当|在|对于|随着)/;
const semanticWeakEndpoint = /(?:所以你看|讲白了|说真的|其实|然后|接着|最后|看到这些整理|搞清楚这点|AI就算在聪明)$/;
const semanticIndependent = (caption, next) => { const text = String(caption?.zh || "").trim(), nextText = String(next?.zh || "").trim(); return Boolean(text) && !semanticIncompleteTail.test(text) && !semanticDependentLead.test(text) && !semanticWeakEndpoint.test(text) && (!semanticContinuationStart.test(nextText) || semanticTerminalTail.test(text)); };
const semanticBoundaryKind = (caption, next) => {
  const text = String(caption?.zh || "").trim();
  if (/[，,；;]$/.test(text)) return "comma";
  if (/[。！？!?]$/.test(text)) return "sentence";
  if (next && Number(next.start) - Number(caption.end) > 0.5) return "silence";
  return "endpoint";
};
function findSemanticHandoff(captions, beat) {
  const duration = Math.max(1, Number(beat.end) - Number(beat.start));
  const pivot = Number(beat.start) + duration / 2;
  const minimum = Number(beat.start) + Math.min(4, duration * .2);
  const maximum = Number(beat.end) - Math.min(4, duration * .2);
  const candidates = windowCaptions(captions, beat.start, beat.end).map((caption, index, rows) => ({end: Number(caption.end), kind: semanticBoundaryKind(caption, rows[index + 1]), independent: semanticIndependent(caption, rows[index + 1])})).filter((candidate) => candidate.end > minimum && candidate.end < maximum);
  const nearest = (rows) => rows.slice().sort((left, right) => Math.abs(left.end - pivot) - Math.abs(right.end - pivot) || left.end - right.end)[0];
  const comma = nearest(candidates.filter((candidate) => candidate.kind === "comma"));
  const natural = nearest(candidates.filter((candidate) => candidate.kind === "sentence" || candidate.kind === "silence"));
  const endpoint = nearest(candidates.filter((candidate) => candidate.kind === "endpoint" && candidate.independent));
  return Number((comma?.end ?? natural?.end ?? endpoint?.end ?? pivot).toFixed(2));
}
const timedCommonProps = (beatStart, windowStart, windowEnd, isLast) => ({
  enterOffset: Number(Math.max(0, windowStart - beatStart).toFixed(2)),
  exitOffset: 0,
  duration: isLast ? undefined : Number(Math.max(1, windowEnd - windowStart - 0.5).toFixed(2)),
  position: "center",
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  enterAnimation: windowStart === beatStart ? "spring-up" : "slide-right",
  exitAnimation: isLast ? "none" : "fade-out",
  sfx: "none",
});

function buildTimedEffectLayers(project, beat, beatIndex, layerCount, history, {preserveLayout = false} = {}) {
  const duration = Math.max(1, beat.end - beat.start);
  const handoff = layerCount === 2 ? findSemanticHandoff(project.captions, beat) : null;
  const windowDuration = duration / layerCount;
  const windows = layerCount === 2 ? [[beat.start, handoff], [handoff, beat.end]] : Array.from({length: layerCount}, (_, index) => [beat.start + windowDuration * index, index === layerCount - 1 ? beat.end : beat.start + windowDuration * (index + 1)]);
  const layers = [];
  const layerHistory = [...history];

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const [start, end] = windows[layerIndex];
    const captions = windowCaptions(project.captions, start, end);
    const text = captions.map((caption) => String(caption.zh || "") + " " + String(caption.en || "")).join(" ");
    const semanticIndex = beatIndex * layerCount + layerIndex;
    const extracted = extractBeatContent(beat.id + "-layer-" + (layerIndex + 1), captions, {start, end, language: project.language, layerIndex, layerCount, previousAccent: layers.at(-1)?.accent}, semanticIndex);
    const derived = layerIndex > 0 ? diversifyVisualCard(extracted, layers.at(-1)?.headline, captions) : extracted;
    const layout = preserveLayout && layerIndex === 0 && typeof beat.layout === "string" && beat.layout
      ? beat.layout
      : inferLayoutFromContent(text, beatIndex, project.beats.length, layerHistory, layerIndex, captions, layerCount, derived.textRole);
    const localBeat = {...beat, start, end, eyebrow: derived.chapter || beat.eyebrow, subtitle: derived.headline || beat.subtitle, zh: derived.effectZh || beat.zh, effectText: derived.effectZh || beat.effectText || beat.zh, visualCard: derived};
    const effectProps = hydrateLayerWithPayload(layout, buildEffectProps(localBeat, captions, layout, layers.at(-1)?.accent, project.language), captions);
    layers.push({
      layerId: "layer-" + (layerIndex + 1),
      layout,
      category: effectProps.eyebrow,
      headline: effectProps.headline,
      effectText: effectProps.effectText,
      textRole: effectProps.textRole,
      contentPayload: effectProps.contentPayload,

      payload: {...effectProps},
      effectProps,
      commonProps: timedCommonProps(beat.start, start, end, layerIndex === layerCount - 1),
      enterOffset: Number(Math.max(0, start - beat.start).toFixed(2)),
    });
    layerHistory.push({layout, family: componentRegistry[layout]?.family, intent: componentManifest[layout]?.intent, beatIndex, layerIndex});
  }

  const primary = layers[0];
  return {...beat, layout: primary.layout, effectProps: {...primary.effectProps}, layers, nextHistory: layerHistory};
}

function autoMatchProject(project, {force = false, preserveLayout = false, effectsPerBeat = 2} = {}) {
  let history = [];
  const changed = [];
  const requestedLayerCount = Math.min(2, Math.max(1, Number(effectsPerBeat) || 1));
  const beats = project.beats.map((beat, index) => {
    if (beat.layoutLocked && !force) {
      const lockedLayers = Array.isArray(beat.layers) && beat.layers.length ? beat.layers : [{layout: beat.layout}];
      history = [...history, ...lockedLayers.map((layer) => ({layout: layer.layout, family: componentRegistry[layer.layout]?.family, intent: componentManifest[layer.layout]?.intent}))];
      return beat;
    }
    const layerCount = requestedLayerCount > 1 && beat.end - beat.start >= 24 ? requestedLayerCount : 1;
    if (layerCount > 1) {
      const next = buildTimedEffectLayers(project, beat, index, layerCount, history, {preserveLayout});
      history = next.nextHistory;
      const {nextHistory, ...serializable} = next;
      if (JSON.stringify({layout: beat.layout, effectProps: beat.effectProps, layers: beat.layers}) !== JSON.stringify({layout: serializable.layout, effectProps: serializable.effectProps, layers: serializable.layers})) changed.push(beat.id);
      return {...serializable, layoutSource: "auto", layoutLocked: false};
    }
    const captions = windowCaptions(project.captions, beat.start, beat.end);
    const text = captions.map((caption) => String(caption.zh || "") + " " + String(caption.en || "")).join(" ");
    const layout = preserveLayout && typeof beat.layout === "string" && beat.layout ? beat.layout : inferLayoutFromContent(text, index, project.beats.length, history, 0, captions, 1);
    history.push({layout, family: componentRegistry[layout]?.family, intent: componentManifest[layout]?.intent, beatIndex:index, layerIndex:0});
    const effectProps = hydrateLayerWithPayload(layout, buildEffectProps(beat, captions, layout, history.at(-1)?.accent, project.language), captions);
    const next = applyEffectProps(beat, layout, effectProps);
    if (JSON.stringify({layout: beat.layout, effectProps: beat.effectProps, layers: beat.layers}) !== JSON.stringify({layout: next.layout, effectProps: next.effectProps, layers: next.layers})) changed.push(beat.id);
    return {...next, layoutSource: "auto", layoutLocked: false};
  });
  return {...project, beats, autoMatch: {changed, generatedAt: new Date().toISOString(), effectsPerBeat: requestedLayerCount, componentUsage: summarizeComponentUsage(history)}};
}
module.exports = {inferLayoutFromContent, extractListItems, buildEffectProps, contentPayloadFor, findSemanticHandoff, buildTimedEffectLayers, autoMatchProject, hydrateLayerWithPayload};

