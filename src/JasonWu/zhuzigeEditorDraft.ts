import beatDraft from "./zhuzigeEditorDraft.json";
import subtitleDraft from "./zhuzigeSubtitleDraft.json";
import type {JasonWuCue, JasonWuTranscriptCue} from "./timeline";

type BeatDraft = {
  id: string;
  eyebrow: string;
  subtitle: string;
  zh: string;
  en: string;
  layout: JasonWuCue["layout"];
  effectProps?: Record<string, unknown>;
};

type SubtitleDraft = {
  start: number;
  end: number;
  zh: string;
  en: string;
};

const beatsById = new Map<string, BeatDraft>(
  beatDraft.beats.map((beat) => [beat.id, beat as BeatDraft]),
);

const subtitlesByTime = new Map<string, SubtitleDraft>(
  subtitleDraft.captions.map((caption) => [`${caption.start}|${caption.end}`, caption as SubtitleDraft]),
);

export const applyZhuzigeEditorDraft = (cues: JasonWuCue[]): JasonWuCue[] =>
  cues.map((cue) => {
    const override = beatsById.get(cue.id);
    return override
      ? {
          ...cue,
          section: {eyebrow: override.eyebrow, subtitle: override.subtitle},
          caption: {zh: override.zh, en: override.en},
          layout: override.layout,
          effectProps: override.effectProps ?? cue.effectProps,
        }
      : cue;
  });

export const applyZhuzigeSubtitleDraft = (
  captions: JasonWuTranscriptCue[],
): JasonWuTranscriptCue[] =>
  captions.map((caption) => {
    const override = subtitlesByTime.get(`${caption.start}|${caption.end}`);
    return override ? {...caption, zh: override.zh, en: override.en} : caption;
  });

