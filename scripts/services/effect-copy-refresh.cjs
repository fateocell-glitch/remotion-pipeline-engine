"use strict";

const compactText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const shortText = (value, maxLength) => {
  const text = compactText(value);
  return text.length > maxLength ? text.slice(0, Math.max(1, maxLength - 3)) + "..." : text;
};
const isManualBeat = (beat) => beat?.layoutLocked || beat?.layoutSource === "manual" || beat?.effectCopySource === "manual";
const isOversized = (value, limit) => compactText(value).length > limit;

function refreshProjectEffectCopy(project) {
  let changed = 0;
  const captions = Array.isArray(project?.captions) ? project.captions : [];
  const beats = (project?.beats ?? []).map((beat) => {
    if (isManualBeat(beat)) return beat;
    const shouldRefreshZh = isOversized(beat.zh, 36);
    const shouldRefreshEn = isOversized(beat.en, 120);
    if (!shouldRefreshZh && !shouldRefreshEn) return beat;
    const overlapping = captions.filter((caption) => caption.end > beat.start && caption.start < beat.end);
    const matched = (overlapping.length ? overlapping : captions.filter((caption) => caption.end <= beat.start).slice(-1)).slice(0, 2);
    const zh = shortText(matched.map((caption) => caption.zh).join(" "), 36);
    const en = shortText(matched.map((caption) => caption.en).filter(Boolean).join(" "), 120);
    if (!zh && !en) return beat;
    changed += 1;
    return {...beat, zh: shouldRefreshZh && zh ? zh : beat.zh, en: shouldRefreshEn && en ? en : beat.en, effectCopySource: "auto"};
  });
  return {project: {...project, beats}, changed};
}
module.exports = {refreshProjectEffectCopy};
