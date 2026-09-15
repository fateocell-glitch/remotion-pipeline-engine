import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Loop,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CommercialTextRole,
  JasonWuCue,
  JasonWuPerson,
  JasonWuStep,
  JasonWuTranscriptCue,
  activeCueAtFrame,
  activeTranscriptAtFrame,
  jasonWuCues,
} from "./timeline";
import {jasonWuLongCues} from "./longScript";
import {jasonWuLongTranscript} from "./longTranscript";
import {jasonWuTestCues} from "./testScript";
import {jasonWuTestTranscript} from "./testTranscript";
import {zhuzigeFullCues} from "./zhuzigeFullScript";
import {zhuzigeFullTranscript} from "./zhuzigeFullTranscript";
import {applyZhuzigeTailDraft, applyZhuzigeTailSubtitleDraft} from "./zhuzigeTailDraft";
import {applyZhuzigeEditorDraft, applyZhuzigeSubtitleDraft} from "./zhuzigeEditorDraft";
import {LayoutEffectHeader, LayoutEffectRenderer} from "./DemoEffectAdditions";
import {activeLayerAtTime, layerCue, normalizeCueLayers} from "./effectLayers";
import {defaultProject, projectToCues, projectToTranscript} from "./projectLoader";
import type {VideoProject} from "./projectTypes";
import {DEFAULT_GLOBAL_SETTINGS, mergeGlobalSettings} from "./globalSettings";
import {MotionWrapper} from "./components/common/MotionWrapper";
import {getEntranceDurationSeconds, resolveContentItems, resolveContentText} from "./layoutRuntime";
import {resolveFaceAwareLayerForRender} from "../design/component-preset-resolver";
import {getLayoutDefinition} from "./layoutRegistry";

