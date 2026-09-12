import type {JasonWuCue, JasonWuEffectLayer, JasonWuTranscriptCue} from "./timeline";
import type {GlobalVideoSettings} from "./globalSettings";

export type ProjectBeat = {
  id: string;
  start: number;
  end: number;
  eyebrow: string;
  subtitle: string;
  zh: string;
  en: string;
  effectText?: string;
  layout: JasonWuCue["layout"];
  effectProps?: Record<string, unknown>;
  layers?: JasonWuEffectLayer[];
  layoutSource?: "auto" | "manual";
  layoutLocked?: boolean;
  faceZone?: {faceX:number; faceY:number; faceW:number; faceH:number; safeX?:number; safeY?:number; safeW?:number; safeH?:number; faceArea:"left"|"center"|"right"; detectorVersion?:string; sourceFingerprint?:string} | null;
};

export type VideoProject = {
  schemaVersion: number;
  projectId: string;
  name: string;
  compositionId: string;
  fps: number;
  width: number;
  height: number;
  videoSrc: string;
  audioSrc?: string;
  loopVideoFrames?: number;
  targetBeatDuration?: number;
  language?: "zh" | "en";
  beats: ProjectBeat[];
  captions: JasonWuTranscriptCue[];
  globalSettings?: GlobalVideoSettings;
};



