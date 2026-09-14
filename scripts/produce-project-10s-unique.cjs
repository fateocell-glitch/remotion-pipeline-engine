"use strict";

const {copyFileSync, existsSync, readFileSync, writeFileSync} = require("node:fs");
const {dirname, join} = require("node:path");
const {ensureProjectLifecycle} = require("./project-render-assets.cjs");
const {hydrateBeatDrafts} = require("./project-onboarding.cjs");
const {buildEffectProps} = require("./layout-matcher.cjs");
const {buildBeatContext, componentRegistry, pickBestComponent} = require("./services/component-recommender.cjs");
const {matchWindowCaptions} = require("./services/beat-content-extraction.cjs");
const {getComponentRegistrySync} = require("./services/component-registry-store.cjs");

const round = (value) => Number(Number(value).toFixed(2));
const textFor = (captions) => captions.map((caption) => `${caption.zh || ""} ${caption.en || ""}`).join(" ").trim();
const projectDuration = (project) => Math.max(0, ...(project.captions || []).map((caption) => Number(caption.end) || 0), ...(project.beats || []).map((beat) => Number(beat.end) || 0));

function fixedWindows(totalSeconds, seconds = 10) {
  const windows = [];
  for (let start = 0, index = 1; start < totalSeconds - 0.01; start += seconds, index += 1) {
    windows.push({id: `beat-${String(index).padStart(3, "0")}`, start: round(start), end: round(Math.min(totalSeconds, start + seconds))});
  }
  if (windows.length > 1) {
    const tail = windows.at(-1);
    if (tail.end - tail.start <= 5) {
      windows.at(-2).end = tail.end;
      windows.pop();
    }
  }
  return windows;
}

function allowedLayouts(root) {
  const registered = new Set(getComponentRegistrySync(root).components.map((component) => component.id));
  return new Set(Object.keys(componentRegistry).filter((id) => registered.has(id) && !id.startsWith("copyopen-")));
}

function chooseUnusedComponent(context, history, used, allowed) {
  const recommendation = pickBestComponent(context, 0, history);
  const choice = recommendation.ranked.find((candidate) => allowed.has(candidate.componentId) && !used.has(candidate.componentId));
  if (!choice) throw new Error("10-second unique production ran out of unused visual components.");
  return choice;
}

function createTenSecondUniqueProject(source, {root = process.cwd(), targetSeconds = 10} = {}) {
  const duration = projectDuration(source);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Project has no usable caption or beat duration.");
  const language = source.language || "zh";
  const drafts = fixedWindows(duration, targetSeconds).map((beat, index) => ({
    ...beat,
    eyebrow: `${String(index + 1).padStart(2, "0")} · 核心观点`,
    subtitle: `核心观点 ${index + 1}`,
    zh: "正在提炼当前时间窗口内容",
    en: "",
    effectText: "正在提炼当前时间窗口内容",
    layout: "chapter-card",
    layoutSource: "auto",
    layoutLocked: false,
    effectProps: {},
    layers: [],
  }));
  const hydrated = hydrateBeatDrafts(drafts, source.captions || [], {force: true, language});
  const used = new Set();
  const history = [];
  const allowed = allowedLayouts(root);
  const beats = hydrated.map((draft, index) => {
    const captions = matchWindowCaptions(source.captions || [], draft, 0.01).captions;
    const choice = chooseUnusedComponent(buildBeatContext({text: textFor(captions), captions, beatIndex: index, totalBeats: hydrated.length, layerIndex: 0, layerCount: 1}), history, used, allowed);
    const layout = choice.componentId;
    const effectProps = buildEffectProps(draft, captions, layout);
    const durationSeconds = round(draft.end - draft.start);
    const layer = {
      layerId: "layer-1",
      layout,
      category: effectProps.eyebrow || draft.eyebrow,
      headline: effectProps.headline || draft.subtitle,
      effectText: effectProps.effectText || draft.effectText || draft.zh,
      payload: {...effectProps},
      effectProps: {...effectProps},
      commonProps: {enterOffset: 0, exitOffset: 0, duration: durationSeconds, position: "center", offsetX: 0, offsetY: 0, scale: 1, enterAnimation: "spring-up", exitAnimation: "none", sfx: "none"},
      enterOffset: 0,
    };
    used.add(layout);
    history.push({layout, family: componentRegistry[layout]?.family});
    return {...draft, layout, effectProps: {...effectProps}, layers: [layer], layoutSource: "auto", layoutLocked: false};
  });
  const previousById = new Map((source.beats || []).map((beat) => [beat.id, beat]));
  const next = ensureProjectLifecycle({...source, targetBeatDuration: targetSeconds, beats, slicing: {strategy: "fixed-ten-second-unique-effects", targetDuration: targetSeconds, effectsPerBeat: 1, uniqueLayouts: true}, updatedAt: new Date().toISOString()});
  next.beats = next.beats.map((beat) => {
    const previous = previousById.get(beat.id);
    const revision = Math.max(1, Number(previous?.render?.revision || 0) + 1);
    return {...beat, render: {revision, status: "stale", previewPath: null, renderedAt: null, error: null, contentHash: null, renderedVideoPath: null}, renderStatus: "dirty", renderedVideoPath: null, contentHash: null};
  });
  next.render = {...next.render, status: "stale", progress: 0, outputPath: null, renderedAt: null, error: null};
  const layouts = next.beats.flatMap((beat) => beat.layers || []).map((layer) => layer.layout);
  if (new Set(layouts).size !== layouts.length) throw new Error("Unique layout invariant failed.");
  return next;
}

function main() {
  const projectId = process.argv[2];
  if (!projectId) throw new Error("Usage: node scripts/produce-project-10s-unique.cjs <projectId>");
  const root = process.cwd();
  const projectFile = join(root, "data", "projects", projectId, "project.json");
  if (!existsSync(projectFile)) throw new Error(`Project not found: ${projectId}`);
  const source = JSON.parse(readFileSync(projectFile, "utf8"));
  const backup = join(dirname(projectFile), `project.before-10s-unique-${Date.now()}.json`);
  copyFileSync(projectFile, backup);
  const project = createTenSecondUniqueProject(source, {root, targetSeconds: 10});
  writeFileSync(projectFile, JSON.stringify(project, null, 2) + "\n", "utf8");
  const output = `data/projects/${projectId}/renders/final/${projectId}-10s-unique-final.mp4`;
  const report = project.beats.map((beat) => ({id: beat.id, start: beat.start, end: beat.end, layout: beat.layers[0].layout, headline: beat.layers[0].headline}));
  console.log(JSON.stringify({projectId, targetSeconds: 10, beatCount: project.beats.length, uniqueLayouts: new Set(report.map((item) => item.layout)).size, backup, output, report}, null, 2));
}

if (require.main === module) main();
module.exports = {fixedWindows, createTenSecondUniqueProject};