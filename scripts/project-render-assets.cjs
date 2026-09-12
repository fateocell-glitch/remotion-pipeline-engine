"use strict";

const {createHash} = require("node:crypto");
const {mergeGlobalSettings} = require("./services/global-settings.cjs");
const {compactEffectCopy} = require("./services/effect-copy.cjs");
const {componentPresetFingerprintSync} = require("./services/component-registry-store.cjs");

const safeId = (value) => String(value ?? "").replace(/[^a-z0-9_-]/gi, "-");
const stableJson = (value) => {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => JSON.stringify(key) + ":" + stableJson(value[key])).join(",") + "}";
  return JSON.stringify(value);
};
const defaultProjectRender = () => ({status: "idle", progress: 0, outputPath: null, renderedAt: null, error: null});
const defaultBeatRender = () => ({revision: 1, status: "idle", previewPath: null, renderedAt: null, error: null, contentHash: null, renderedVideoPath: null});

function ensureProjectLifecycle(project) {
  return {
    ...project,
    globalSettings: mergeGlobalSettings(project.globalSettings),
    render: {...defaultProjectRender(), ...(project.render ?? {})},
    beats: (project.beats ?? []).map((beat) => ({
      ...beat,
      subtitle: compactEffectCopy(beat.subtitle),
      zh: compactEffectCopy(beat.zh),
      en: compactEffectCopy(beat.en),
      render: {...defaultBeatRender(), ...(beat.render ?? {})},
    })),
  };
}

function projectAssetDir(projectId) {
  return `data/projects/${safeId(projectId)}/renders/beats`;
}
function currentAssetPath(projectId, beat) {
  const revision = Math.max(1, Number(beat?.render?.revision ?? 1));
  return `${projectAssetDir(projectId)}/${safeId(beat?.id)}-r${revision}.mp4`;
}
function renderPayload(project, beat, presetSignature) {
  const {render, renderStatus, renderedVideoPath, contentHash, lastRenderedHash, renderedAt, layout, effectProps, enterOffset, ...beatData} = beat ?? {};
  const captions = (project.captions ?? []).filter((caption) => Number(caption.end) > Number(beat?.start) && Number(caption.start) < Number(beat?.end)).map((caption) => ({
    id: caption.id, start: caption.start, end: caption.end, zh: caption.zh, en: caption.en,
  }));
  const layouts = [...new Set([layout, ...(Array.isArray(beatData.layers) ? beatData.layers.map((layer) => layer?.layout) : [])].filter(Boolean))];
  const resolvedPresets = Array.isArray(presetSignature) ? presetSignature.filter((entry) => layouts.includes(entry?.id)) : componentPresetFingerprintSync(process.cwd(), layouts);
  return {version: 3, fps: project.fps, globalSettings: project.globalSettings, componentPresets: resolvedPresets, beat: {id: beatData.id, start: beatData.start, end: beatData.end, eyebrow: beatData.eyebrow, subtitle: beatData.subtitle, zh: beatData.zh, en: beatData.en, layers: beatData.layers, faceZone: beatData.faceZone}, captions};
}
function renderContentHash(project, beat, presetSignature) {
  return createHash("sha256").update(stableJson(renderPayload(project, beat, presetSignature))).digest("hex");
}
function recoverOrphanedBeatRenders(project, isRunning = () => false) {
  const normalized = ensureProjectLifecycle(project);
  let changed = false;
  const beats = normalized.beats.map((beat) => {
    if (beat.render?.status !== "rendering" && beat.renderStatus !== "rendering") return beat;
    if (isRunning(beat)) return beat;
    changed = true;
    return {
      ...beat,
      renderStatus: "dirty",
      renderedVideoPath: null,
      contentHash: null,
      render: {
        ...beat.render,
        status: "stale",
        previewPath: null,
        renderedVideoPath: null,
        contentHash: null,
        renderedAt: null,
        error: "上一次合成任务已中断，请重新合成。",
      },
    };
  });
  return {project: {...normalized, beats}, changed};
}

