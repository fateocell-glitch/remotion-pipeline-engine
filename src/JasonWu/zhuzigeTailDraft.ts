import draft from "./zhuzigeTailEditorDraft.json";
import subtitleDraft from "./zhuzigeTailSubtitleDraft.json";
import type {JasonWuCue, JasonWuTranscriptCue} from "./timeline";

type TailDraftBeat = {
  id: string;
  eyebrow: string;
  subtitle: string;
  zh: string;
  en: string;
  layout: JasonWuCue["layout"];
};

type TailSubtitleDraft = {
  start: number;
  end: number;
  zh: string;
  en: string;
};

const tailDraftById = new Map<string, TailDraftBeat>(
  draft.beats.map((beat) => [beat.id, beat as TailDraftBeat]),
);

const subtitleDraftByTime = new Map<string, TailSubtitleDraft>(
  subtitleDraft.captions.map((caption) => [`${caption.start}|${caption.end}`, caption as TailSubtitleDraft]),
);

export const applyZhuzigeTailDraft = (cues: JasonWuCue[]): JasonWuCue[] =>
  cues.map((cue) => {
    const override = tailDraftById.get(cue.id);
    if (!override) {
      return cue;
    }
    return {
      ...cue,
      section: {eyebrow: override.eyebrow, subtitle: override.subtitle},
      caption: {zh: override.zh, en: override.en},
      layout: override.layout,
    };
  });

export const applyZhuzigeTailSubtitleDraft = (
  captions: JasonWuTranscriptCue[],
): JasonWuTranscriptCue[] =>
  captions.map((caption) => {
    const override = subtitleDraftByTime.get(`${caption.start}|${caption.end}`);
    return override ? {...caption, zh: override.zh, en: override.en} : caption;
  });
