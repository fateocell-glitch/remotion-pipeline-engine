import zhuzigeProject from "./projects/zhuzige-ceo.json";
import type {VideoProject} from "./projectTypes";
import type {JasonWuCue, JasonWuTranscriptCue} from "./timeline";
import {zhuzigeFullCues} from "./zhuzigeFullScript";

export const defaultProject = zhuzigeProject as VideoProject;

const applyProjectBeat = (cue: JasonWuCue, beat: VideoProject["beats"][number]): JasonWuCue => ({
  ...cue,
  start: beat.start,
  end: beat.end,
  section: {eyebrow: beat.eyebrow, subtitle: beat.subtitle},
  caption: {zh: beat.zh, en: beat.en},
  layout: beat.layout,
  effectProps: beat.effectProps ?? cue.effectProps,
  layers: beat.layers,
  faceZone: beat.faceZone ?? null,
  language: "zh",
});

export const projectToCues = (project: VideoProject): JasonWuCue[] => {
  const language = project.language ?? "zh";
  const byId = new Map(project.beats.map((beat) => [beat.id, beat]));
  if (project.projectId === "zhuzige-ceo") {
    return zhuzigeFullCues.map((cue) => {
      const beat = byId.get(cue.id);
      return {...(beat ? applyProjectBeat(cue, beat) : cue), language};
    });
  }

  return project.beats.map((beat) => ({
    id: beat.id,
    start: beat.start,
    end: beat.end,
    section: {eyebrow: beat.eyebrow, subtitle: beat.subtitle},
    caption: {zh: beat.zh, en: beat.en},
    layout: beat.layout,
    effectProps: beat.effectProps,
    layers: beat.layers,
    faceZone: beat.faceZone ?? null,
    language,
  }));
};

const terminalPunctuation = (value: string) => /[。！？!?]$/.test(value.trim());
const subtitleZhLength = (value: string) => Array.from(value.replace(/\s/g, "")).length;
const subtitleEnglishWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

export const groupTranscriptForDisplay = (captions: JasonWuTranscriptCue[]): JasonWuTranscriptCue[] => {
  const rows = (captions ?? [])
    .map((caption) => ({start: Number(caption.start), end: Number(caption.end), zh: String(caption.zh ?? "").trim(), en: String(caption.en ?? "").trim()}))
    .filter((caption) => Number.isFinite(caption.start) && Number.isFinite(caption.end) && caption.end > caption.start && (caption.zh || caption.en))
    .sort((left, right) => left.start - right.start);
  const groups: JasonWuTranscriptCue[] = [];
  let current: JasonWuTranscriptCue | null = null;
  const flush = () => {
    if (current) groups.push(current);
    current = null;
  };

  rows.forEach((caption) => {
    if (!current) {
      current = {...caption};
      return;
    }
    const nextZh = current.zh + caption.zh;
    const nextEn = [current.en, caption.en].filter(Boolean).join(" ");
    const exceedsDisplayBudget = subtitleZhLength(nextZh) > 56 || subtitleEnglishWords(nextEn) > 28 || caption.end - current.start > 7;
    if (caption.start - current.end > 0.65 || exceedsDisplayBudget) {
      flush();
      current = {...caption};
      return;
    }
    current = {start: current.start, end: caption.end, zh: nextZh, en: nextEn};
    if ((subtitleZhLength(nextZh) >= 42 || subtitleEnglishWords(nextEn) >= 18) && (terminalPunctuation(nextZh) || terminalPunctuation(nextEn))) flush();
  });
  flush();
  return groups;
};

export const projectToTranscript = (project: VideoProject): JasonWuTranscriptCue[] => groupTranscriptForDisplay(project.captions);

export const durationInFramesForProject = (project: VideoProject): number => Math.max(1, Math.ceil(Math.max(...project.beats.map((beat) => beat.end), 0) * project.fps));