const COLORS = {
  blue: "var(--primary-accent)",
  blueSoft: "rgba(10, 132, 255, 0.2)",
  gold: "#FFD166",
  white: "#FFFFFF",
  dim: "rgba(255, 255, 255, 0.58)",
  panel: "rgba(5, 8, 14, 0.58)",
  panelDeep: "rgba(3, 5, 10, 0.76)",
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const CARD_ENTRY_FRAMES = 30;
const CHIP_ENTRY_FRAMES = 30;
const CHIP_STAGGER_FRAMES = 16;

const numberPatterns = /(\$?\d+(?:\.\d+)?(?:%|B)?)/g;
const fullNumberPattern = /^\$?\d+(?:\.\d+)?(?:%|B)?$/;
const keywordPatterns =
  /(苹果|Apple|库克|Cook|特纳斯|Ternus|CEO|AI|NEXT|Siri|硬件|工程师|财会|财务|现金流|供应链|服务业务|十五年|二十五年|三十天|二到五天|三千五百亿|四点六万亿|一千亿|一千六百亿|二十二亿|百分之七点五)/gi;
const fullKeywordPattern =
  /^(苹果|Apple|库克|Cook|特纳斯|Ternus|CEO|AI|NEXT|Siri|硬件|工程师|财会|财务|现金流|供应链|服务业务|十五年|二十五年|三十天|二到五天|三千五百亿|四点六万亿|一千亿|一千六百亿|二十二亿|百分之七点五)$/i;

const sceneProgress = (frame: number, cue: JasonWuCue, fps: number) =>
  interpolate(frame, [cue.start * fps, cue.end * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const entryStyle = (frame: number, startFrame: number, x = -18) => ({
  opacity: interpolate(frame, [startFrame, startFrame + CARD_ENTRY_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  }),
  translate: `${interpolate(frame, [startFrame, startFrame + CARD_ENTRY_FRAMES], [x, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  })}px 0px`,
});

const digitValue = (value: string) => {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const AnimatedNumber: React.FC<{
  value: string;
  startFrame: number;
  fontSize?: number;
  color?: string;
}> = ({value, startFrame, fontSize, color}) => {
  const frame = useCurrentFrame();
  const raw = value.match(/\d+(?:\.\d+)?/)?.[0] ?? value;
  const prefix = value.slice(0, value.indexOf(raw));
  const suffix = value.slice(value.indexOf(raw) + raw.length);
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  const animated = interpolate(
    frame,
    [startFrame, startFrame + 42],
    [0, digitValue(raw)],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut},
  );

  return (
    <span style={{fontSize, color, display: "inline-block"}}>
      {prefix}
      {animated.toFixed(decimals)}
      {suffix}
    </span>
  );
};

const RollingNumber: React.FC<{
  from: number;
  to: number;
  startFrame: number;
  endFrame: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}> = ({from, to, startFrame, endFrame, decimals = 0, prefix = "", suffix = ""}) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame, [startFrame, endFrame], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <span>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
};

const AnimatedNumericText: React.FC<{
  text: string;
  startFrame: number;
  color?: string;
}> = ({text, startFrame, color}) => {
  const parts = text.split(numberPatterns);
  return (
    <>
      {parts.map((part, index) =>
        fullNumberPattern.test(part) ? (
          <AnimatedNumber key={`${part}-${index}`} value={part} startFrame={startFrame} color={color} />
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
};

const keywordColor = (word: string) => {
  if (/AI|NEXT|Siri/i.test(word)) {
    return "#36D399";
  }
  if (/库克|Cook|财会|财务|现金流|供应链|服务业务/i.test(word)) {
    return COLORS.gold;
  }
  return COLORS.blue;
};

const HighlightedText: React.FC<{text: string; highlightColor?: string}> = ({text, highlightColor = COLORS.gold}) => {
  let highlighted = 0;
  return (
    <>
      {text.split(keywordPatterns).map((part, index) => {
        if (!part) return null;
        if (fullKeywordPattern.test(part) && highlighted < 2) {
          highlighted += 1;
          return <span key={`${part}-${index}`} style={{color: keywordColor(part) === COLORS.blue ? COLORS.blue : highlightColor}}>{part}</span>;
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
};

const floatingGlow = (frame: number, startFrame: number, color: string) => {
  const active = Math.max(0, frame - startFrame - CHIP_ENTRY_FRAMES);
  const y = active > 0 ? Math.sin(active / 18) * 2.5 : 0;
  const glow = active > 0 ? 0.45 + Math.sin(active / 22) * 0.18 : 0.22;

  return {
    transform: `translateY(${y}px)`,
    boxShadow: `0 0 ${18 + glow * 18}px color-mix(in srgb, ${color} 33%, transparent)`,
  };
};

const CHECKBOX_COLORS = {purple: "#8B5CF6", blue: "#0A84FF", gold: "#FFD166", white: "#F8FAFC", green: "#36D399", red: "#FF6B6B"} as const;
const checkboxColorKeys = Object.keys(CHECKBOX_COLORS) as Array<keyof typeof CHECKBOX_COLORS>;
const resolveCheckboxColor = (cue: JasonWuCue, fallback: keyof typeof CHECKBOX_COLORS = "blue") => {
  const requested = typeof cue.effectProps?.boxColor === "string" ? cue.effectProps.boxColor : "auto";
  if (requested in CHECKBOX_COLORS) return CHECKBOX_COLORS[requested as keyof typeof CHECKBOX_COLORS];
  const key = [cue.id, cue.layout, cue.start].join(":");
  const hash = [...key].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 0);
  return CHECKBOX_COLORS[checkboxColorKeys[hash % checkboxColorKeys.length] ?? fallback];
};

const Subtitle: React.FC<{cue: JasonWuCue; transcript?: JasonWuTranscriptCue; settings?: VideoProject["globalSettings"]; textRole?: CommercialTextRole}> = ({
  cue,
  transcript,
  settings,
  textRole,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const caption = transcript ?? cue.caption;
  const subtitleSettings = mergeGlobalSettings(settings);
  const startFrame = Math.round((transcript?.start ?? cue.start) * fps);
  const endFrame = Math.round((transcript?.end ?? cue.end) * fps);
  const fadeFrames = Math.max(1, Math.min(8, Math.floor((endFrame - startFrame) / 3)));

  return (
    <div
      data-text-role={textRole}
      style={{
        position: "absolute",
        left: "50%",
        width: "80%",
        bottom: subtitleSettings.subtitles.bottomOffset,
        padding: "14px 28px 16px",
        minHeight: 116,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(8px)",
        opacity: interpolate(
          frame,
          [startFrame - 3, startFrame + fadeFrames, endFrame - fadeFrames, endFrame],
          [0, 1, 1, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: easeOut,
          },
        ),
        transform: `translateX(-50%) translateY(${interpolate(frame, [startFrame, startFrame + 10], [8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        })}px)`,
      }}
    >
      <div
        style={{
          color: COLORS.white,
          fontSize: subtitleSettings.subtitles.fontSizeZh,
          lineHeight: `${Math.round(subtitleSettings.subtitles.fontSizeZh * 1.2)}px`,
          fontWeight: 900,
          textAlign: "center",
          textShadow: "0 2px 6px rgba(0,0,0,0.8)",
          WebkitTextStroke: subtitleSettings.theme.autoContrastStroke ? "1px rgba(0,0,0,0.85)" : "none",
          paintOrder: "stroke fill",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        <HighlightedText text={caption.zh} highlightColor={subtitleSettings.subtitles.highlightColor} />
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.92)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          fontSize: subtitleSettings.subtitles.fontSizeEn,
          lineHeight: `${Math.round(subtitleSettings.subtitles.fontSizeEn * 1.3)}px`,
          fontWeight: 600,
          textAlign: "center",
          textShadow: "0 2px 6px rgba(0,0,0,0.8)",
          WebkitTextStroke: subtitleSettings.theme.autoContrastStroke ? "1px rgba(0,0,0,0.85)" : "none",
          paintOrder: "stroke fill",
        }}
      >
        {caption.en}
      </div>
    </div>
  );
};

 const PortraitDisc: React.FC<{person: JasonWuPerson; size: number}> = ({
  person,
  size,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background:
        person.tone === "primary"
          ? "linear-gradient(145deg, #d8e8f8, #424b57)"
          : "linear-gradient(145deg, #a5a9ae, #272b31)",
      border: `3px solid ${person.tone === "primary" ? COLORS.blue : "rgba(255,255,255,0.38)"}`,
      boxShadow:
        person.tone === "primary"
          ? "0 0 30px rgba(10,132,255,0.64)"
          : "0 0 18px rgba(0,0,0,0.58)",
      overflow: "hidden",
      position: "relative",
      opacity: person.tone === "primary" ? 1 : 0.56,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "28%",
        top: "18%",
        width: "44%",
        height: "44%",
        borderRadius: "50%",
        background: "rgba(18,22,28,0.76)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "18%",
        bottom: "-8%",
        width: "64%",
        height: "46%",
        borderRadius: "48% 48% 0 0",
        background: "rgba(18,22,28,0.82)",
      }}
    />
  </div>
);

export const PersonRankLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const people = cue.people ?? [];
  const startFrame = Math.round(cue.start * fps) + 10;

  return (
    <div
      style={{
        position: "absolute",
        left: 76,
        top: 185,
        width: 540,
        ...entryStyle(frame, startFrame, -26),
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 42}}>
        {people[0] ? <PortraitDisc person={people[0]} size={214} /> : null}
        <div>
          <div style={{fontSize: 32, fontWeight: 950, color: COLORS.white}}>
            {people[0]?.name}
          </div>
          <div style={{fontSize: 28, fontWeight: 900, color: COLORS.white}}>
            {people[0]?.role}
          </div>
          <div
            style={{
              marginTop: 10,
              color: COLORS.blue,
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 900,
              letterSpacing: 2.8,
            }}
          >
            {people[0]?.meta}
          </div>
        </div>
      </div>
      <div style={{display: "flex", alignItems: "center", gap: 22, marginTop: 70}}>
        {people[1] ? <PortraitDisc person={people[1]} size={72} /> : null}
        <div style={{fontSize: 31, color: COLORS.dim}}>→</div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            color: COLORS.white,
            fontWeight: 950,
          }}
        >
          <span style={{fontSize: 34}}>NO.</span>
          <span style={{fontSize: 88, color: COLORS.blue, lineHeight: "84px"}}>
            <AnimatedNumber value="8" startFrame={startFrame + 24} />
          </span>
          <span style={{fontSize: 34}}>任 CEO</span>
        </div>
      </div>
      <div style={{marginTop: 20, color: COLORS.dim, fontSize: 18, fontWeight: 800}}>
        {people[1]?.meta}
      </div>
    </div>
  );
};

const StepPill: React.FC<{step: JasonWuStep; delay: number; compact?: boolean}> = ({step, delay, compact = false}) => {
  const frame = useCurrentFrame();
  const color = step.tone === "gold" ? COLORS.gold : COLORS.blue;
  const activeMotion = step.active ? floatingGlow(frame, delay, color) : {};
  const shimmerX = interpolate(frame, [delay + CHIP_ENTRY_FRAMES, delay + CHIP_ENTRY_FRAMES + 96], [-145, 690], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  return (
    <div
      style={{
        position: "relative",
        width: compact ? 430 : 625,
        minHeight: compact ? 58 : 64,
        padding: compact ? "10px 14px" : "12px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderRadius: 10,
        overflow: "hidden",
        background: step.active ? COLORS.panelDeep : "rgba(3, 5, 10, 0.4)",
        border: `1px solid ${step.active ? color : "rgba(255,255,255,0.18)"}`,
        boxShadow: step.active ? `0 0 18px color-mix(in srgb, ${color} 33%, transparent)` : "none",
        opacity: interpolate(frame, [delay, delay + CHIP_ENTRY_FRAMES], [0, step.active ? 1 : 0.42], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        }),
        translate: `${interpolate(frame, [delay, delay + CHIP_ENTRY_FRAMES], [-22, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        })}px 0px`,
        ...activeMotion,
      }}
    >
      {step.active ? (
        <div
          style={{
            position: "absolute",
            left: shimmerX,
            top: -30,
            width: 86,
            height: 132,
            rotate: "18deg",
            background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${color} 25%, transparent), rgba(255,255,255,0.24), transparent)`,
          }}
        />
      ) : null}
      <div
        style={{
            width: compact ? 32 : 36,
            height: compact ? 32 : 36,
          borderRadius: "50%",
          background: step.active ? color : "rgba(255,255,255,0.08)",
          color: step.active ? "#071019" : COLORS.dim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 950,
        }}
      >
        {step.index}
      </div>
      <div style={{flex: 1}}>
        <div style={{color: COLORS.white, fontSize: compact ? 20 : 23, fontWeight: 950}}>
          <AnimatedNumericText text={step.title} startFrame={delay + 8} />
        </div>
        <div
          style={{
            color,
            fontSize: compact ? 11 : 12,
            fontWeight: 900,
            letterSpacing: 3,
            marginTop: 2,
          }}
        >
          <AnimatedNumericText text={step.subtitle} startFrame={delay + 10} color={color} />
        </div>
      </div>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          boxShadow: step.active ? `0 0 18px ${color}` : "none",
        }}
      />
    </div>
  );
};

const cueLines = (cue: JasonWuCue, count: number, fallback: string[] = ["核心信息", "关键路径", "下一步"]): string[] => {
  const stepLines = (cue.steps ?? []).map((step) => step.title || step.subtitle).filter(Boolean);
  const values = [...stepLines, cue.section.subtitle, cue.caption.zh, ...fallback].map((value) => String(value ?? "").trim()).filter(Boolean);
  return Array.from(new Set(values)).slice(0, count);
};

export const EventTimelineLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps) + 10;
  const majorLabel = String(cue.metric?.value ?? Math.max(1, (cue.steps ?? []).length || 3));
  const minorLabel = cue.section.subtitle;
  const rightLabel = cue.section.eyebrow;
  const leftLabel = "TIMELINE";
  const pop = spring({
    frame: frame - startFrame,
    fps,
    config: {damping: 18, stiffness: 120, mass: 0.7},
    durationInFrames: 18,
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 76,
          top: 205,
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: interpolate(frame, [startFrame, startFrame + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: easeOut,
          }),
          scale: interpolate(pop, [0, 1], [0.94, 1], {output: "perceptual-scale"}),
        }}
      >
        <div style={{width: 76, height: 76, borderRadius: 18, border: `2px solid ${COLORS.blue}`, color: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 950}}>01</div>
          <div style={{fontSize: 104, lineHeight: "100px", fontWeight: 950, color: COLORS.white}}>
          <AnimatedNumber value={majorLabel} startFrame={startFrame + 8} />
        </div>
        {true ? (
          <div
            style={{
              color: COLORS.blue,
              fontSize: 28,
              lineHeight: "34px",
              fontWeight: 950,
              letterSpacing: 4,
            }}
          >
            SHOCKS
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: 76,
          top: 405,
          width: 620,
          ...entryStyle(frame, startFrame + 6, -20),
        }}
      >
        <div style={{color: COLORS.dim, fontSize: 22, fontWeight: 850}}>
          {minorLabel} <span style={{color: COLORS.blue, fontSize: 56, fontWeight: 950}}><AnimatedNumber value={majorLabel} startFrame={startFrame + 16} /></span> 项
        </div>
        <div style={{position: "relative", height: 58, marginTop: 18}}>
          <div style={{position: "absolute", left: 0, right: 0, top: 24, height: 3, background: "rgba(255,255,255,0.3)"}} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((point) => (
            <div
              key={point}
              style={{
                position: "absolute",
                left: point * 78,
                top: point === 7 ? 14 : 19,
                width: point === 7 ? 24 : 13,
                height: point === 7 ? 24 : 13,
                borderRadius: "50%",
                background: point === 7 ? COLORS.blue : "rgba(255,255,255,0.82)",
                boxShadow: point === 7 ? "0 0 18px rgba(10,132,255,0.9)" : "none",
              }}
            />
          ))}
        </div>
        <div style={{display: "flex", justifyContent: "space-between", color: COLORS.gold, fontSize: 18, fontWeight: 900}}>
          <span>{leftLabel}</span>
          <span style={{color: COLORS.blue}}>{rightLabel}</span>
        </div>
      </div>
      <MediaCard />
      <ProductList steps={cue.steps} />
    </>
  );
};

const MediaCard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        right: 282,
        top: 125,
        width: 445,
        height: 250,
        borderRadius: 17,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 14px 42px rgba(0,0,0,0.48)",
        background:
          "radial-gradient(circle at 42% 36%, rgba(255,255,255,0.76), transparent 8%), linear-gradient(135deg, #8a9aa4, #27374a 52%, #111821)",
        ...entryStyle(frame, 270, 24),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, transparent 42%, rgba(10,132,255,0.38) 43%, transparent 46%), linear-gradient(20deg, rgba(255,255,255,0.18), transparent 45%)",
        }}
      />
    </div>
  );
};

const ProductList: React.FC<{steps?: JasonWuStep[]}> = ({steps}) => {
  const frame = useCurrentFrame();
  const items =
    steps?.map((step) => ({
      title: step.title,
      subtitle: step.subtitle,
    })) ?? [
      {title: "iPhone 18 Pro", subtitle: "A20 PRO · 2NM"},
      {title: "iPhone 18 Pro Max", subtitle: "A20 PRO · 2NM"},
      {title: "折叠 iPhone", subtitle: "A20 PRO · 2NM"},
    ];

  return (
    <div style={{position: "absolute", right: 285, top: 430, ...entryStyle(frame, 292, 26)}}>
      {items.map((item, index) => (
        <div
          key={item.title}
          style={{
            width: 360,
            padding: "12px 16px",
            marginBottom: 10,
            borderRadius: 8,
            background: index === 2 ? "rgba(4,8,14,0.32)" : COLORS.panel,
            border: `1px solid ${index === 2 ? "rgba(10,132,255,0.22)" : "rgba(10,132,255,0.62)"}`,
            color: index === 2 ? "rgba(255,255,255,0.45)" : COLORS.white,
            fontSize: 22,
            fontWeight: 950,
            boxShadow: index === 2 ? "none" : "0 0 16px rgba(10,132,255,0.22)",
          }}
        >
          {item.title}
          <div style={{color: COLORS.blue, fontSize: 10, letterSpacing: 2.2, marginTop: 2}}>
            {item.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ValueVerdictLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps) + 8;
  const props = cue.effectProps ?? {};
  const metric = cue.metric;
  const title = String(props.headline ?? cue.section.subtitle ?? "关键结论");
  const supporting = String(props.copy ?? cue.caption.zh ?? "");
  const metricValue = props.metricValue ?? metric?.value;
  const metricLabel = String(props.metricLabel ?? metric?.label ?? cue.section.eyebrow ?? "KEY SIGNAL");
  const metricUnit = String(props.metricUnit ?? metric?.suffix ?? "");
  const hasMetric = metricValue !== undefined && metricValue !== null && String(metricValue).trim() !== "";

  return (
    <div
      style={{
        position: "absolute",
        left: 86,
        top: 250,
        width: hasMetric ? 760 : 620,
        padding: "26px 30px 24px",
        borderRadius: 14,
        color: COLORS.white,
        background: "rgba(5,12,21,0.76)",
        border: "1px solid rgba(10,132,255,0.68)",
        boxShadow: "0 12px 34px rgba(0,0,0,0.32), 0 0 26px rgba(10,132,255,0.18)",
        ...entryStyle(frame, startFrame, -30),
      }}
    >
      <div style={{color: COLORS.blue, fontSize: 17, fontWeight: 950, letterSpacing: 4}}>VALUE VERDICT</div>
      <div style={{marginTop: 10, maxWidth: hasMetric ? 430 : 560, fontSize: 42, lineHeight: "52px", fontWeight: 950}}>{title}</div>
      {supporting ? <div style={{marginTop: 12, maxWidth: hasMetric ? 430 : 560, color: "rgba(255,255,255,0.78)", fontSize: 25, lineHeight: "34px", fontWeight: 750}}>{supporting}</div> : null}
      {hasMetric ? (
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 24,
            minWidth: 210,
            padding: "16px 18px",
            borderRadius: 12,
            background: "rgba(10,132,255,0.14)",
            border: "1px solid rgba(10,132,255,0.56)",
            textAlign: "right",
            opacity: interpolate(frame, [startFrame + 12, startFrame + 28], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut}),
            scale: interpolate(frame, [startFrame + 12, startFrame + 28], [0.9, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut, output: "perceptual-scale"}),
          }}
        >
          <div style={{fontSize: 14, fontWeight: 950, letterSpacing: 2, color: COLORS.blue}}>{metricLabel}</div>
          <div style={{marginTop: 2, fontSize: 52, lineHeight: "58px", fontWeight: 950}}><AnimatedNumber value={String(metricValue)} startFrame={startFrame + 20} /></div>
          {metricUnit ? <div style={{fontSize: 21, fontWeight: 900, color: "rgba(255,255,255,0.8)"}}>{metricUnit}</div> : null}
        </div>
      ) : null}
    </div>
  );
};

const GlowLineChart: React.FC<{progress: number}> = ({progress}) => {
  const points = [
    [40, 240],
    [180, 224],
    [320, 188],
    [470, 170],
    [630, 108],
    [780, 82],
    [920, 44],
  ];
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ");
  const visibleLength = interpolate(progress, [0, 1], [980, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg
      viewBox="0 0 980 300"
      style={{
        position: "absolute",
        left: 470,
        top: 145,
        width: 980,
        height: 300,
        opacity: 0.68,
        filter: "drop-shadow(0 0 12px rgba(10,132,255,0.9))",
      }}
    >
      {[0, 1, 2, 3].map((line) => (
        <line
          key={line}
          x1="30"
          x2="950"
          y1={70 + line * 56}
          y2={70 + line * 56}
          stroke="rgba(255,255,255,0.11)"
          strokeWidth="2"
        />
      ))}
      <path d={path} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="10" strokeLinecap="round" />
      <path
        d={path}
        fill="none"
        stroke={COLORS.blue}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="980"
        strokeDashoffset={visibleLength}
      />
      {points.map(([x, y], index) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={index === points.length - 1 ? 11 : 7}
          fill={index === points.length - 1 ? COLORS.gold : COLORS.blue}
        />
      ))}
    </svg>
  );
};

const TimelineSlider: React.FC<{progress: number}> = ({progress}) => (
  <div
    style={{
      position: "absolute",
      left: 160,
      right: 160,
      bottom: 204,
      height: 62,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 27,
        height: 4,
        borderRadius: 99,
        background: "rgba(255,255,255,0.22)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 27,
        height: 4,
        width: `${progress * 100}%`,
        borderRadius: 99,
        background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.blue})`,
        boxShadow: "0 0 20px rgba(10,132,255,0.8)",
      }}
    />
    {[2011, 2014, 2017, 2020, 2023, 2026].map((year, index) => (
      <div
        key={year}
        style={{
          position: "absolute",
          left: `${(index / 5) * 100}%`,
          top: 4,
          translate: "-50% 0",
          color: index === 5 ? COLORS.blue : COLORS.dim,
          fontSize: 18,
          fontWeight: 900,
        }}
      >
        {year}
      </div>
    ))}
  </div>
);

const StatBlock: React.FC<{
  label: string;
  from: number;
  to: number;
  prefix?: string;
  suffix: string;
  startFrame: number;
  endFrame: number;
  color: string;
}> = ({label, from, to, prefix, suffix, startFrame, endFrame, color}) => (
  <div
    style={{
      minWidth: 430,
      padding: "20px 24px",
      borderRadius: 12,
      background: "rgba(3,7,13,0.68)",
      border: `1px solid ${color}`,
      boxShadow: `0 0 30px color-mix(in srgb, ${color} 33%, transparent)`,
    }}
  >
    <div style={{color: COLORS.dim, fontSize: 18, fontWeight: 900, letterSpacing: 3}}>{label}</div>
    <div style={{color: COLORS.white, fontSize: 74, lineHeight: "82px", fontWeight: 950}}>
      <RollingNumber from={from} to={to} startFrame={startFrame} endFrame={endFrame} prefix={prefix} suffix={suffix} />
    </div>
  </div>
);

export const CapitalDashboardLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps);
  const progress = sceneProgress(frame, cue, fps);

  return (
    <>
      <GlowLineChart progress={progress} />
      <div style={{position: "absolute", left: 76, top: 190, display: "flex", alignItems: "center", gap: 24, ...entryStyle(frame, startFrame + 10, -26)}}>
        <PortraitDisc person={cue.people?.[1] ?? {name: cue.section.subtitle.slice(0, 6) || "人物 A", role: cue.section.eyebrow || "SOURCE", meta: "", tone: "muted"}} size={132} />
        <div style={{fontSize: 46, color: COLORS.dim, fontWeight: 950}}>→</div>
        <PortraitDisc person={cue.people?.[0] ?? {name: cue.caption.zh.slice(0, 6) || "人物 B", role: cue.section.eyebrow || "TARGET", meta: "", tone: "primary"}} size={188} />
        <div>
          <div style={{color: COLORS.white, fontSize: 30, fontWeight: 950}}>第 <AnimatedNumber value="7" startFrame={startFrame + 30} /> 任掌门人</div>
          <div style={{color: COLORS.blue, fontSize: 14, fontWeight: 900, letterSpacing: 3, marginTop: 8}}>CEO SUCCESSION · 2011 TO 2026</div>
        </div>
      </div>
      <div style={{position: "absolute", left: 535, top: 470, display: "flex", gap: 24, ...entryStyle(frame, startFrame + 28, 0)}}>
        <StatBlock label="MARKET CAP" from={350} to={4600} prefix="$" suffix="B" startFrame={startFrame + 36} endFrame={startFrame + 180} color={COLORS.blue} />
        <StatBlock label="ANNUAL REVENUE" from={108} to={416} prefix="$" suffix="B" startFrame={startFrame + 56} endFrame={startFrame + 190} color={COLORS.gold} />
      </div>
      <TimelineSlider progress={progress} />
    </>
  );
};

const DonutGauge: React.FC<{label: string; value: number; color: string; delay: number}> = ({
  label,
  value,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [delay, delay + 48], [0, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const dash = 2 * Math.PI * 74;

  return (
    <div style={{position: "relative", width: 230, height: 230}}>
      <svg viewBox="0 0 200 200" style={{width: 230, height: 230, rotate: "-90deg"}}>
        <circle cx="100" cy="100" r="74" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="18" />
        <circle
          cx="100"
          cy="100"
          r="74"
          fill="none"
          stroke={color}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={dash * (1 - pct / 100)}
        />
      </svg>
      <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
        <div style={{color: COLORS.white, fontSize: 47, fontWeight: 950}}><RollingNumber from={0} to={value} startFrame={delay} endFrame={delay + 48} suffix="%" /></div>
        <div style={{color, fontSize: 13, fontWeight: 900, letterSpacing: 2.8}}>{label}</div>
      </div>
    </div>
  );
};

export const CookMachineLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps) + 8;
  const services = interpolate(frame, [startFrame + 66, startFrame + 150], [8, 25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <>
      <div style={{position: "absolute", left: 76, top: 205, display: "flex", gap: 40, ...entryStyle(frame, startFrame, -22)}}>
        <DonutGauge label="SHIPMENT SHARE" value={20} color={COLORS.blue} delay={startFrame + 18} />
        <DonutGauge label="OPERATING PROFIT" value={85} color={COLORS.gold} delay={startFrame + 44} />
      </div>
      <div style={{position: "absolute", left: 76, top: 510, width: 610, ...entryStyle(frame, startFrame + 40, -22)}}>
        <div style={{color: COLORS.dim, fontSize: 20, fontWeight: 900}}>SERVICES SHARE</div>
        <div style={{height: 26, marginTop: 12, borderRadius: 99, background: "rgba(255,255,255,0.13)", overflow: "hidden"}}>
          <div style={{width: `${services * 3}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.gold})`, boxShadow: "0 0 18px rgba(255,209,102,0.7)"}} />
        </div>
        <div style={{color: COLORS.white, fontSize: 52, fontWeight: 950, marginTop: 8}}>
          <RollingNumber from={8} to={25} startFrame={startFrame + 66} endFrame={startFrame + 150} suffix="%" />
        </div>
      </div>
      <div style={{position: "absolute", right: 220, top: 214, display: "flex", flexDirection: "column", gap: 14}}>
        {(cue.steps ?? []).map((step, index) => (
          <StepPill key={step.index} step={step} delay={startFrame + 20 + index * CHIP_STAGGER_FRAMES} />
        ))}
      </div>
    </>
  );
};

export const EngineeringReturnLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps) + 8;
  const open = interpolate(frame, [startFrame + 25, startFrame + 75], [72, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const typed = Math.floor(interpolate(frame, [startFrame + 92, startFrame + 170], [0, 55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  const spec = "PORTS: MagSafe / HDMI / SDXC  ·  TOLERANCE: 0.01mm";

  return (
    <>
      <div style={{position: "absolute", left: 110, top: 245, width: 760, height: 360, perspective: 900, ...entryStyle(frame, startFrame, -24)}}>
        <div style={{position: "absolute", left: 160, top: 110, width: 460, height: 280, borderRadius: 16, background: "linear-gradient(145deg, #aeb8c3, #263343)", transform: `rotateX(${open}deg)`, transformOrigin: "bottom", border: "2px solid rgba(255,255,255,0.35)", boxShadow: "0 0 40px rgba(10,132,255,0.36)"}}>
          <div style={{position: "absolute", inset: 20, borderRadius: 10, background: "radial-gradient(circle at 45% 40%, rgba(10,132,255,0.3), transparent 34%), #07111f"}} />
        </div>
        <div style={{position: "absolute", left: 95, top: 365, width: 600, height: 46, borderRadius: "0 0 24px 24px", background: "linear-gradient(180deg, #d7dde3, #606b77)", transform: "skewX(-16deg)", boxShadow: "0 18px 32px rgba(0,0,0,0.48)"}} />
        {[0, 1, 2].map((port) => (
          <div key={port} style={{position: "absolute", left: 188 + port * 68, top: 385, width: 42, height: 8, borderRadius: 4, background: COLORS.blue, boxShadow: "0 0 16px rgba(10,132,255,0.9)"}} />
        ))}
      </div>
      <div style={{position: "absolute", right: 230, top: 210, display: "flex", flexDirection: "column", gap: 14}}>
        {(cue.steps ?? []).map((step, index) => (
          <StepPill key={step.index} step={step} delay={startFrame + 38 + index * CHIP_STAGGER_FRAMES} />
        ))}
      </div>
      <div style={{position: "absolute", left: 170, top: 620, width: 890, padding: "15px 20px", background: "rgba(2,7,14,0.76)", border: "1px solid rgba(54,211,153,0.5)", borderRadius: 10, color: "#36D399", fontSize: 24, fontWeight: 900, letterSpacing: 1.2, boxShadow: "0 0 24px rgba(54,211,153,0.2)"}}>
        {spec.slice(0, typed)}
        <span style={{opacity: Math.sin(frame / 6) > 0 ? 1 : 0.2}}>▌</span>
      </div>
    </>
  );
};

const RadarChart: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [delay, delay + 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const pts = [
    [260, 85 - 44 * grow],
    [407 + 40 * grow, 305],
    [113 - 36 * grow, 305],
  ];
  const poly = pts.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg viewBox="0 0 520 390" style={{width: 520, height: 390, filter: "drop-shadow(0 0 14px rgba(10,132,255,0.75))"}}>
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={`260,${195 - 140 * scale} ${260 + 122 * scale},${195 + 92 * scale} ${260 - 122 * scale},${195 + 92 * scale}`}
          fill="none"
          stroke="rgba(255,255,255,0.17)"
          strokeWidth="2"
        />
      ))}
      <polygon points={poly} fill="rgba(10,132,255,0.28)" stroke={COLORS.blue} strokeWidth="4" />
      {["R&D 10%", "2.2B Devices", "<15ms Latency"].map((label, index) => (
        <text key={label} x={[218, 360, 36][index]} y={[35, 348, 348][index]} fill={index === 0 ? COLORS.gold : COLORS.white} fontSize="22" fontWeight="900">
          {label}
        </text>
      ))}
    </svg>
  );
};

export const MarketBattlefieldLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps) + 10;
  const arc = interpolate(frame, [startFrame + 50, startFrame + 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <>
      <div style={{position: "absolute", left: 90, top: 230, ...entryStyle(frame, startFrame, -24)}}>
        <RadarChart delay={startFrame + 20} />
      </div>
      <div style={{position: "absolute", right: 110, top: 150, width: 835, height: 470, borderRadius: 18, background: "rgba(3,8,15,0.55)", border: "1px solid rgba(10,132,255,0.28)", ...entryStyle(frame, startFrame + 18, 26)}}>
        <svg viewBox="0 0 760 420" style={{position: "absolute", inset: 0, width: 760, height: 420}}>
          <path d="M160 150 C310 40 480 80 610 205" stroke={COLORS.blue} strokeWidth="4" fill="none" strokeDasharray="540" strokeDashoffset={540 - arc * 540} />
          <path d="M160 150 C320 270 465 300 590 315" stroke={COLORS.gold} strokeWidth="4" fill="none" strokeDasharray="520" strokeDashoffset={520 - arc * 520} />
          {[
            [160, 150, "ORIGIN"],
            [610, 205, "PROCESS"],
            [590, 315, "SIGNAL"],
            [410, 110, "NEXT"],
          ].map(([x, y, label]) => (
            <g key={label as string}>
              <circle cx={x as number} cy={y as number} r="11" fill={label === "ORIGIN" ? COLORS.gold : COLORS.blue} />
              <text x={(x as number) + 18} y={(y as number) + 7} fill="white" fontSize="21" fontWeight="900">{label}</text>
            </g>
          ))}
        </svg>
        <div style={{position: "absolute", left: 44, top: 30, color: COLORS.white, fontSize: 23, fontWeight: 950}}>
          QUALITY HOLD: <span style={{color: COLORS.gold}}><AnimatedNumber value="98%" startFrame={startFrame + 80} /></span> · CAPACITY SHIFT: <span style={{color: COLORS.blue}}><AnimatedNumber value="25%" startFrame={startFrame + 96} /></span>
        </div>
      </div>
      <div style={{position: "absolute", right: 135, top: 480, display: "flex", flexDirection: "column", gap: 10}}>
        {(cue.steps ?? []).map((step, index) => (
          <StepPill key={step.index} step={step} delay={startFrame + 54 + index * CHIP_STAGGER_FRAMES} compact />
        ))}
      </div>
    </>
  );
};

export const FinaleKineticLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps) + 8;
  const slam = spring({frame: frame - startFrame - 30, fps, config: {damping: 14, stiffness: 170}});
  const shock = spring({frame: frame - startFrame - 96, fps, config: {damping: 9, stiffness: 220}});
  const sweep = interpolate(frame, [startFrame + 74, startFrame + 132], [-120, 780], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  const metric = cue.metric;

  return (
    <>
      <div style={{position: "absolute", left: 150, top: 230, ...entryStyle(frame, startFrame, -40), filter: "opacity(45%)"}}>
        <PortraitDisc person={cue.people?.[0] ?? {name: cue.section.subtitle.slice(0, 6) || "人物 A", role: cue.section.eyebrow || "SOURCE", meta: "", tone: "muted"}} size={260} />
      </div>
      <div style={{position: "absolute", right: 230, top: 190, ...entryStyle(frame, startFrame + 18, 40), filter: "opacity(92%)"}}>
        <PortraitDisc person={cue.people?.[1] ?? {name: cue.caption.zh.slice(0, 6) || "人物 B", role: cue.section.eyebrow || "TARGET", meta: "", tone: "primary"}} size={330} />
      </div>
      <div style={{position: "absolute", left: 390, right: 390, top: 205, color: COLORS.white, textAlign: "center", transform: `scale(${interpolate(slam + shock * 0.18, [0, 1.18], [0.62, 1.08], {output: "perceptual-scale"})}) rotate(${interpolate(shock, [0, 1], [-1.5, 0.5])}deg)`}}>
        <div style={{position: "relative", overflow: "hidden", fontSize: 92, lineHeight: "100px", fontWeight: 950, textShadow: "0 0 44px rgba(10,132,255,0.85), 0 0 16px rgba(255,255,255,0.45)"}}>
          {cue.section.eyebrow || "KEY MOMENT"}
          <div style={{position: "absolute", top: 0, bottom: 0, left: sweep, width: 96, rotate: "18deg", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.62), transparent)"}} />
        </div>
        <div style={{marginTop: 18, color: COLORS.gold, fontSize: 34, fontWeight: 950}}>{cue.section.subtitle}</div>
      </div>
      {metric ? (
        <div style={{position: "absolute", left: 610, top: 450, width: 330, padding: "22px 24px", borderRadius: 14, background: "rgba(4,9,16,0.72)", border: `1px solid ${COLORS.gold}`, color: COLORS.white, boxShadow: "0 0 34px rgba(255,209,102,0.34)"}}>
          <div style={{fontSize: 18, fontWeight: 900, color: COLORS.gold, letterSpacing: 3}}>{metric.label}</div>
          <div style={{fontSize: 64, fontWeight: 950}}><AnimatedNumber value={metric.value} startFrame={startFrame + 40} /></div>
          <div style={{fontSize: 24, fontWeight: 900}}>{metric.suffix}</div>
        </div>
      ) : null}
      <div style={{position: "absolute", left: 960, top: 455, display: "flex", gap: 14, ...entryStyle(frame, startFrame + 86, 24)}}>
        {[
          {label: "LIKES", value: "24800", color: COLORS.blue},
          {label: "COMMENTS", value: "1860", color: COLORS.gold},
        ].map((item, index) => (
          <div key={item.label} style={{width: 215, padding: "16px 18px", borderRadius: 14, background: "rgba(3,8,15,0.78)", border: `1px solid ${item.color}`, boxShadow: `0 0 30px ${item.color}44`, color: COLORS.white}}>
            <div style={{fontSize: 15, fontWeight: 950, color: item.color, letterSpacing: 3}}>{item.label}</div>
            <div style={{fontSize: 44, lineHeight: "52px", fontWeight: 950}}>
              <AnimatedNumber value={item.value} startFrame={startFrame + 96 + index * 14} />
            </div>
          </div>
        ))}
      </div>
      {cueLines(cue, 3).map((comment, index) => (
        <div
          key={comment}
          style={{
            position: "absolute",
            right: 140 + index * 72 + Math.sin((frame - startFrame) / 18 + index) * 8,
            bottom: 265 + index * 82,
            padding: "16px 22px",
            borderRadius: 12,
            color: COLORS.white,
            background: "rgba(3,8,15,0.86)",
            border: `1px solid ${index === 1 ? COLORS.gold : COLORS.blue}`,
            boxShadow: `0 0 26px ${index === 1 ? COLORS.gold : COLORS.blue}44`,
            fontSize: 27,
            fontWeight: 900,
            ...entryStyle(frame, startFrame + 64 + index * 18, 54),
          }}
        >
          {comment} · <span style={{color: index === 1 ? COLORS.gold : COLORS.blue}}><AnimatedNumber value={`${88 + index * 43}`} startFrame={startFrame + 80 + index * 18} /></span>
        </div>
      ))}
    </>
  );
};

export const CustomEffectLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps) + 8;
  const title = cue.section.subtitle;
  const titleStyle = {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: 950,
    lineHeight: "42px",
  };

  if (cue.layout === "reject-list") {
    const boxColor = resolveCheckboxColor(cue, "red");
    return (
      <div style={{position: "absolute", left: 92, top: 235, width: 680, ...entryStyle(frame, startFrame, -28)}}>
        <div style={{color: boxColor, fontSize: 18, fontWeight: 950, letterSpacing: 4}}>WHAT WENT WRONG</div>
        <div style={{...titleStyle, marginTop: 10}}>{title}</div>
        {cueLines(cue, 3, ["需要修正", "关键风险", "下一步"]).map((item, index) => (
          <div key={item} style={{display: "flex", alignItems: "center", gap: 18, marginTop: 22 + index * 4, opacity: interpolate(frame, [startFrame + 18 + index * 12, startFrame + 34 + index * 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
            <div style={{width: 38, height: 38, borderRadius: "50%", background: boxColor + "29", border: `2px solid ${boxColor}`, color: boxColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 950}}>×</div>
            <div style={{color: COLORS.white, fontSize: 28, fontWeight: 900}}>{item}</div>
          </div>
        ))}
      </div>
    );
  }

  if (cue.layout === "check-progress") {
    const boxColor = resolveCheckboxColor(cue, "green");
    const progress = interpolate(frame, [startFrame + 12, startFrame + 82], [0, 88], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut});
    return (
      <div style={{position: "absolute", left: 92, top: 250, width: 720, ...entryStyle(frame, startFrame, -28)}}>
        <div style={{color: boxColor, fontSize: 18, fontWeight: 950, letterSpacing: 4}}>RECOVERY TRACK</div>
        <div style={{...titleStyle, marginTop: 10}}>{title}</div>
        {cueLines(cue, 3, ["明确目标", "推进执行", "验证结果"]).map((item, index) => (
          <div key={item} style={{marginTop: 25}}>
            <div style={{display: "flex", justifyContent: "space-between", color: COLORS.white, fontSize: 24, fontWeight: 900}}><span>{item}</span><span style={{color: boxColor}}>✓</span></div>
            <div style={{height: 12, marginTop: 10, borderRadius: 99, background: "rgba(255,255,255,0.13)", overflow: "hidden"}}><div style={{height: "100%", width: `${Math.max(0, progress - index * 13)}%`, background: boxColor, boxShadow: `0 0 16px ${boxColor}88`}} /></div>
          </div>
        ))}
      </div>
    );
  }

  if (cue.layout === "diagonal-chips") {
    const props = cue.effectProps ?? {};
    const text = (key: string, fallback: string) => typeof props[key] === "string" ? String(props[key]).trim() : fallback;
    const eyebrow = text("eyebrow", "HARDWARE SIGNALS");
    const chips = [text("chip1", cueLines(cue, 3)[0] ?? "CORE SIGNAL"), text("chip2", cueLines(cue, 3)[1] ?? "KEY PATH"), text("chip3", cueLines(cue, 3)[2] ?? "NEXT STEP")];
    return (
      <div style={{position: "absolute", right: 138, top: 225, width: 650, ...entryStyle(frame, startFrame, 28)}}>
        <div style={{color: COLORS.blue, fontSize: 18, fontWeight: 950, letterSpacing: 4}}>{eyebrow}</div>
        {chips.map((item, index) => (
          <div key={item + "-" + index} style={{marginTop: 18, marginLeft: index * 46, padding: "18px 24px", rotate: index % 2 ? "-4deg" : "4deg", background: "rgba(3,8,15,0.82)", border: `1px solid ${index === 1 ? COLORS.gold : COLORS.blue}`, color: COLORS.white, fontSize: 28, fontWeight: 950, boxShadow: `0 0 24px ${index === 1 ? COLORS.gold : COLORS.blue}44`, ...entryStyle(frame, startFrame + 16 + index * 13, 70)}}>{item}</div>
        ))}
      </div>
    );
  }
  if (cue.layout === "floating-chips") {
    const props = cue.effectProps ?? {};
    const text = (key: string, fallback: string) => typeof props[key] === "string" ? String(props[key]).trim() : fallback;
    const eyebrow = text("eyebrow", "LIVE SIGNALS");
    const chips = [text("chip1", cueLines(cue, 3)[0] ?? "CORE SIGNAL"), text("chip2", cueLines(cue, 3)[1] ?? "KEY PATH"), text("chip3", cueLines(cue, 3)[2] ?? "NEXT STEP")];
    return (
      <div style={{position: "absolute", right: 110, top: 212, width: 670, ...entryStyle(frame, startFrame, 34)}}>
        <div style={{color: COLORS.blue, fontSize: 18, fontWeight: 950, letterSpacing: 4}}>{eyebrow}</div>
        {chips.map((item, index) => {
          const drift = Math.sin((frame - startFrame - index * 9) / 15) * (7 + index * 2);
          const color = index === 1 ? COLORS.gold : COLORS.blue;
          return <div key={item + "-" + index} style={{marginTop: 28 - index * 4, marginLeft: 46 + index * 74, width: 420 - index * 18, padding: "17px 22px", borderRadius: 12, background: "rgba(3,8,15,.72)", border: `1px solid ${color}`, color: COLORS.white, fontSize: 26, fontWeight: 950, boxShadow: `0 0 30px color-mix(in srgb, ${color} 45%, transparent)`, transform: "translateY(" + drift + "px)", ...entryStyle(frame, startFrame + 14 + index * 13, 74)}}>{item}</div>;
        })}
      </div>
    );
  }

  if (cue.layout === "bare-typography") {
    const scale = spring({frame: frame - startFrame, fps, config: {damping: 16, stiffness: 160}});
    return (
      <div style={{position: "absolute", left: 90, right: 130, top: 275, ...entryStyle(frame, startFrame, -20)}}>
        <div style={{fontSize: 17, color: COLORS.blue, fontWeight: 900, letterSpacing: 7}}>{cue.section.eyebrow || "KEY SIGNAL"}</div>
        <div style={{marginTop: 20, color: COLORS.white, fontSize: 66, lineHeight: "98px", fontWeight: 950, transform: `scale(${interpolate(scale, [0, 1], [0.9, 1], {output: "perceptual-scale"})})`, transformOrigin: "left top"}}>{title}</div>
        <div style={{marginTop: 20, color: COLORS.dim, fontSize: 29, fontWeight: 750, maxWidth: 980}}>{cue.caption.zh}</div>
      </div>
    );
  }

  if (cue.layout === "logo-wordmark") {
    const props = cue.effectProps ?? {};
    const text = (key: string, fallback: string) => typeof props[key] === "string" ? String(props[key]).trim() : fallback;
    const body = text("body", text("bodyText", text("effectText", cue.caption.zh || title)));
    const quote = text("highlightQuote", cue.section.eyebrow || "PROJECT SIGNAL");
    const mark = text("mark", "A").slice(0, 2);
    return (
      <div style={{position: "absolute", left: 100, top: 270, display: "flex", alignItems: "center", gap: 30, ...entryStyle(frame, startFrame, -28)}}>
        <div style={{width: 126, height: 126, borderRadius: 28, border: "2px solid #0A84FF", color: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 950}}>{mark}</div>
        <div style={{maxWidth: 820}}><div style={{color: COLORS.white, fontSize: 74, lineHeight: "86px", fontWeight: 950, letterSpacing: 2, overflowWrap: "break-word"}}>{body}</div>{quote ? <div style={{color: COLORS.gold, fontSize: 24, lineHeight: "32px", fontWeight: 950, letterSpacing: 6, marginTop: 7, overflowWrap: "break-word"}}>{quote}</div> : null}</div>
      </div>
    );
  }

  if (cue.layout === "ordered-sequence") {
    return (
      <div style={{position: "absolute", left: 95, top: 225, width: 790, ...entryStyle(frame, startFrame, -28)}}>
        <div style={{color: COLORS.gold, fontSize: 18, fontWeight: 950, letterSpacing: 4}}>SEQUENCE</div>
        {cueLines(cue, 4, ["发现问题", "形成判断", "推进执行", "验证结果"]).map((item, index) => (
          <div key={item} style={{display: "flex", alignItems: "center", gap: 22, marginTop: 20, opacity: interpolate(frame, [startFrame + index * 13, startFrame + 18 + index * 13], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
            <div style={{width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: index === 2 ? COLORS.gold : COLORS.blue, color: "#071019", fontSize: 20, fontWeight: 950}}>{`0${index + 1}`}</div>
            <div style={{color: COLORS.white, fontSize: 32, fontWeight: 950}}>{item}</div>
          </div>
        ))}
      </div>
    );
  }

  if (cue.layout === "org-chart") {
    return (
      <div style={{position: "absolute", left: 130, top: 205, width: 1050, ...entryStyle(frame, startFrame, -20)}}>
        <div style={{margin: "0 auto", width: 250, padding: "18px", textAlign: "center", border: `1px solid ${COLORS.blue}`, background: COLORS.panelDeep, color: COLORS.white, fontSize: 28, fontWeight: 950}}>CEO · INTEGRATOR</div>
        <div style={{height: 62, width: 2, background: COLORS.blue, margin: "0 auto"}} />
        <div style={{display: "flex", justifyContent: "space-between", borderTop: `2px solid ${COLORS.blue}`, paddingTop: 22}}>{cueLines(cue, 4, ["输入", "分析", "执行", "结果"]).map((item, index) => <div key={item} style={{width: 205, padding: "18px 14px", textAlign: "center", background: "rgba(3,8,15,0.72)", border: `1px solid ${index === 1 ? COLORS.gold : COLORS.blue}`, color: COLORS.white, fontSize: 22, fontWeight: 900, ...entryStyle(frame, startFrame + 18 + index * 10, 0)}}>{item}</div>)}</div>
      </div>
    );
  }

  if (cue.layout === "draw-line") {
    const draw = interpolate(frame, [startFrame + 10, startFrame + 100], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut});
    const props = cue.effectProps ?? {};
    const textProp = (key: string, fallback: string) => typeof props[key] === "string" ? String(props[key]).trim() : fallback;
    const bodyText = textProp("bodyText", textProp("body", textProp("effectText", textProp("text", title))));
    const subText = textProp("highlightQuote", textProp("annotation", textProp("subLabel", cue.caption.zh)));
    return (
      <div style={{position: "absolute", left: 90, top: 250, ...entryStyle(frame, startFrame, -20)}}>
        <div style={{...titleStyle}}>{bodyText}</div>
        <svg viewBox="0 0 920 330" style={{width: 920, height: 330, marginTop: 28}}><path d="M40 280 C170 245 260 260 365 190 S560 110 690 145 S800 88 880 52" fill="none" stroke={COLORS.blue} strokeWidth="8" strokeLinecap="round" strokeDasharray="1100" strokeDashoffset={1100 - draw * 1100} /><circle cx="880" cy="52" r="14" fill={COLORS.gold} /><line x1="40" y1="280" x2="880" y2="280" stroke="rgba(255,255,255,0.2)" strokeWidth="2" /></svg>
        <div style={{color: COLORS.blue, fontSize: 24, fontWeight: 950, letterSpacing: 3, overflowWrap: "break-word"}}>{subText}</div>
      </div>
    );
  }
  if (cue.layout === "progress-donut") {
    const pct = interpolate(frame, [startFrame + 8, startFrame + 60], [0, 76], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut});
    const dash = Math.PI * 2 * 96;
    return (
      <div style={{position: "absolute", left: 100, top: 230, display: "flex", alignItems: "center", gap: 70, ...entryStyle(frame, startFrame, -28)}}>
        <div style={{width: 300, height: 300, position: "relative"}}><svg viewBox="0 0 240 240" style={{width: 300, height: 300, rotate: "-90deg"}}><circle cx="120" cy="120" r="96" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="22" /><circle cx="120" cy="120" r="96" fill="none" stroke={COLORS.gold} strokeWidth="22" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - pct / 100)} /></svg><div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}><div style={{color: COLORS.white, fontSize: 68, fontWeight: 950}}><AnimatedNumber value="76%" startFrame={startFrame + 8} /></div><div style={{color: COLORS.gold, fontSize: 15, fontWeight: 950, letterSpacing: 3}}>PROGRESS</div></div></div>
        <div style={{width: 520}}><div style={{...titleStyle}}>{title}</div><div style={{marginTop: 26, color: COLORS.dim, fontSize: 26, fontWeight: 800}}>{cue.caption.zh}</div><div style={{height: 16, marginTop: 34, borderRadius: 99, background: "rgba(255,255,255,0.14)", overflow: "hidden"}}><div style={{width: `${pct}%`, height: "100%", background: COLORS.blue}} /></div></div>
      </div>
    );
  }

  if (cue.layout === "avatar-handoff") {
    return <LayoutEffectRenderer cue={cue} />;
  }


  if (cue.layout === "bull-bear") {
    return (
      <div style={{position: "absolute", left: 110, right: 110, top: 230, display: "flex", alignItems: "stretch", ...entryStyle(frame, startFrame, -22)}}>
        <div style={{flex: 1, padding: "28px 34px", color: COLORS.white, background: "rgba(10,132,255,0.14)", border: `1px solid ${COLORS.blue}`}}><div style={{color: COLORS.blue, fontSize: 20, fontWeight: 950, letterSpacing: 5}}>看多 BULL</div><div style={{fontSize: 38, fontWeight: 950, marginTop: 30}}>端侧 AI<br />新硬件形态</div></div>
        <div style={{width: 3, background: COLORS.white, boxShadow: "0 0 18px rgba(255,255,255,0.55)"}} />
        <div style={{flex: 1, padding: "28px 34px", color: COLORS.white, background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.72)"}}><div style={{color: "#ff8a8a", fontSize: 20, fontWeight: 950, letterSpacing: 5}}>看空 BEAR</div><div style={{fontSize: 38, fontWeight: 950, marginTop: 30}}>AI 起步太慢<br />体验仍待验证</div></div>
      </div>
    );
  }

  return (
    <div style={{position: "absolute", left: 110, right: 110, top: 250, textAlign: "center", ...entryStyle(frame, startFrame, 0)}}>
      <div style={{color: COLORS.blue, fontSize: 20, fontWeight: 950, letterSpacing: 6}}>VIEWPOINT</div>
      <div style={{marginTop: 26, color: COLORS.white, fontSize: 84, lineHeight: "96px", fontWeight: 950}}>{title}</div>
      <div style={{marginTop: 26, color: COLORS.gold, fontSize: 32, fontWeight: 900}}>{cue.caption.zh}</div>
    </div>
  );
};
export const V1NewEffectLayout: React.FC<{cue: JasonWuCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const enter = (delay = 0) => interpolate(frame, [start + delay, start + delay + 28], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut});
  const localPanel = "rgba(3, 8, 15, 0.64)";
  const title = cue.section.subtitle;
  const eyebrow = cue.section.eyebrow;

  if (cue.layout === "photo-wall") {
    return <div style={{position: "absolute", left: 78, top: 185, width: 1060, display: "flex", gap: 18}}>{["HARDWARE", "LEADERSHIP", "NEXT CEO"].map((item, index) => <div key={item} style={{width: 222, height: 300, padding: 20, background: localPanel, border: `1px solid ${index === 2 ? COLORS.gold : COLORS.blue}`, opacity: enter(index * 11), translate: `${interpolate(frame, [start + index * 11, start + 34 + index * 11], [0, 42 - index * 16], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px 0px`, rotate: `${(index - 1) * 3}deg`}}><div style={{width: 82, height: 82, borderRadius: "50%", background: index === 2 ? "rgba(255,209,102,.45)" : "rgba(10,132,255,.36)", border: "2px solid rgba(255,255,255,.55)"}} /><div style={{marginTop: 144, color: COLORS.white, fontSize: 24, fontWeight: 950}}>{item}</div><div style={{marginTop: 8, color: COLORS.dim, fontSize: 15, fontWeight: 800}}>BOARD REVIEW</div></div>)}<div style={{width: 355, padding: "42px 0 0 24px", color: COLORS.white}}><div style={{color: COLORS.gold, fontSize: 17, fontWeight: 900, letterSpacing: 4}}>SUCCESSION</div><div style={{marginTop: 14, fontSize: 52, lineHeight: "64px", fontWeight: 950}}>{title}</div></div></div>;
  }

  if (cue.layout === "product-explosion") {
    const props = cue.effectProps ?? {};
    const fallbackLabels = cueLines(cue, 4, ["iPhone", "iPad", "Mac", "AirPods"]);
    const labels = [1, 2, 3, 4].map((n, i) => typeof props["productTitle" + String(n)] === "string" ? String(props["productTitle" + String(n)]).trim() : fallbackLabels[i]).filter(Boolean).slice(0, 4);
    const centerLabel = typeof props.centerLabel === "string" ? props.centerLabel.trim() : "APPLE";
    const centerImage = typeof props.centerImage === "string" ? props.centerImage : "";
    const positions = [[130, 72], [790, 72], [130, 360], [790, 360]];
    return <div style={{position: "absolute", left: 108, top: 170, width: 1050, height: 520}}><div style={{position: "absolute", left: 378, top: 154, width: 294, height: 190, borderRadius: 30, background: "linear-gradient(145deg, rgba(255,255,255,.96), rgba(207,218,232,.78))", border: "1px solid rgba(255,255,255,.84)", boxShadow: "0 24px 60px rgba(0,0,0,.36), 0 0 42px rgba(10,132,255,.22)", display: "grid", placeItems: "center", overflow: "hidden", opacity: enter(8), scale: enter(8)}}>{centerImage ? <img src={centerImage} style={{width: "100%", height: "100%", objectFit: "contain", padding: 30, boxSizing: "border-box"}} /> : <div style={{color: "#101826", fontSize: 34, fontWeight: 950, letterSpacing: 2}}>{centerLabel}</div>}</div>{labels.map((label, index) => { const [left, top] = positions[index]; const image = typeof props["productImage" + String(index + 1)] === "string" ? String(props["productImage" + String(index + 1)]) : ""; return <div key={label} style={{position: "absolute", left, top, width: 160, height: 160, borderRadius: "50%", background: localPanel, border: `2px solid ${index % 2 ? COLORS.gold : COLORS.blue}`, boxShadow: "0 0 28px rgba(10,132,255,.36)", color: COLORS.white, overflow: "hidden", opacity: enter(18 + index * 9), scale: enter(18 + index * 9), display: "grid", placeItems: "center"}}>{image ? <img src={image} style={{width: "100%", height: "100%", objectFit: "cover"}} /> : <b style={{fontSize: 25, textAlign: "center"}}>{label}</b>}<span style={{position: "absolute", left: 12, right: 12, bottom: 11, padding: "5px 8px", borderRadius: 99, background: "rgba(0,0,0,.62)", fontSize: 15, fontWeight: 900, textAlign: "center"}}>{label}</span></div>; })}</div>;
  }

  if (cue.layout === "newspaper-swap") {
    return <div style={{position: "absolute", left: 100, top: 156, width: 980, height: 460}}>{["VISION PRO", "ON-DEVICE AI", "REAL EXPERIENCE"].map((headline, index) => <div key={headline} style={{position: "absolute", left: 70 + index * 94, top: 28 + index * 30, width: 580, padding: 30, background: "rgba(247,242,230,.93)", color: "#151a20", borderTop: `9px solid ${index === 2 ? "#e84b4b" : "#0a84ff"}`, opacity: index === 2 ? enter(34) : interpolate(frame, [start + index * 22, start + index * 22 + 26, start + index * 22 + 72, start + index * 22 + 98], [0, 1, 1, 0.26], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), translate: `${interpolate(frame, [start + index * 22, start + index * 22 + 28], [-170, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px 0px`, rotate: `${(index - 1) * 2}deg`}}><div style={{fontSize: 15, fontWeight: 900, letterSpacing: 4}}>THE PRODUCT PAPER</div><div style={{marginTop: 24, fontSize: 48, lineHeight: "55px", fontWeight: 950}}>{headline}</div><div style={{marginTop: 18, paddingTop: 15, borderTop: "1px solid #49515a", fontSize: 22, fontWeight: 800}}>{cue.caption.zh}</div></div>)}</div>;
  }

  if (cue.layout === "route-map") {
    const nodeLabels = cueLines(cue, 4, ["ORIGIN", "PROCESS", "RESULT", "NEXT"]);
    const nodes: Array<[string, number, number]> = nodeLabels.map((label, index) => [label, [80, 360, 650, 900][index], [190, 82, 190, 300][index]]);
    return <div style={{position: "absolute", left: 80, top: 170, width: 1080}}><div style={{color: COLORS.gold, fontSize: 17, fontWeight: 900, letterSpacing: 4}}>TRANSITION MAP</div><svg viewBox="0 0 1080 410" style={{width: 1080, height: 410}}><path d="M130 230 C260 330 302 120 410 132 S610 360 700 230 S870 190 950 340" fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="3" strokeDasharray="10 13" opacity={enter(12)} />{nodes.map(([label, x, y], index) => <g key={label} opacity={enter(16 + index * 9)}><circle cx={x} cy={y} r="50" fill={localPanel} stroke={index === 3 ? COLORS.gold : COLORS.blue} strokeWidth="3" /><text x={x} y={y + 6} fill="white" fontSize="17" fontWeight="900" textAnchor="middle">{label}</text></g>)}</svg><div style={{marginTop: -8, color: COLORS.white, fontSize: 52, fontWeight: 950}}>{title}</div></div>;
  }

  if (cue.layout === "data-flow") {
    const rows: Array<[string, string, number]> = cueLines(cue, 3, ["INEXTT", "PROCESS", "OUTPUT"]).map((name, index) => [name, [COLORS.blue, "#ff5864", COLORS.gold][index], [92, 194, 296][index]]);
    return <div style={{position: "absolute", left: 85, top: 190, width: 1080}}><div style={{color: COLORS.blue, fontSize: 17, fontWeight: 900, letterSpacing: 4}}>GLOBAL SIGNAL FLOW</div><div style={{position: "relative", height: 366}}>{rows.map(([name, color, top], index) => <div key={name} style={{position: "absolute", left: 15, top, width: 940, height: 60, opacity: enter(index * 10), display: "flex", alignItems: "center"}}><div style={{width: 130, color, fontSize: 27, fontWeight: 950}}>{name}</div><div style={{width: 570, height: 4, background: "rgba(255,255,255,.28)", overflow: "hidden"}}><div style={{width: `${interpolate(frame, [start + 18 + index * 10, start + 58 + index * 10], [0, 100], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%`, height: "100%", background: color}} /></div><div style={{marginLeft: 20, padding: "10px 16px", background: localPanel, border: `1px solid ${color}`, color: COLORS.white, fontWeight: 900}}>INEXTT</div></div>)}<div style={{position: "absolute", left: 780, top: 115, width: 190, height: 156, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(3,8,15,.72)", border: `2px solid ${COLORS.gold}`, color: COLORS.white, fontSize: 25, fontWeight: 950, opacity: enter(34)}}>AI<br />EXPERIENCE</div></div><div style={{color: COLORS.white, fontSize: 51, fontWeight: 950}}>{title}</div></div>;
  }

  if (cue.layout === "screen-recording") {
    return <div style={{position: "absolute", left: 118, top: 164, width: 930, padding: 14, background: "rgba(3,8,15,.7)", border: "1px solid rgba(255,255,255,.55)", opacity: enter()}}><div style={{height: 34, display: "flex", alignItems: "center", gap: 9}}><span style={{width: 11, height: 11, borderRadius: "50%", background: "#ff5a5f"}} /><span style={{width: 11, height: 11, borderRadius: "50%", background: COLORS.gold}} /><span style={{width: 11, height: 11, borderRadius: "50%", background: "#38e86b"}} /><span style={{marginLeft: "auto", color: "#ff5a5f", fontSize: 16, fontWeight: 900}}>REC 00:12</span></div><div style={{height: 270, padding: 30, background: "rgba(10,132,255,.12)", borderTop: "1px solid rgba(255,255,255,.25)"}}><div style={{color: COLORS.white, fontSize: 38, fontWeight: 950}}>{title}</div>{cueLines(cue, 3, ["INEXTT", "PROCESS", "OUTPUT"]).map((line, index) => <div key={line} style={{marginTop: 20, width: `${76 - index * 10}%`, height: 24, background: "rgba(255,255,255,.2)", opacity: enter(14 + index * 10)}}><div style={{width: `${interpolate(frame, [start + 20 + index * 10, start + 46 + index * 10], [0, 100], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%`, height: "100%", background: index === 1 ? COLORS.gold : COLORS.blue}} /></div>)}<div style={{position: "absolute", left: 720, top: 205, width: 28, height: 40, borderLeft: "3px solid white", borderTop: "3px solid white", rotate: "-23deg", opacity: enter(35)}} /></div><div style={{padding: "18px 16px 8px", color: COLORS.gold, fontSize: 33, fontWeight: 950}}>{title}</div></div>;
  }

  if (cue.layout === "zoom-statement") {
    return <div style={{position: "absolute", left: 80, right: 80, top: 210, textAlign: "center"}}><div style={{color: COLORS.gold, fontSize: 18, fontWeight: 900, letterSpacing: 6, opacity: enter()}}>{eyebrow}</div><div style={{marginTop: 34, color: COLORS.white, fontSize: 74, lineHeight: "89px", fontWeight: 950, textShadow: "0 6px 24px rgba(0,0,0,.64)", opacity: enter(6), scale: interpolate(frame, [start + 6, start + 54], [0.72, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut})}}>{title}</div><div style={{marginTop: 27, color: COLORS.white, fontSize: 29, fontWeight: 800, opacity: enter(28)}}>{cue.caption.zh}</div></div>;
  }

  if (cue.layout === "desktop-folders") {
    const folderLabels = cueLines(cue, 4, ["FOUNDATION", "PROCESS", "SIGNAL", "NEXT"]);
    const folders = folderLabels.map((name, index) => [name, [60, 300, 595, 790][index], [90, 230, 115, 280][index]]);
    return <div style={{position: "absolute", left: 92, top: 165, width: 1040, height: 470}}><div style={{color: COLORS.blue, fontSize: 17, fontWeight: 900, letterSpacing: 4}}>{cue.section.eyebrow || "PROJECT DESKTOP"}</div>{folders.map(([name, left, top], index) => <div key={name} style={{position: "absolute", left, top, width: 188, opacity: enter(10 + index * 10), translate: `0 ${interpolate(frame, [start + 10 + index * 10, start + 38 + index * 10], [55, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px`}}><div style={{width: 120, height: 84, background: index === 3 ? "rgba(255,209,102,.72)" : "rgba(10,132,255,.7)", clipPath: "polygon(0 16%, 36% 16%, 44% 0, 100% 0, 100% 100%, 0 100%)"}} /><div style={{marginTop: 10, color: COLORS.white, fontSize: 18, fontWeight: 900}}>{name}</div></div>)}<div style={{position: "absolute", left: 25, bottom: 0, width: 640, color: COLORS.white, fontSize: 54, lineHeight: "66px", fontWeight: 950}}>{title}</div></div>;
  }

  if (cue.layout === "time-rewind") {
    return <div style={{position: "absolute", left: 86, top: 174, width: 1070}}><div style={{color: COLORS.gold, fontSize: 17, fontWeight: 900, letterSpacing: 4}}>TIME REWIND</div><div style={{position: "relative", marginTop: 52, height: 220, borderTop: "3px solid rgba(255,255,255,.62)"}}>{["2026", "2021", "2011"].map((year, index) => <div key={year} style={{position: "absolute", left: 105 + index * 305, top: -45, opacity: enter(index * 15), textAlign: "center"}}><div style={{width: 22, height: 22, margin: "0 auto", borderRadius: "50%", background: index === 2 ? COLORS.gold : COLORS.blue}} /><div style={{marginTop: 25, color: COLORS.white, fontSize: 56, fontWeight: 950, translate: `${interpolate(frame, [start + index * 15, start + 44 + index * 15], [70, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px 0`}}>{year}</div><div style={{marginTop: 12, color: COLORS.dim, fontSize: 18, fontWeight: 850}}>CAPABILITY</div></div>)}<div style={{position: "absolute", right: 70, top: 134, color: COLORS.gold, fontSize: 24, fontWeight: 950, opacity: enter(45)}}>{"<<"} REWIND</div></div><div style={{color: COLORS.white, fontSize: 51, fontWeight: 950}}>{title}</div></div>;
  }

  if (cue.layout === "clipboard-note") {
    const props = cue.effectProps ?? {};
    const textProp = (key: string, fallback: string) => typeof props[key] === "string" ? String(props[key]).trim() : fallback;
    const body = textProp("body", textProp("bodyText", textProp("effectText", cue.caption.zh || title)));
    const subText = textProp("highlightQuote", textProp("subText", ""));
    const label = textProp("label", "PRODUCT NOTE");
    return <div style={{position: "absolute", left: 130, top: 164, width: 650, minHeight: 360, padding: "56px 50px 42px", background: "rgba(242,235,216,.94)", color: "#13202c", border: "2px solid rgba(255,255,255,.7)", rotate: "-3deg", opacity: enter()}}><div style={{position: "absolute", left: 242, top: -24, width: 165, height: 44, borderRadius: 7, background: "#53606d"}} /><div style={{fontSize: 17, fontWeight: 900, letterSpacing: 4}}>{label}</div><div style={{marginTop: 20, fontSize: 45, lineHeight: "56px", fontWeight: 950, overflowWrap: "break-word"}}>{body}</div>{subText ? <div style={{marginTop: 18, color: "rgba(19,32,44,.62)", fontSize: 24, lineHeight: "34px", fontWeight: 800, overflowWrap: "break-word"}}>{subText}</div> : null}</div>;
  }

  if (cue.layout === "closing-checklist") {
    const boxColor = resolveCheckboxColor(cue, "blue");
    return <div style={{position: "absolute", left: 96, top: 170, width: 760}}><div style={{color: COLORS.gold, fontSize: 17, fontWeight: 900, letterSpacing: 4}}>{cue.section.eyebrow || "FINAL REVIEW"}</div><div style={{marginTop: 18, color: COLORS.white, fontSize: 56, lineHeight: "68px", fontWeight: 950}}>{title}</div>{cueLines(cue, 4, ["核心价值", "用户体验", "执行能力", "下一步"]).map((item, index) => <div key={item} style={{marginTop: 24, display: "flex", alignItems: "center", opacity: enter(20 + index * 12), translate: `${interpolate(frame, [start + 20 + index * 12, start + 45 + index * 12], [-36, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px 0`}}><div style={{width: 35, height: 35, marginRight: 16, border: `2px solid ${boxColor}`, color: boxColor, textAlign: "center", fontSize: 27, lineHeight: "31px", fontWeight: 950}}>✓</div><div style={{color: COLORS.white, fontSize: 31, fontWeight: 900}}>{item}</div></div>)}</div>;
  }

  return <div style={{position: "absolute", left: 155, top: 186, width: 930, textAlign: "center"}}><div style={{position: "absolute", inset: -80, background: "radial-gradient(ellipse at center, rgba(0,0,0,.06), rgba(0,0,0,.58))", opacity: enter()}} /><div style={{position: "relative", color: COLORS.gold, fontSize: 19, fontWeight: 900, letterSpacing: 6, opacity: enter()}}>{cue.section.eyebrow || "KEY MOMENT"}</div><div style={{position: "relative", marginTop: 42, color: COLORS.white, fontSize: 76, lineHeight: "91px", fontWeight: 950, textShadow: "0 6px 24px rgba(0,0,0,.72)", opacity: enter(10), scale: interpolate(frame, [start + 10, start + 55], [.78, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut})}}>{title}</div><div style={{position: "relative", marginTop: 24, color: COLORS.white, fontSize: 30, fontWeight: 850, opacity: enter(30)}}>{cue.caption.zh}</div></div>;
};
const SceneModules: React.FC<{cue: JasonWuCue; showStandardHeader?: boolean}> = ({cue, showStandardHeader = true}) => <LayoutEffectRenderer cue={cue} showStandardHeader={showStandardHeader} />;

const EffectLayerStack: React.FC<{cue: JasonWuCue; beatIndex?: number}> = ({cue, beatIndex = 0}) => {
  const {fps} = useVideoConfig();
  const beatStartFrame = Math.round(cue.start * fps);
  const beatDuration = Math.max(1, Math.round((cue.end - cue.start) * fps));

  return <>
    {normalizeCueLayers(cue).map((layer) => {
      const scopedCue = layerCue(cue, layer);
      const faceAware = resolveFaceAwareLayerForRender(layer.layout, layer.commonProps, cue.faceZone, beatIndex, cue.sceneMode);
      const definition = getLayoutDefinition(faceAware.layout);
      const entranceDurationSeconds = getEntranceDurationSeconds(faceAware.layout, resolveContentItems(scopedCue, layer.effectProps, ["items", "steps", "units", "comments", "nodes", "years"]).length, resolveContentText(scopedCue, layer.effectProps, "text").length);
      const effectiveCue = {...scopedCue, layout: faceAware.layout, effectProps: {...(scopedCue.effectProps ?? {}), designTokens: faceAware.tokens, ...(definition.usesInternalMotionWrapper ? {__jcMotion: {commonProps: faceAware.commonProps, designTokens: faceAware.tokens, beatDuration: cue.end - cue.start, entranceDurationSeconds, textRole: layer.textRole, accent: layer.accent}} : {})}};
      const scene = <SceneModules cue={effectiveCue} showStandardHeader={false} />;
      return <Sequence key={layer.layerId} from={beatStartFrame} durationInFrames={beatDuration} layout="none">
        {definition.usesInternalMotionWrapper ? scene : <MotionWrapper commonProps={faceAware.commonProps} designTokens={faceAware.tokens} beatDuration={cue.end - cue.start} entranceDurationSeconds={entranceDurationSeconds} textRole={layer.textRole} accent={layer.accent}>{scene}</MotionWrapper>}
      </Sequence>;
    })}
  </>;
};
type JasonWuTemplateProps = {
  cues: JasonWuCue[];
  videoSrc: string;
  audioSrc?: string;
  loopVideoFrames?: number;
  transcriptCues?: JasonWuTranscriptCue[];
  globalSettings?: VideoProject["globalSettings"];
};

export const JasonWuTemplate: React.FC<JasonWuTemplateProps> = ({
  cues,
  audioSrc,
  videoSrc,
  loopVideoFrames,
  transcriptCues,
  globalSettings,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cue = activeCueAtFrame(cues, frame, fps);
  const activeLayer = activeLayerAtTime(cue, Math.max(0, frame / fps - cue.start));
  const activeLayerProps = activeLayer.effectProps ?? {};
  const sectionEyebrow = typeof activeLayer.category === "string" && activeLayer.category.trim() ? activeLayer.category : typeof activeLayerProps.eyebrow === "string" ? activeLayerProps.eyebrow : cue.section.eyebrow;
  const sectionSubtitle = typeof activeLayer.headline === "string" && activeLayer.headline.trim()
    ? activeLayer.headline
    : typeof activeLayerProps.headline === "string"
      ? activeLayerProps.headline
      : typeof activeLayerProps.title === "string"
        ? activeLayerProps.title
        : cue.section.subtitle;
  const activeHeaderCue = layerCue(cue, {
    ...activeLayer,
    category: sectionEyebrow,
    headline: sectionSubtitle,
  });
  const beatIndex = Math.max(0, cues.indexOf(cue));
  const activeFaceAware = resolveFaceAwareLayerForRender(activeLayer.layout, activeLayer.commonProps, cue.faceZone, beatIndex, cue.sceneMode);
  const effectiveHeaderCue = {
    ...activeHeaderCue,
    layout: activeFaceAware.layout,
    effectProps: {...(activeHeaderCue.effectProps ?? {}), accent: activeLayer.accent ?? "blue", designTokens: activeFaceAware.tokens},
  };
  const settings = mergeGlobalSettings(globalSettings);
  const transcript = transcriptCues ? activeTranscriptAtFrame(transcriptCues, frame, fps) : undefined;
  const video = (
    <OffthreadVideo
      src={staticFile(videoSrc)}
      volume={0}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: settings.background.blurRadius > 0 ? `blur(${settings.background.blurRadius}px)` : "none",
      }}
    />
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#03060B",
        fontFamily:
          "Inter, Noto Sans SC, Microsoft YaHei UI, Microsoft YaHei, PingFang SC, sans-serif",
        overflow: "hidden",
        ["--primary-accent" as string]: settings.theme.primaryAccent,
        ["--card-panel" as string]: settings.theme.cardStyle === "opaque" ? "rgba(3, 5, 10, 0.92)" : "rgba(3, 8, 15, 0.76)",
      } as React.CSSProperties}
    >
      {loopVideoFrames ? <Loop durationInFrames={loopVideoFrames}>{video}</Loop> : video}
      <AbsoluteFill style={{backgroundColor: `rgba(0, 0, 0, ${settings.background.dimOpacity})`, backdropFilter: `blur(${settings.background.blurRadius}px)`}} />
      {settings.background.vignette ? <AbsoluteFill style={{background: "radial-gradient(circle, transparent 60%, rgba(0,0,0,0.6) 100%)"}} /> : null}
      <LayoutEffectHeader key={activeLayer.layerId} cue={effectiveHeaderCue} />
      <EffectLayerStack cue={cue} beatIndex={beatIndex} />
      <Subtitle cue={cue} transcript={transcript} settings={settings} textRole={activeLayer.textRole} />
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
    </AbsoluteFill>
  );
};

export const JasonWuComposition: React.FC = () => (
  <JasonWuTemplate cues={jasonWuCues} videoSrc="zhuzigeceo.mp4" />
);

export const JasonWuTestComposition: React.FC = () => (
  <JasonWuTemplate
    cues={jasonWuTestCues}
    audioSrc="jasonwu-test-voice.mp3"
    videoSrc="test.mp4"
    loopVideoFrames={2714}
    transcriptCues={jasonWuTestTranscript}
  />
);

export const JasonWuLongComposition: React.FC = () => (
  <JasonWuTemplate
    cues={jasonWuLongCues}
    audioSrc="jasonwu-long-voice.mp3"
    videoSrc="test.mp4"
    loopVideoFrames={2714}
    transcriptCues={jasonWuLongTranscript}
  />
);

export const ZhuzigeFullComposition: React.FC = () => (
  <JasonWuTemplate
    cues={zhuzigeFullCues}
    audioSrc="zhuzigeceo-audio.wav"
    videoSrc="test.mp4"
    loopVideoFrames={2714}
    transcriptCues={zhuzigeFullTranscript}
  />
);
export const ZhuzigeTailDraftComposition: React.FC = () => (
  <JasonWuTemplate
    cues={applyZhuzigeTailDraft(zhuzigeFullCues)}
    audioSrc="zhuzigeceo-audio.wav"
    videoSrc="test.mp4"
    loopVideoFrames={2714}
    transcriptCues={applyZhuzigeTailSubtitleDraft(zhuzigeFullTranscript)}
  />
);















export const ZhuzigeEditorDraftComposition: React.FC = () => (
  <JasonWuTemplate
    cues={applyZhuzigeEditorDraft(zhuzigeFullCues)}
    audioSrc="zhuzigeceo-audio.wav"
    videoSrc="test.mp4"
    loopVideoFrames={2714}
    transcriptCues={applyZhuzigeSubtitleDraft(zhuzigeFullTranscript)}
  />
);





export const ProjectEditorComposition: React.FC<VideoProject> = (project) => (
  <JasonWuTemplate
    cues={projectToCues(project)}
    audioSrc={project.audioSrc}
    videoSrc={project.videoSrc}
    loopVideoFrames={project.loopVideoFrames}
    transcriptCues={projectToTranscript(project)}
    globalSettings={project.globalSettings ?? DEFAULT_GLOBAL_SETTINGS}
  />
);

export const DefaultProjectEditorComposition: React.FC = () => <ProjectEditorComposition {...defaultProject} />;
