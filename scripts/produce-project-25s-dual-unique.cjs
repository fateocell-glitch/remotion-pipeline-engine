"use strict";

const {copyFileSync, existsSync, readFileSync, writeFileSync} = require("node:fs");
const {dirname, join} = require("node:path");
const {ensureProjectLifecycle} = require("./project-render-assets.cjs");
const {buildEffectProps} = require("./layout-matcher.cjs");
const {mergeShortCaptions} = require("./project-onboarding.cjs");
const {buildBeatContext, componentRegistry, pickBestComponent} = require("./services/component-recommender.cjs");
const {extractBeatContent, matchWindowCaptions} = require("./services/beat-content-extraction.cjs");
const {getComponentRegistrySync} = require("./services/component-registry-store.cjs");

const round = (value) => Number(Number(value).toFixed(2));
const textFor = (captions) => captions.map((caption) => String(caption.zh || "") + " " + String(caption.en || "")).join(" ").trim();
const projectDuration = (project) => Math.max(0, ...(project.captions || []).map((caption) => Number(caption.end) || 0), ...(project.beats || []).map((beat) => Number(beat.end) || 0));

function fixedWindows(totalSeconds, seconds) {
  const windows = [];
  for (let start = 0, index = 1; start < totalSeconds - .01; start += seconds, index += 1) {
    windows.push({id: "beat-" + String(index).padStart(3, "0"), start: round(start), end: round(Math.min(totalSeconds, start + seconds))});
  }
  return windows;
}

function allowedLayouts(root) {
  const registered = new Set(getComponentRegistrySync(root).components.map((component) => component.id));
  return new Set(Object.keys(componentRegistry).filter((id) => registered.has(id) && !id.startsWith("copyopen-")));
}

function chooseUnusedComponent(context, history, used, allowed) {
  const recommendation = pickBestComponent(context, context.layerIndex || 0, history);
  const choice = recommendation.ranked.find((candidate) => allowed.has(candidate.componentId) && !used.has(candidate.componentId));
  if (!choice) throw new Error("25-second dual production ran out of unique visual components.");
  return choice;
}

function layerWindows(beat, targetSeconds) {
  const duration = round(beat.end - beat.start);
  if (duration + .01 < targetSeconds) return [[beat.start, beat.end]];
  return [[beat.start, round(beat.start + 11)], [round(beat.start + 14), beat.end]];
}

function semanticProps(effectProps, derived, layerDraft) {
  const headline = derived.headline || layerDraft.subtitle;
  const effectText = derived.effectZh || layerDraft.effectText || layerDraft.zh;
  const bodyText = derived.bodyText || effectProps.bodyText || effectText;
  return {...effectProps, eyebrow: derived.chapter || layerDraft.eyebrow, category: derived.chapter || layerDraft.eyebrow, headline, title: headline, effectText, effectZh: effectText, body: bodyText, bodyText};
}

