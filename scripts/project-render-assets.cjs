"use strict";

const {createHash} = require("node:crypto");
const {mergeGlobalSettings} = require("./services/global-settings.cjs");
const {compactEffectCopy} = require("./services/effect-copy.cjs");
const {normalizeBeatLayers} = require("./services/effect-layer-schema.cjs");
const {componentPresetFingerprintSync} = require("./services/component-registry-store.cjs");

const safeId = (value) => String(value ?? "").replace(/[^a-z0-9_-]/gi, "-");
const stableJson = (value) => {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => JSON.stringify(key) + ":" + stableJson(value[key])).join(",") + "}";
  return JSON.stringify(value);
};
const defaultProjectRender = () => ({status: "idle", progress: 0, outputPath: null, renderedAt: null, error: null});
const defaultBeatRender = () => ({revision: 1, status: "idle", previewPath: null, renderedAt: null, error: null, contentHash: null, renderedVideoPath: null});
const TERMINAL_MICRO_TAIL_MAX_DURATION = 5;
const TERMINAL_TAIL_MAX_DURATION = 38;
function absorbTerminalTailBeats(beats) {
  const source = Array.isArray(beats) ? beats : [];
  if (source.length < 2) return source;
  const previous = source[source.length - 2];
  const tail = source[source.length - 1];
  const previousDuration = Number(previous?.end) - Number(previous?.start);
  const tailDuration = Number(tail?.end) - Number(tail?.start);
  if (!Number.isFinite(previousDuration) || !Number.isFinite(tailDuration) || tailDuration <= 0 || tailDuration > TERMINAL_MICRO_TAIL_MAX_DURATION || previousDuration + tailDuration > TERMINAL_TAIL_MAX_DURATION) return source;
  const handoffOffset = previousDuration;
  const previousLayers = Array.isArray(previous.layers) ? previous.layers.map((layer) => ({...layer, commonProps:{...(layer.commonProps ?? {})}})) : [];
  const lastPreviousLayer = previousLayers.at(-1);
  if (lastPreviousLayer) {
    const enterOffset = Math.max(0, Number(lastPreviousLayer.commonProps?.enterOffset ?? lastPreviousLayer.enterOffset) || 0);
    lastPreviousLayer.commonProps.duration = Math.max(.01, handoffOffset - enterOffset);
    if (!lastPreviousLayer.commonProps.exitAnimation || lastPreviousLayer.commonProps.exitAnimation === "none") lastPreviousLayer.commonProps.exitAnimation = "fade-out";
  }
  const tailLayers = (Array.isArray(tail.layers) ? tail.layers : []).map((layer, index) => {
    const commonProps = {...(layer.commonProps ?? {})};
    const localEnter = Math.max(0, Number(commonProps.enterOffset ?? layer.enterOffset) || 0);
    commonProps.enterOffset = Number((handoffOffset + localEnter).toFixed(2));
    return {...layer, layerId:"tail-" + tail.id + "-" + (layer.layerId || index + 1), commonProps, enterOffset:commonProps.enterOffset};
  });
  const previousRender = previous.render ?? defaultBeatRender();
  const artifactPath = previousRender.renderedVideoPath || previousRender.previewPath || previous.renderedVideoPath || null;
  const artifactHash = previousRender.contentHash || previous.contentHash || null;
  const merged = {...previous, end:tail.end, layers:[...previousLayers, ...tailLayers], faceZone:tail.faceZone ?? previous.faceZone ?? null, terminalTailAbsorbed:{sourceBeatId:tail.id, tailDuration:Number(tailDuration.toFixed(2)), mergedAt:new Date().toISOString()}, renderStatus:"dirty", renderedVideoPath:artifactPath, contentHash:artifactHash, render:{...previousRender, revision:Math.max(1, Number(previousRender.revision) || 1) + 1, status:"stale", previewPath:artifactPath, renderedVideoPath:artifactPath, contentHash:artifactHash, error:null}};
  return [...source.slice(0, -2), merged];
}


