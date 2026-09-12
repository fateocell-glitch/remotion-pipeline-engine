import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import beats from "./data/shousilang_beat_plan.json";
import segments from "./data/shousilang_segments_clean.json";

type Beat = {
  start: number;
  end: number;
  chapter: string;
  headline: string;
  surfaceMode: string;
  numericVisual: string | null;
};

type Segment = {
  start: number;
  end: number;
  text: string;
};

const typedBeats = beats as Beat[];
const typedSegments = segments as Segment[];

const COLORS = {
  yellow: "#FFE600",
  red: "#FF1744",
  purple: "#7F00FF",
  white: "#FFFFFF",
  cyan: "#00D9FF",
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const chips: Record<string, string[]> = {
  "01 排队神话": ["QUEUE", "BUZZ", "TRAFFIC"],
  "02 中端缺口": ["MID-MARKET", "GAP", "DEMAND"],
  "03 价格锚点": ["ANCHOR", "9.5%", "VALUE"],
  "04 营销抓手": ["8 RMB", "10 RMB", "LIMITED"],
  "05 接住客流": ["SELF-SERVICE", "SYSTEM", "THROUGHPUT"],
  "06 后厨效率": ["KITCHEN", "PEAK", "MACHINE"],
  "07 风险反噬": ["RISK", "SAFETY", "BOTTOM LINE"],
  "08 热度之后": ["REPEAT", "RETENTION", "LONG GAME"],
};

const metricMap: Record<string, {value: number; unit: string; label: string}> = {
  "03 价格锚点": {value: 9.5, unit: "%", label: "百元以上门店占比"},
  "07 风险反噬": {value: 14, unit: "%", label: "风险舆情警戒"},
};

const secondsToFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

const activeByFrame = <T extends {start: number; end: number}>(
  items: T[],
  frame: number,
  fps: number,
) => {
  const seconds = frame / fps;
  return items.find((item) => seconds >= item.start && seconds < item.end) ?? items[0];
};

const useEntry = (startFrame: number, duration = 45) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  return {
    opacity: interpolate(local, [0, duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    }),
    translate: `0px ${interpolate(local, [0, duration], [26, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    })}px`,
    scale: interpolate(local, [0, duration], [0.97, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      output: "perceptual-scale",
    }),
  };
};

