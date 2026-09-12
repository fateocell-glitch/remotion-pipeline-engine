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
import beats from "./data/9531_beat_plan.json";
import segments from "./data/9531_segments_clean.json";

type Beat = {
  start: number;
  end: number;
  chapter: string;
  headline: string;
  surfaceMode: string;
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
  black: "rgba(2, 5, 14, 0.76)",
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const chapterNotes: Record<string, string[]> = {
  "01 官方定调": ["GENERATIVE SEARCH", "OFFICIAL GUIDE", "REALITY CHECK"],
  "02 焦虑入口": ["AIO / GEO", "STOP BLIND SPEND", "VERIFY FIRST"],
  "03 地基没变": ["INDEX FIRST", "RANKING SYSTEM", "SEO CORE"],
  "04 五大迷思": ["LLMS.TXT", "CONTENT CHUNKS", "FAKE MENTIONS"],
  "05 真正有效": ["FIRST-HAND PROOF", "DEPTH", "EXPERIENCE"],
  "06 商业入口": ["MERCHANT DATA", "PRODUCT FEED", "SOURCE ACCURACY"],
  "07 未来趋势": ["AI AGENTS", "WATCHLIST", "NEXT INTERFACE"],
  "08 终极策略": ["REAL VALUE", "RESOURCE FOCUS", "LONG GAME"],
};

const metrics: Record<string, {label: string; value: number; unit: string}> = {
  "04 五大迷思": {label: "无效捷径", value: 5, unit: "项"},
  "05 真正有效": {label: "经验权重", value: 92, unit: "%"},
  "06 商业入口": {label: "资料准确度", value: 88, unit: "%"},
  "08 终极策略": {label: "真实价值投入", value: 100, unit: "%"},
};

const secondsToFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

const useEntry = (startFrame: number, duration = 36) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;

  return {
    opacity: interpolate(local, [0, duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    }),
    translate: `0px ${interpolate(local, [0, duration], [30, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    })}px`,
    scale: interpolate(local, [0, duration], [0.96, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      output: "perceptual-scale",
    }),
  };
};

const activeByFrame = <T extends {start: number; end: number}>(
  items: T[],
  frame: number,
  fps: number,
) => {
  const seconds = frame / fps;
  return items.find((item) => seconds >= item.start && seconds < item.end) ?? items[0];
};