function reconcileProjectRenderCache(project, assetExists) {
  const normalized = ensureProjectLifecycle(project);
  let changed = false;
  const beats = normalized.beats.map((beat) => {
    const render = beat.render;
    const expectedHash = renderContentHash(normalized, beat);
    const path = render.renderedVideoPath || render.previewPath || beat.renderedVideoPath;
    const isRendered = render.status === "ready" || render.status === "rendered" || beat.renderStatus === "rendered";
    if (isRendered && path && render.contentHash && assetExists(path)) {
      const next = {...beat, renderStatus: "rendered", renderedVideoPath: path, contentHash: expectedHash, render: {...render, status: "ready", previewPath: path, renderedVideoPath: path, contentHash: expectedHash, error: null}};
      if (stableJson(next) !== stableJson(beat)) changed = true;
      return next;
    }
    if (isRendered) {
      changed = true;
      return {...beat, renderStatus: "dirty", renderedVideoPath: null, contentHash: null, render: {...render, status: "stale", previewPath: null, renderedVideoPath: null, contentHash: null, renderedAt: null}};
    }
    return beat;
  });
  return {project: {...normalized, beats}, changed};
}
function invalidateBeat(project, beatId) {
  const normalized = ensureProjectLifecycle(project);
  let found = false;
  const beats = normalized.beats.map((beat) => {
    if (beat.id !== beatId) return beat;
    found = true;
    return {...beat, renderStatus: "dirty", renderedVideoPath: null, contentHash: null, render: {...defaultBeatRender(), revision: beat.render.revision + 1, status: "stale"}};
  });
  if (!found) throw new Error(`Unknown beat: ${beatId}`);
  return {...normalized, beats, render: {...normalized.render, status: "stale", progress: 0, outputPath: null, renderedAt: null, error: null}};
}
function editableBeat(beat) {
  const {render, renderStatus, renderedVideoPath, contentHash, lastRenderedHash, ...fields} = beat;
  return fields;
}

function captionIdentity(caption, index) {
  const id = String(caption?.id ?? "").trim();
  if (id) return "id:" + id;
  return "time:" + Number(caption?.start ?? 0).toFixed(3) + ":" + Number(caption?.end ?? 0).toFixed(3) + ":" + index;
}

function captionRenderPayload(caption) {
  return {
    start: Number(caption?.start ?? 0),
    end: Number(caption?.end ?? 0),
    zh: String(caption?.zh ?? ""),
    en: String(caption?.en ?? ""),
  };
}

function changedCaptionWindows(previousCaptions, editedCaptions) {
  const before = new Map((previousCaptions ?? []).map((caption, index) => [captionIdentity(caption, index), caption]));
  const after = new Map((editedCaptions ?? []).map((caption, index) => [captionIdentity(caption, index), caption]));
  const changed = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const previousCaption = before.get(key);
    const editedCaption = after.get(key);
    if (stableJson(captionRenderPayload(previousCaption)) !== stableJson(captionRenderPayload(editedCaption))) {
      if (previousCaption) changed.push(previousCaption);
      if (editedCaption) changed.push(editedCaption);
    }
  }
  return changed;
}

function captionChangeOverlapsBeat(changedCaptions, beat) {
  return changedCaptions.some((caption) => Number(caption?.end) > Number(beat?.start) && Number(caption?.start) < Number(beat?.end));
}

function mergeProjectEdits(previousProject, editedProject) {
  const previous = ensureProjectLifecycle(previousProject);
  const edited = ensureProjectLifecycle(editedProject);
  const previousById = new Map(previous.beats.map((beat) => [beat.id, beat]));
  const captionChanges = changedCaptionWindows(previous.captions, edited.captions);
  let changed = captionChanges.length > 0;
  const beats = edited.beats.map((beat) => {
    const before = previousById.get(beat.id);
    if (!before) { changed = true; return {...beat, renderStatus: "dirty", render: defaultBeatRender()}; }
    const beatChanged = stableJson(editableBeat(before)) !== stableJson(editableBeat(beat));
    const captionChanged = captionChangeOverlapsBeat(captionChanges, beat);
    if (!beatChanged && !captionChanged) return {...beat, render: before.render, renderStatus: before.renderStatus, renderedVideoPath: before.renderedVideoPath, contentHash: before.contentHash};
    changed = true;
    return {...beat, renderStatus: "dirty", renderedVideoPath: null, contentHash: null, render: {...defaultBeatRender(), revision: before.render.revision + 1, status: "stale"}};
  });
  return {...edited, beats, render: changed ? {...edited.render, status: "stale", progress: 0, outputPath: null, renderedAt: null, error: null} : previous.render};
}
function updateBeatRender(project, beatId, revision, patch) {
  const normalized = ensureProjectLifecycle(project);
  return {...normalized, beats: normalized.beats.map((beat) => {
    if (beat.id !== beatId || beat.render.revision !== revision) return beat;
    const render = {...beat.render, ...patch};
    const status = patch.status;
    const rendered = status === "ready" || status === "rendered";
    const invalid = status === "stale" || status === "failed";
    return {...beat, render, ...(rendered ? {renderStatus: "rendered", renderedVideoPath: render.renderedVideoPath || render.previewPath, contentHash: render.contentHash} : {}), ...(invalid ? {renderStatus: status === "failed" ? "failed" : "dirty", renderedVideoPath: null, contentHash: null} : {}), ...(status === "rendering" ? {renderStatus: "rendering"} : {})};
  })};
}
function canAssemble(beats) { return beats.length > 0 && beats.every((beat) => beat?.render?.status === "ready"); }
module.exports = {canAssemble, currentAssetPath, defaultBeatRender, defaultProjectRender, ensureProjectLifecycle, invalidateBeat, mergeProjectEdits, projectAssetDir, recoverOrphanedBeatRenders, reconcileProjectRenderCache, renderContentHash, renderPayload, updateBeatRender};

