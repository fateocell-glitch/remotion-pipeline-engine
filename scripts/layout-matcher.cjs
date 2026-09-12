"use strict";

const {extractBeatContent} = require("./services/beat-content-extraction.cjs");
const {buildBeatContext, componentRegistry, pickBestComponent, summarizeComponentUsage} = require("./services/component-recommender.cjs");

const fillerPattern = /^(?:嗯|啊|呃|这个|那个|然后|就是|其实|所以|好的|ok|OK|我觉得|你看|拿到手)/;

function inferLayoutFromContent(text, beatIndex, totalBeats, history = [], layerIndex = 0, captions = [], layerCount = 1) {
  // Kept as a small compatibility wrapper for callers that only need an ID.
  const normalizedHistory = Array.isArray(history) ? history : history ? [{layout: history, family: componentRegistry[history]?.family}] : [];
  const context = buildBeatContext({text, captions, beatIndex, totalBeats, layerIndex, layerCount});
  return pickBestComponent(context, layerIndex, normalizedHistory).componentId;
}

const compact = (value, max = 20) => String(value ?? "")
  .replace(/^\s*(?:主持人|旁白)\s*[:：]?\s*/i, "")
  .replace(/[。！？!?；;]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .replace(fillerPattern, "")
  .trim()
  .slice(0, max);

function extractListItems(captions, beat, max = 4) {
  const source = Array.isArray(captions) ? captions : [];
  const items = [];
  for (const caption of source) {
    const segments = String(caption?.zh ?? "").split(/[，,。！？!?；;]+/);
    for (const segment of segments) {
      const text = compact(segment, 22);
      if (text.length < 3 || items.includes(text)) continue;
      items.push(text);
      if (items.length >= max) return items;
    }
  }
  const fallback = [compact(beat?.subtitle, 22), compact(beat?.zh, 22)].filter((item, index, all) => item.length >= 3 && all.indexOf(item) === index);
  return [...items, ...fallback.filter((item) => !items.includes(item))].slice(0, max);
}

function buildEffectProps(beat, captions, layout) {
  const items = extractListItems(captions, beat, 4);
  const headline = compact(beat.subtitle, 22) || items[0] || "核心观点";
  const effectZh = compact(beat.effectText || beat.zh, 28) || items[1] || headline;
  const shared = {headline, eyebrow: compact(beat.eyebrow, 18), effectText: effectZh, effectZh, body: effectZh, title: headline, items: items.slice(0, 4), steps: items.slice(0, 4), units: items.slice(0, 4), comments: items.slice(0, 3)};
  if (layout === "platform-shift-line") return {...shared, count: Math.max(1, items.length), metricLabel: "产品线", milestones: items.slice(0, 4), startLabel: "起点", endLabel: "目标阶段", summary: effectZh};
  if (layout === "tradeoff-reject-round") return {...shared, label: "风险排除", title: headline, items: items.slice(0, 4)};
  if (layout === "recovery-progress-bars") return {...shared, label: "执行进度", title: headline, items: items.slice(0, 4), values: items.slice(0, 4).map((_, index) => 76 - index * 14)};
  if (layout === "hud-glow-stack") return {...shared, subLabel: beat.eyebrow || "LIVE SIGNAL", items: items.slice(0, 4)};
  if (layout === "briefing-poster") return {...shared, label: "简报摘要", title: headline, items: items.slice(0, 4)};
  if (layout === "rewind-milestones") return {...shared, label: "时间回溯", title: headline, years: items.slice(0, 3), milestoneLabel: "能力演进"};
  if (layout === "flying-paper-stack") return {...shared, headline, ghostTitle: items[0] || headline, body: effectZh};
  if (layout === "checklist-editorial") return {...shared, label: "最终确认", title: headline, items: items.slice(0, 4)};
  if (layout === "ordered-sequence") return {...shared, categoryTag: beat.eyebrow || "核心步骤"};
  if (layout === "diagonal-chips" || layout === "floating-chips" || layout === "photo-wall" || layout === "desktop-folders" || layout === "product-explosion") return shared;
  if (layout === "pivot-list" || layout === "engineering-return") return {...shared, text: effectZh};
  if (layout === "zoom-statement") return {...shared, headline: effectZh, title: headline, body: effectZh};
  if (layout === "data-flow" || layout === "cook-machine") return {...shared, leftLabel: items[0] || headline, leftValue: items[1] || headline, rightLabel: items[2] || "关键结论", rightValue: effectZh, from: 0, to: 100};
  if (layout === "event-timeline") return {...shared, years: items.slice(0, 4)};
  if (layout === "capital-dashboard") return {...shared, marketLabel: headline, marketTo: 100, marketSuffix: "%", engineeringLabel: "关键指标", engineeringTo: 25, engineeringSuffix: "%"};
  if (layout === "progress-donut" || layout === "check-progress") return {...shared, label: headline, progress: 75, value: 75, metric: effectZh};
  if (layout === "person-rank" || layout === "avatar-handoff") return {...shared, leftName: items[0] || headline, leftRole: beat.eyebrow || "前序角色", rightName: items[1] || effectZh, rightRole: "目标角色"};
  if (layout === "org-chart") return {...shared, leader: headline, leaderRole: beat.eyebrow || "核心节点"};
  if (layout === "bull-bear") return {...shared, bullLabel: "积极信号", bullText: headline, bearLabel: "风险提示", bearText: effectZh};
  if (layout === "closing-checklist" || layout === "reject-list" || layout === "clipboard-note") return {...shared, boxColor: "auto"};
  if (layout === "newspaper-swap") return {...shared, oldLabel: "此前判断", oldHeadline: effectZh, newLabel: beat.eyebrow || "最新判断", newHeadline: headline, footer: effectZh};
  if (layout === "route-map" || layout === "market-battlefield") return {...shared, nodes: items.slice(0, 3)};
  return shared;
}
function applyEffectProps(beat, layout, effectProps) {
  const layers = Array.isArray(beat.layers) ? beat.layers.map((layer) => ({...layer, effectProps: {...(layer.effectProps || {})}})) : [];
  const found = layers.findIndex((layer) => layer.layout === layout);
  const index = found < 0 ? 0 : found;
  if (!layers.length) layers.push({layerId: "layer-1", layout, effectProps: {}, commonProps: {enterOffset: 0}, enterOffset: 0});
  layers[index] = {...layers[index], layout, effectProps: {...effectProps}};
  return {...beat, layout, effectProps: {...effectProps}, layers};
}

const windowCaptions = (captions, start, end) => (captions || []).filter((caption) => Number(caption?.end) > start && Number(caption?.start) < end);

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
    const layout = preserveLayout && layerIndex === 0 && typeof beat.layout === "string" && beat.layout
      ? beat.layout
      : inferLayoutFromContent(text, beatIndex, project.beats.length, layerHistory, layerIndex, captions, layerCount);
    const derived = extractBeatContent(beat.id + "-layer-" + (layerIndex + 1), captions, {start, end}, semanticIndex);
    const localBeat = {...beat, start, end, eyebrow: derived.chapter || beat.eyebrow, subtitle: derived.headline || beat.subtitle, zh: derived.effectZh || beat.zh};
    const effectProps = buildEffectProps(localBeat, captions, layout);
    layers.push({
      layerId: "layer-" + (layerIndex + 1),
      layout,
      effectProps,
      commonProps: timedCommonProps(beat.start, start, end, layerIndex === layerCount - 1),
      enterOffset: Number(Math.max(0, start - beat.start).toFixed(2)),
    });
    layerHistory.push({layout, family: componentRegistry[layout]?.family});
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
      history = [...history, ...lockedLayers.map((layer) => ({layout: layer.layout, family: componentRegistry[layer.layout]?.family}))];
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
    history.push({layout, family: componentRegistry[layout]?.family});
    const effectProps = buildEffectProps(beat, captions, layout);
    const next = applyEffectProps(beat, layout, effectProps);
    if (JSON.stringify({layout: beat.layout, effectProps: beat.effectProps, layers: beat.layers}) !== JSON.stringify({layout: next.layout, effectProps: next.effectProps, layers: next.layers})) changed.push(beat.id);
    return {...next, layoutSource: "auto", layoutLocked: false};
  });
  return {...project, beats, autoMatch: {changed, generatedAt: new Date().toISOString(), effectsPerBeat: requestedLayerCount, componentUsage: summarizeComponentUsage(history)}};
}
module.exports = {inferLayoutFromContent, extractListItems, buildEffectProps, findSemanticHandoff, buildTimedEffectLayers, autoMatchProject};
