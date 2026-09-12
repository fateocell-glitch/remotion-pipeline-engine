import {zhuzigeFullCues} from "./zhuzigeFullScript";
import type {JasonWuCue} from "./timeline";

export const V2_LAYOUTS = [
  "photo-stack", "logo-split", "animated-text", "progress-steps", "grid-pulse",
  "line-chart", "chapter-title", "comparison-chart", "progress-bars", "image-comparison",
  "gallery-grid", "donut-chart", "animated-list", "stat-counter", "masonry-gallery",
  "area-chart", "polaroid-frame", "split-screen", "card-flip", "matrix-rain",
  "circular-progress", "notification-pop", "image-carousel", "text-highlight", "image-zoom",
  "quote-card", "title-split", "logo-stroke", "popping-text", "glitch-text", "spotlight-reveal",
] as const;

export type ZhuzigeV2Layout = (typeof V2_LAYOUTS)[number];
export type ZhuzigeV2Cue = Omit<JasonWuCue, "layout"> & {layout: ZhuzigeV2Layout};

// V2 preserves V1 timing and narration while assigning every beat a new template-library stage.
export const zhuzigeFullCuesV2: ZhuzigeV2Cue[] = zhuzigeFullCues.map((cue, index) => ({
  ...cue,
  layout: V2_LAYOUTS[index],
}));