function createTwentyFiveSecondDualUniqueProject(source, {root = process.cwd(), targetSeconds = 25} = {}) {
  const duration = projectDuration(source);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Project has no usable caption duration.");
  const language = source.language || "zh";
  const projectCaptions = language === "zh" ? mergeShortCaptions(source.captions || []) : (source.captions || []);
  const used = new Set();
  const history = [];
  const allowed = allowedLayouts(root);
  const beats = fixedWindows(duration, targetSeconds).map((baseBeat, beatIndex) => {
    const draft = {...baseBeat, eyebrow: String(beatIndex + 1).padStart(2, "0") + " · 核心观点", subtitle: "核心观点", zh: "正在提炼当前时间窗口内容", effectText: "正在提炼当前时间窗口内容", en: "", layoutLocked: false, layoutSource: "auto"};
    const layers = layerWindows(draft, targetSeconds).map(([start, end], layerIndex) => {
      const windowCaptions = matchWindowCaptions(projectCaptions, {start, end}, .01).captions;
      const derived = extractBeatContent(draft.id + "-layer-" + String(layerIndex + 1), windowCaptions, {start, end, language}, beatIndex * 2 + layerIndex);
      const layerDraft = {...draft, start, end, eyebrow: derived.chapter || draft.eyebrow, subtitle: derived.headline || draft.subtitle, zh: derived.effectZh || draft.zh, effectText: derived.effectZh || draft.effectText, visualCard: derived};
      const choice = chooseUnusedComponent(buildBeatContext({text: textFor(windowCaptions), captions: windowCaptions, beatIndex, totalBeats: Math.ceil(duration / targetSeconds), layerIndex, layerCount: 2}), history, used, allowed);
      const layout = choice.componentId;
      const effectProps = semanticProps(buildEffectProps(layerDraft, windowCaptions, layout), derived, layerDraft);
      const enterOffset = round(start - draft.start);
      const layer = {layerId: "layer-" + String(layerIndex + 1), layout, category: effectProps.category, headline: effectProps.headline, effectText: effectProps.effectText, payload: {...effectProps}, effectProps: {...effectProps}, commonProps: {enterOffset, exitOffset: 0, duration: round(end - start), position: "center", offsetX: 0, offsetY: 0, scale: 1, enterAnimation: layerIndex === 0 ? "spring-up" : "slide-right", exitAnimation: "fade-out", sfx: "none"}, enterOffset};
      used.add(layout);
      history.push({layout, family: componentRegistry[layout] && componentRegistry[layout].family});
      return layer;
    });
    const primary = layers[0];
    return {...draft, layout: primary.layout, effectProps: {...primary.effectProps}, eyebrow: primary.category, subtitle: primary.headline, zh: primary.effectText, effectText: primary.effectText, layers};
  });
  const layouts = beats.flatMap((beat) => beat.layers.map((layer) => layer.layout));
  if (new Set(layouts).size !== layouts.length) throw new Error("Unique layout invariant failed.");
  const previousById = new Map((source.beats || []).map((beat) => [beat.id, beat]));
  const next = ensureProjectLifecycle({...source, captions: projectCaptions, targetBeatDuration: targetSeconds, beats, slicing: {strategy: "fixed-25-second-dual-unique-effects", targetDuration: targetSeconds, effectsPerBeat: 2, layerDuration: 11, interLayerGap: 3, uniqueLayouts: true}, updatedAt: new Date().toISOString()});
  next.beats = next.beats.map((beat) => {
    const previous = previousById.get(beat.id);
    const revision = Math.max(1, Number(previous && previous.render && previous.render.revision || 0) + 1);
    return {...beat, render: {revision, status: "stale", previewPath: null, renderedAt: null, error: null, contentHash: null, renderedVideoPath: null}, renderStatus: "dirty", renderedVideoPath: null, contentHash: null};
  });
  next.render = {...next.render, status: "stale", progress: 0, outputPath: null, renderedAt: null, error: null};
  return next;
}

function main() {
  const projectId = process.argv[2];
  if (!projectId) throw new Error("Usage: node scripts/produce-project-25s-dual-unique.cjs <projectId>");
  const root = process.cwd();
  const projectFile = join(root, "data", "projects", projectId, "project.json");
  if (!existsSync(projectFile)) throw new Error("Project not found: " + projectId);
  const source = JSON.parse(readFileSync(projectFile, "utf8"));
  const backup = join(dirname(projectFile), "project.before-25s-dual-unique-" + Date.now() + ".json");
  copyFileSync(projectFile, backup);
  const project = createTwentyFiveSecondDualUniqueProject(source, {root, targetSeconds: 25});
  writeFileSync(projectFile, JSON.stringify(project, null, 2) + "\n", "utf8");
  const output = "data/projects/" + projectId + "/renders/final/" + projectId + "-25s-dual-unique-final.mp4";
  const report = project.beats.map((beat) => ({id: beat.id, start: beat.start, end: beat.end, layers: beat.layers.map((layer) => ({layout: layer.layout, headline: layer.headline, enterOffset: layer.commonProps.enterOffset, duration: layer.commonProps.duration}))}));
  console.log(JSON.stringify({projectId, targetSeconds: 25, beatCount: project.beats.length, layerCount: project.beats.reduce((sum, beat) => sum + beat.layers.length, 0), uniqueLayouts: new Set(project.beats.flatMap((beat) => beat.layers.map((layer) => layer.layout))).size, backup, output, report}, null, 2));
}

if (require.main === module) main();
module.exports = {fixedWindows, createTwentyFiveSecondDualUniqueProject};