const FrameCorners: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <AbsoluteFill style={{opacity, pointerEvents: "none"}}>
      {[
        {position: {left: 30, top: 26}, edgeLeft: true, edgeTop: true},
        {position: {right: 30, top: 26}, edgeRight: true, edgeTop: true},
        {position: {left: 30, bottom: 26}, edgeLeft: true, edgeBottom: true},
        {position: {right: 30, bottom: 26}, edgeRight: true, edgeBottom: true},
      ].map((corner, index) => {
        const accent = index % 2 === 0 ? COLORS.yellow : COLORS.purple;

        return (
          <div
            key={index}
            style={{
            position: "absolute",
            width: 82,
            height: 52,
            ...corner.position,
            borderColor: accent,
            borderStyle: "solid",
            borderWidth: 0,
            borderTopWidth: corner.edgeTop ? 2 : 0,
            borderRightWidth: corner.edgeRight ? 2 : 0,
            borderBottomWidth: corner.edgeBottom ? 2 : 0,
            borderLeftWidth: corner.edgeLeft ? 2 : 0,
            boxShadow: `0 0 18px ${accent}`,
          }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const ChapterPanel: React.FC<{beat: Beat}> = ({beat}) => {
  const {fps} = useVideoConfig();
  const startFrame = secondsToFrames(beat.start, fps);
  const entry = useEntry(startFrame);
  const notes = chapterNotes[beat.chapter] ?? ["SEARCH", "SIGNAL", "SYSTEM"];
  const isOpening = beat.chapter === "01 官方定调";

  return (
    <div
      style={{
        position: "absolute",
        left: 42,
        top: isOpening ? 282 : 34,
        width: 405,
        padding: "16px 18px 18px",
        clipPath:
          "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
        background:
          "linear-gradient(135deg, rgba(4,7,18,0.78), rgba(20,12,42,0.62))",
        border: `1px solid rgba(255, 230, 0, 0.72)`,
        boxShadow: "0 0 32px rgba(127, 0, 255, 0.32)",
        color: COLORS.white,
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
            backgroundColor: COLORS.yellow,
            boxShadow: `0 0 16px ${COLORS.yellow}`,
          }}
        />
        <div style={{fontSize: 18, fontWeight: 800, color: COLORS.yellow}}>
          {beat.chapter}
        </div>
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 31,
          lineHeight: "38px",
          fontWeight: 900,
          textShadow: "0 0 18px rgba(255,255,255,0.34)",
        }}
      >
        {beat.headline}
      </div>
      <div style={{display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap"}}>
        {notes.map((note, index) => (
          <div
            key={note}
            style={{
              padding: "5px 8px",
              fontSize: 10,
              lineHeight: "14px",
              fontWeight: 800,
              color: index === 0 ? COLORS.yellow : COLORS.white,
              backgroundColor:
                index === 0 ? "rgba(255,230,0,0.14)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${
                index === 0 ? "rgba(255,230,0,0.7)" : "rgba(255,255,255,0.2)"
              }`,
              clipPath:
                "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
            }}
          >
            {note}
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricPanel: React.FC<{beat: Beat}> = ({beat}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = secondsToFrames(beat.start, fps) + 20;
  const entry = useEntry(startFrame);
  const metric = metrics[beat.chapter];

  if (!metric) {
    return null;
  }

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {damping: 24, stiffness: 90, mass: 0.8},
    durationInFrames: 32,
  });
  const value = Math.round(
    interpolate(progress, [0, 1], [0, metric.value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <div
      style={{
        position: "absolute",
        right: 46,
        bottom: 122,
        width: 286,
        padding: "16px 18px",
        background: COLORS.black,
        border: `1px solid rgba(127, 0, 255, 0.68)`,
        boxShadow: "0 0 28px rgba(127, 0, 255, 0.32)",
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
        opacity: entry.opacity,
        translate: entry.translate,
        scale: entry.scale,
      }}
    >
      <div style={{fontSize: 13, fontWeight: 800, color: COLORS.cyan}}>
        SIGNAL METRIC
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          marginTop: 6,
        }}
      >
        <div
          style={{
            fontSize: 54,
            lineHeight: "58px",
            fontWeight: 900,
            color: COLORS.white,
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 20px ${COLORS.purple}`,
          }}
        >
          {value}
        </div>
        <div
          style={{
            paddingBottom: 8,
            fontSize: 20,
            lineHeight: "24px",
            fontWeight: 900,
            color: COLORS.yellow,
          }}
        >
          {metric.unit}
        </div>
      </div>
      <div
        style={{
          marginTop: 5,
          fontSize: 17,
          lineHeight: "22px",
          fontWeight: 800,
          color: COLORS.white,
        }}
      >
        {metric.label}
      </div>
      <div
        style={{
          marginTop: 12,
          width: "100%",
          height: 5,
          backgroundColor: "rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            width: `${Math.min(value, 100)}%`,
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
        bottom: 38,
        width: 972,
        minHeight: 54,
        padding: "8px 24px 10px",
        backgroundColor: "rgba(0,0,0,0.62)",
        border: `1px solid rgba(255,255,255,0.18)`,
        color: COLORS.white,
        fontSize: 28,
        lineHeight: "36px",
        fontWeight: 900,
        textAlign: "center",
        fontFamily:
          "Noto Sans SC, Microsoft YaHei UI, Microsoft YaHei, PingFang SC, sans-serif",
        textShadow: "0 2px 8px rgba(0,0,0,0.88)",
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

const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame % 120, [0, 119], [-80, 800], {
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
        opacity: 0.18,
      }}
    />
  );
};

export const TechRemake9531: React.FC = () => {
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
        src={staticFile("9531.mp4")}
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(2,4,10,0.28), transparent 34%, transparent 66%, rgba(2,4,10,0.34))",
        }}
      />
      <ScanLine />
      <FrameCorners />
      <ChapterPanel beat={beat} />
      <MetricPanel beat={beat} />
      <SubtitleBar segment={segment} />
    </AbsoluteFill>
  );
};
