export type JasonWuSection = {
  eyebrow: string;
  subtitle: string;
};

export type JasonWuCaption = {
  zh: string;
  en: string;
};

export type JasonWuTranscriptCue = {
  start: number;
  end: number;
  zh: string;
  en: string;
};

export type JasonWuPerson = {
  name: string;
  role: string;
  meta: string;
  tone: "primary" | "muted";
};

export type JasonWuStep = {
  index: string;
  title: string;
  subtitle: string;
  active: boolean;
  tone: "blue" | "gold";
};

export type JasonWuMetric = {
  label: string;
  value: string;
  suffix: string;
  year: string;
};

export type BaseLayerCommonProps = {
  enterOffset: number;
  exitOffset?: number;
  duration?: number;
  position: "center" | "bottom-left" | "bottom-right" | "top-right" | "center-right";
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  enterAnimation: "spring-up" | "fade-scale" | "slide-left" | "slide-right" | "glitch";
  exitAnimation: "fade-out" | "slide-down" | "scale-down" | "none";
  sfx: "whoosh" | "tech-click" | "pop" | "none";
  faceAvoidanceMode?: "auto" | "manual";
};

export type JasonWuEffectLayer = {
  layerId: string;
  layout: JasonWuCue["layout"];
  effectProps?: Record<string, unknown>;
  commonProps?: Partial<BaseLayerCommonProps>;
  enterOffset?: number;
};

export type JasonWuCue = {
  id: string;
  start: number;
  end: number;
  section: JasonWuSection;
  caption: JasonWuCaption;
  layout:
    | "person-rank"
    | "event-timeline"
    | "pivot-list"
    | "value-verdict"
    | "capital-dashboard"
    | "cook-machine"
    | "engineering-return"
    | "market-battlefield"
    | "finale-kinetic"
    | "reject-list"
    | "check-progress"
    | "diagonal-chips"
    | "floating-chips"
    | "bare-typography"
    | "chapter-card"
    | "logo-wordmark"
    | "ordered-sequence"
    | "org-chart"
    | "draw-line"
    | "progress-donut"
    | "avatar-handoff"
    | "bull-bear"
    | "opinion-hero"
    | "photo-wall"
    | "product-explosion"
    | "newspaper-swap"
    | "route-map"
    | "data-flow"
    | "screen-recording"
    | "zoom-statement"
    | "desktop-folders"
    | "time-rewind"
    | "clipboard-note"
    | "closing-checklist"
    | "spotlight-question"
    | "platform-shift-line"
    | "tradeoff-reject-round"
    | "recovery-progress-bars"
    | "hud-glow-stack"
    | "briefing-poster"
    | "rewind-milestones"
    | "flying-paper-stack"
    | "checklist-editorial";
  people?: JasonWuPerson[];
  steps?: JasonWuStep[];
  metric?: JasonWuMetric;
  effectProps?: Record<string, unknown>;
  layers?: JasonWuEffectLayer[];
  faceZone?: import("../design/component-preset-resolver").FaceZone | null;
};

export const jasonWuCues: JasonWuCue[] = [
  {
    id: "intro-ceo",
    start: 0,
    end: 8,
    section: {
      eyebrow: "SEPT 1 · 2026",
      subtitle: "苹果 CEO 交棒",
    },
    caption: {
      zh: "成为了苹果新一届的 CEO",
      en: "Became the new CEO of Apple",
    },
    layout: "person-rank",
    people: [
      {
        name: "JOHN TERNUS",
        role: "约翰 · 特努斯",
        meta: "APPLE CEO · JOINED 2001",
        tone: "primary",
      },
      {
        name: "NO. 8",
        role: "任 CEO",
        meta: "库克任期 2011.08 → 2026.09 · 15 年",
        tone: "muted",
      },
    ],
  },
  {
    id: "apple-event",
    start: 8,
    end: 24,
    section: {
      eyebrow: "APPLE EVENT · SURPRISE AND SHINE",
      subtitle: "秋季发布会 · Apple Park · 10:00 PT",
    },
    caption: {
      zh: "新任的 CEO 带着他的新面孔",
      en: "The new CEO brings his new face",
    },
    layout: "event-timeline",
    steps: [
      {index: "01", title: "9/1 上午", subtitle: "APPLE INVITE", active: false, tone: "gold"},
      {index: "02", title: "剩 8 天", subtitle: "COUNTDOWN", active: true, tone: "blue"},
      {index: "03", title: "9/9 发布会", subtitle: "LIVE EVENT", active: true, tone: "blue"},
    ],
  },
  {
    id: "quality-pivot",
    start: 24,
    end: 36,
    section: {
      eyebrow: "UNDER TERNUS · 2019 / 2021",
      subtitle: "重新拥抱专业用户",
    },
    caption: {
      zh: "苹果才终于走上了",
      en: "Apple has finally arrived",
    },
    layout: "pivot-list",
    steps: [
      {index: "01", title: "架构 · Intel → Apple Silicon", subtitle: "ARCHITECTURE PIVOT", active: false, tone: "blue"},
      {index: "02", title: "品质 · 轻薄 → 极致性能", subtitle: "QUALITY PIVOT", active: true, tone: "gold"},
      {index: "03", title: "接口 · HDMI / SDXC / MagSafe", subtitle: "PORTS RETURN", active: true, tone: "blue"},
    ],
  },
  {
    id: "value-verdict",
    start: 36,
    end: 45,
    section: {
      eyebrow: "MULTI-DOMAIN · VERDICT",
      subtitle: "资本市场认可",
    },
    caption: {
      zh: "也非常认可他啊去担任",
      en: "I also approve of him very much. Go and serve",
    },
    layout: "value-verdict",
    metric: {
      label: "APPLE VALUE",
      value: "$350",
      suffix: "BILLION",
      year: "2011",
    },
  },
];

export const activeCueAtFrame = (
  cues: JasonWuCue[],
  frame: number,
  fps: number,
) => {
  const seconds = frame / fps;
  return cues.find((cue) => seconds >= cue.start && seconds < cue.end) ?? cues[cues.length - 1];
};

export const activeTranscriptAtFrame = (
  cues: JasonWuTranscriptCue[],
  frame: number,
  fps: number,
) => {
  const seconds = frame / fps;
  if (seconds < cues[0].start) {
    return cues[0];
  }
  return cues.find((cue) => seconds >= cue.start && seconds < cue.end) ?? cues[cues.length - 1];
};




