import type {JasonWuCue} from "./timeline";

const ARRAY_LAYOUTS = new Set<JasonWuCue["layout"]>([
  "diagonal-chips", "floating-chips", "ordered-sequence", "closing-checklist", "photo-wall",
  "reject-list", "check-progress", "org-chart", "product-explosion", "route-map",
  "screen-recording", "desktop-folders", "time-rewind", "spotlight-question", "event-timeline",
  "capital-dashboard", "market-battlefield", "platform-shift-line", "tradeoff-reject-round",
  "recovery-progress-bars", "hud-glow-stack", "briefing-poster", "rewind-milestones",
  "flying-paper-stack", "checklist-editorial",
]);
const TYPEWRITER_LAYOUTS = new Set<JasonWuCue["layout"]>(["pivot-list", "engineering-return"]);

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const textSegments = (value: unknown) => clean(value).split(/[。！？；;，,\n]+/).map((item) => item.trim()).filter(Boolean);
const strings = (value: unknown) => Array.isArray(value) ? value.map(clean).filter(Boolean) : [];

export const resolveContentText = (cue: JasonWuCue, props: Record<string, unknown> | undefined, key?: string): string => {
  const direct = key ? clean(props?.[key]) : "";
  return direct || clean(props?.effectZh) || clean(cue.caption.zh) || clean(cue.section.subtitle) || clean(cue.section.eyebrow);
};

export const resolveContentItems = (cue: JasonWuCue, props: Record<string, unknown> | undefined, keys: string[] = ["items"]): string[] => {
  for (const key of keys) {
    const items = strings(props?.[key]);
    if (items.length) return items;
  }
  const spoken = textSegments(props?.effectZh || cue.caption.zh);
  if (spoken.length) return spoken;
  const headline = resolveContentText(cue, props, "headline");
  return headline ? [headline] : [];
};

export const resolveContentNumber = (props: Record<string, unknown> | undefined, key: string, fallback = 0): number => {
  const value = props?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

export const isArrayLayout = (layout: JasonWuCue["layout"]) => ARRAY_LAYOUTS.has(layout);
export const isTypewriterLayout = (layout: JasonWuCue["layout"]) => TYPEWRITER_LAYOUTS.has(layout);

export const getEntranceDurationSeconds = (layout: JasonWuCue["layout"], itemCount = 1, textLength = 0): number => {
  if (isTypewriterLayout(layout)) return Math.max(2.5, textLength / 12);
  if (isArrayLayout(layout)) return Math.max(2.5, 0.8 + itemCount * 0.5);
  return 2.2;
};

export const getEntranceDurationFrames = (layout: JasonWuCue["layout"], fps: number, itemCount = 1, textLength = 0): number => Math.max(1, Math.round(getEntranceDurationSeconds(layout, itemCount, textLength) * fps));
export const getStaggerStartFrame = (fps: number, index: number): number => Math.round((0.5 + index * 0.5) * fps);