const HudCorners: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 0.86], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <AbsoluteFill style={{opacity, pointerEvents: "none"}}>
      {[
        {position: {left: 28, top: 24}, edgeLeft: true, edgeTop: true},
        {position: {right: 28, top: 24}, edgeRight: true, edgeTop: true},
        {position: {left: 28, bottom: 24}, edgeLeft: true, edgeBottom: true},
        {position: {right: 28, bottom: 24}, edgeRight: true, edgeBottom: true},
      ].map((corner, index) => {
        const color = index % 2 === 0 ? COLORS.yellow : COLORS.purple;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              width: 82,
              height: 52,
              ...corner.position,
              borderColor: color,
              borderStyle: "solid",
              borderWidth: 0,
              borderTopWidth: corner.edgeTop ? 2 : 0,
              borderRightWidth: corner.edgeRight ? 2 : 0,
              borderBottomWidth: corner.edgeBottom ? 2 : 0,
              borderLeftWidth: corner.edgeLeft ? 2 : 0,
              boxShadow: `0 0 18px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const ChapterCard: React.FC<{beat: Beat}> = ({beat}) => {
  const {fps} = useVideoConfig();
  const entry = useEntry(secondsToFrames(beat.start, fps));
  const isOpening = beat.chapter === "01 排队神话";
  const isRisk = beat.chapter === "07 风险反噬";
  const color = isRisk ? COLORS.red : COLORS.yellow;
  const chipList = chips[beat.chapter] ?? ["SUSHIRO", "MODEL", "SIGNAL"];

  return (
    <div
      style={{
        position: "absolute",
        left: 38,
        top: isOpening ? 504 : 34,
        width: isOpening ? 330 : 382,
        padding: "14px 16px 16px",
        background:
          "linear-gradient(135deg, rgba(2,5,15,0.76), rgba(18,10,38,0.56))",
        border: `1px solid ${color}`,
        boxShadow: `0 0 24px ${isRisk ? "rgba(255,23,68,0.34)" : "rgba(255,230,0,0.28)"}`,
        color: COLORS.white,
        clipPath:
          "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)",
        opacity: entry.opacity,
        translate: entry.translate,
        scale: entry.scale,
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            backgroundColor: color,
            boxShadow: `0 0 16px ${color}`,
          }}
        />
        <div style={{fontSize: 17, lineHeight: "22px", fontWeight: 900, color}}>
          {beat.chapter}
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: isOpening ? 28 : 32,
          lineHeight: isOpening ? "34px" : "39px",
          fontWeight: 900,
          textShadow: "0 0 16px rgba(255,255,255,0.36)",
        }}
      >
        {beat.headline}
      </div>
      <div style={{display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap"}}>
        {chipList.map((chip, index) => (
          <div
            key={chip}
            style={{
              padding: "5px 8px",
              fontSize: 10,
              lineHeight: "14px",
              fontWeight: 900,
              color: index === 0 ? color : COLORS.white,
              border: `1px solid ${
                index === 0 ? color : "rgba(255,255,255,0.22)"
              }`,
              backgroundColor:
                index === 0 ? "rgba(255,230,0,0.13)" : "rgba(255,255,255,0.08)",
              clipPath:
                "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
            }}
          >
            {chip}
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{beat: Beat}> = ({beat}) => {
  const metric = metricMap[beat.chapter];
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = secondsToFrames(beat.start, fps) + 18;
  const entry = useEntry(startFrame);

  if (!metric) {
    return null;
  }

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {damping: 24, stiffness: 88, mass: 0.8},
    durationInFrames: 34,
  });
  const value = interpolate(progress, [0, 1], [0, metric.value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const display = metric.value % 1 === 0 ? Math.round(value).toString() : value.toFixed(1);
  const width = Math.min((value / Math.max(metric.value, 1)) * 100, 100);
  const color = beat.chapter === "07 风险反噬" ? COLORS.red : COLORS.yellow;

  return (
    <div
      style={{
        position: "absolute",
        right: 44,
        bottom: 122,
        width: 294,
        padding: "16px 18px",
        background: "rgba(2,5,14,0.74)",
        border: `1px solid ${color}`,
        boxShadow: `0 0 28px ${
          beat.chapter === "07 风险反噬"
            ? "rgba(255,23,68,0.36)"
            : "rgba(127,0,255,0.32)"
        }`,
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
        opacity: entry.opacity,
        translate: entry.translate,
        scale: entry.scale,
      }}
    >
      <div style={{fontSize: 13, fontWeight: 900, color: COLORS.cyan}}>
        BUSINESS SIGNAL
      </div>
      <div style={{display: "flex", alignItems: "flex-end", gap: 8, marginTop: 6}}>
        <div
          style={{
            fontSize: 58,
            lineHeight: "60px",
            fontWeight: 900,
            color: COLORS.white,
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 20px ${color}`,
          }}
        >
          {display}
        </div>
        <div
          style={{
            paddingBottom: 8,
            fontSize: 20,
            lineHeight: "24px",
            fontWeight: 900,
            color,
          }}
        >
          {metric.unit}
        </div>
      </div>
      <div
        style={{
          marginTop: 5,
          fontSize: 16,
          lineHeight: "22px",
          fontWeight: 900,
          color: COLORS.white,
        }}
      >
        {metric.label}
      </div>
      <div style={{marginTop: 12, width: "100%", height: 5, backgroundColor: "rgba(255,255,255,0.14)"}}>
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${COLORS.yellow}, ${COLORS.red}, ${COLORS.purple})`,
          }}
        />
      </div>
    </div>
  );
};

const SubtitleBar: React.FC<{segment: Segment}> = ({segment}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = secondsToFrames(segment.start, fps);

  return (
    <div
      style={{
        position: "absolute",
        left: 154,
        bottom: 36,
        width: 972,
        minHeight: 54,
        padding: "8px 24px 10px",
        backgroundColor: "rgba(0,0,0,0.62)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: COLORS.white,
        fontSize: 30,
        lineHeight: "38px",
        fontWeight: 900,
        textAlign: "center",
        fontFamily:
          "Noto Sans SC, Microsoft YaHei UI, Microsoft YaHei, PingFang SC, sans-serif",
        textShadow: "0 2px 8px rgba(0,0,0,0.9)",
        opacity: interpolate(frame - startFrame, [0, 5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        }),
      }}
    >
      {segment.text}
    </div>
  );
};

const ScanSweep: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame % 150, [0, 149], [-70, 790], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: y,
        width: "100%",
        height: 2,
        background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
        opacity: 0.12,
      }}
    />
  );
};

export const TechRemakeShousilang: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const beat = activeByFrame(typedBeats, frame, fps);
  const segment = activeByFrame(typedSegments, frame, fps);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#02040A",
        fontFamily:
          "Inter, Noto Sans SC, Microsoft YaHei UI, Microsoft YaHei, sans-serif",
      }}
    >
      <OffthreadVideo
        src={staticFile("shousilang.mp4")}
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(2,4,10,0.24), transparent 36%, transparent 66%, rgba(2,4,10,0.24))",
        }}
      />
      <ScanSweep />
      <HudCorners />
      <ChapterCard beat={beat} />
      <MetricCard beat={beat} />
      <SubtitleBar segment={segment} />
    </AbsoluteFill>
  );
};