function ensureProjectLifecycle(project) {
  return {
    ...project,
    globalSettings: mergeGlobalSettings(project.globalSettings),
    render: {...defaultProjectRender(), ...(project.render ?? {})},
    beats: absorbTerminalTailBeats((project.beats ?? []).map((beat) => ({
      ...beat,
      subtitle: compactEffectCopy(beat.subtitle),
      zh: compactEffectCopy(beat.zh),
      en: compactEffectCopy(beat.en),
      layers: normalizeBeatLayers(beat),
      render: {...defaultBeatRender(), ...(beat.render ?? {})},
    }))),
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
  const renderPresets = resolvedPresets.map((preset) => ({id:preset?.id, family:preset?.family, displayIntent:preset?.displayIntent, tokens:preset?.tokens, sfx:preset?.sfx}));
  return {version: 7, presenterSafeContract: 2, typographyContract: 2, fps: project.fps, globalSettings: project.globalSettings, componentPresets: renderPresets, beat: {id: beatData.id, start: beatData.start, end: beatData.end, eyebrow: beatData.eyebrow, subtitle: beatData.subtitle, zh: beatData.zh, en: beatData.en, layers: beatData.layers, faceZone: beatData.faceZone}, captions};
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
    const storedPath = render.renderedVideoPath || render.previewPath || beat.renderedVideoPath;
    const canonicalPath = currentAssetPath(normalized.projectId, beat);
    const path = storedPath && assetExists(storedPath) ? storedPath : assetExists(canonicalPath) ? canonicalPath : null;
    const isRendered = render.status === "ready" || render.status === "rendered" || beat.renderStatus === "rendered";
    const canInspectArtifact = Boolean(path) && (isRendered || render.status === "stale" || beat.renderStatus === "dirty" || beat.renderStatus === "failed");
    if (isRendered && path && render.contentHash === expectedHash) {
      const next = {...beat, renderStatus: "rendered", renderedVideoPath: path, contentHash: expectedHash, render: {...render, status: "ready", previewPath: path, renderedVideoPath: path, contentHash: expectedHash, error: null}};
      if (stableJson(next) !== stableJson(beat)) changed = true;
      return next;
    }
    if (canInspectArtifact) {
      const next = {...beat, renderStatus: "dirty", renderedVideoPath: path, contentHash: render.contentHash || beat.contentHash || null, render: {...render, status: "stale", previewPath: path, renderedVideoPath: path, error: render.error || null}};
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
    const artifactPath = beat.render.renderedVideoPath || beat.render.previewPath || beat.renderedVideoPath || null;
    const artifactHash = beat.render.contentHash || beat.contentHash || null;
    return {...beat, renderStatus: "dirty", renderedVideoPath: artifactPath, contentHash: artifactHash, render: {...defaultBeatRender(), revision: beat.render.revision + 1, status: "stale", previewPath: artifactPath, renderedVideoPath: artifactPath, contentHash: artifactHash, renderedAt: beat.render.renderedAt || null}};
  });
  if (!found) throw new Error("Unknown beat: " + beatId);
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
    const artifactPath = before.render.renderedVideoPath || before.render.previewPath || before.renderedVideoPath || null;
    const artifactHash = before.render.contentHash || before.contentHash || null;
    return {...beat, renderStatus: "dirty", renderedVideoPath: artifactPath, contentHash: artifactHash, render: {...defaultBeatRender(), revision: before.render.revision + 1, status: "stale", previewPath: artifactPath, renderedVideoPath: artifactPath, contentHash: artifactHash, renderedAt: before.render.renderedAt || null}};
  });
  return {...edited, beats, render: changed ? {...edited.render, status: "stale", progress: 0, outputPath: null, renderedAt: null, error: null} : previous.render};
}
function updateBeatRender(project, beatId, revision, patch) {
  const normalized = ensureProjectLifecycle(project);
  return {...normalized, beats: normalized.beats.map((beat) => {
    if (beat.id !== beatId || beat.render.revision !== revision) return beat;
    const previousArtifact = beat.render.renderedVideoPath || beat.render.previewPath || beat.renderedVideoPath || null;
    const render = {...beat.render, ...patch};
    const artifactPath = render.renderedVideoPath || render.previewPath || previousArtifact;
    const artifactHash = render.contentHash || beat.contentHash || null;
    const status = patch.status;
    const rendered = status === "ready" || status === "rendered";
    const invalid = status === "stale" || status === "failed";
    const cachedRender = invalid ? {...render, previewPath: artifactPath, renderedVideoPath: artifactPath, contentHash: artifactHash} : render;
    return {...beat, render: cachedRender, ...(rendered ? {renderStatus: "rendered", renderedVideoPath: artifactPath, contentHash: artifactHash} : {}), ...(invalid ? {renderStatus: status === "failed" ? "failed" : "dirty", renderedVideoPath: artifactPath, contentHash: artifactHash} : {}), ...(status === "rendering" ? {renderStatus: "rendering"} : {})};
  })};
}
function canAssemble(beats) { return beats.length > 0 && beats.every((beat) => beat?.render?.status === "ready"); }
module.exports = {absorbTerminalTailBeats, canAssemble, currentAssetPath, defaultBeatRender, defaultProjectRender, ensureProjectLifecycle, invalidateBeat, mergeProjectEdits, projectAssetDir, recoverOrphanedBeatRenders, reconcileProjectRenderCache, renderContentHash, renderPayload, updateBeatRender};

