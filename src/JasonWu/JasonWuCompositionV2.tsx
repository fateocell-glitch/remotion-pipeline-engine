import React from "react";
import {
  AbsoluteFill,
  Audio,
  Loop,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {activeTranscriptAtFrame} from "./timeline";
import {zhuzigeFullTranscript} from "./zhuzigeFullTranscript";
import {V2_LAYOUTS, type ZhuzigeV2Layout, type ZhuzigeV2Cue, zhuzigeFullCuesV2} from "./zhuzigeFullScriptV2";

import AnimatedList from "../../remotion-templates/templates/animated-list";
import AnimatedText from "../../remotion-templates/templates/animated-text";
import AreaChart from "../../remotion-templates/templates/area-chart";
import CardFlip from "../../remotion-templates/templates/card-flip";
import ChapterTitle from "../../remotion-templates/templates/chapter-title";
import CircularProgress from "../../remotion-templates/templates/circular-progress";
import ComparisonChart from "../../remotion-templates/templates/comparison-chart";
import DonutChart from "../../remotion-templates/templates/donut-chart";
import GalleryGrid from "../../remotion-templates/templates/gallery-grid";
import GlitchText from "../../remotion-templates/templates/glitch-text";
import GridPulse from "../../remotion-templates/templates/grid-pulse";
import ImageCarousel from "../../remotion-templates/templates/image-carousel";
import ImageComparisonSlider from "../../remotion-templates/templates/image-comparison-slider";
import ImageZoomReveal from "../../remotion-templates/templates/image-zoom-reveal";
import LineChart from "../../remotion-templates/templates/line-chart";
import LogoSplitReveal from "../../remotion-templates/templates/logo-split-reveal";
import LogoStrokeDraw from "../../remotion-templates/templates/logo-stroke-draw";
import MasonryGallery from "../../remotion-templates/templates/masonry-gallery";
import MatrixRain from "../../remotion-templates/templates/matrix-rain";
import NotificationPop from "../../remotion-templates/templates/notification-pop";
import PhotoStack from "../../remotion-templates/templates/photo-stack";
import PolaroidFrame from "../../remotion-templates/templates/polaroid-frame";
import PoppingText from "../../remotion-templates/templates/popping-text";
import ProgressBars from "../../remotion-templates/templates/progress-bars";
import ProgressSteps from "../../remotion-templates/templates/progress-steps";
import QuoteCard from "../../remotion-templates/templates/quote-card";
import SplitScreen from "../../remotion-templates/templates/split-screen";
import SpotlightReveal from "../../remotion-templates/templates/spotlight-reveal";
import StatCounter from "../../remotion-templates/templates/stat-counter";
import TextHighlight from "../../remotion-templates/templates/text-highlight";
import TitleSplit from "../../remotion-templates/templates/title-split";

const COLORS = {
  blue: "#0A84FF",
  gold: "#FFD166",
  white: "#FFFFFF",
  dim: "rgba(255,255,255,0.66)",
  ink: "rgba(2,6,12,0.9)",
};

const TEMPLATE_REGISTRY: Record<ZhuzigeV2Layout, React.FC> = {
  "photo-stack": PhotoStack,
  "logo-split": LogoSplitReveal,
  "animated-text": AnimatedText,
  "progress-steps": ProgressSteps,
  "grid-pulse": GridPulse,
  "line-chart": LineChart,
  "chapter-title": ChapterTitle,
  "comparison-chart": ComparisonChart,
  "progress-bars": ProgressBars,
  "image-comparison": ImageComparisonSlider,
  "gallery-grid": GalleryGrid,
  "donut-chart": DonutChart,
  "animated-list": AnimatedList,
  "stat-counter": StatCounter,
  "masonry-gallery": MasonryGallery,
  "area-chart": AreaChart,
  "polaroid-frame": PolaroidFrame,
  "split-screen": SplitScreen,
  "card-flip": CardFlip,
  "matrix-rain": MatrixRain,
  "circular-progress": CircularProgress,
  "notification-pop": NotificationPop,
  "image-carousel": ImageCarousel,
  "text-highlight": TextHighlight,
  "image-zoom": ImageZoomReveal,
  "quote-card": QuoteCard,
  "title-split": TitleSplit,
  "logo-stroke": LogoStrokeDraw,
  "popping-text": PoppingText,
  "glitch-text": GlitchText,
  "spotlight-reveal": SpotlightReveal,
};

const entry = (frame: number, start: number) => {
  const progress = interpolate(frame, [start, start + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {opacity: progress, transform: `translateY(${(1 - progress) * 28}px)`};
};

const activeCue = (frame: number, fps: number): ZhuzigeV2Cue => {
  const seconds = frame / fps;
  return zhuzigeFullCuesV2.find((cue) => seconds >= cue.start && seconds < cue.end) ?? zhuzigeFullCuesV2[zhuzigeFullCuesV2.length - 1];
};

const SceneLabel: React.FC<{cue: ZhuzigeV2Cue; index: number}> = ({cue, index}) => (
  <div style={{position: "absolute", left: 72, top: 64, zIndex: 5}}>
    <div style={{color: COLORS.gold, fontWeight: 900, fontSize: 18, letterSpacing: 4}}>V2 / {index < 9 ? `0${index + 1}` : String(index + 1)}</div>
    <div style={{color: COLORS.white, fontWeight: 900, fontSize: 25, marginTop: 10}}>{cue.section.eyebrow}</div>
  </div>
);

const TemplateScene: React.FC<{cue: ZhuzigeV2Cue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(cue.start * fps);
  const index = V2_LAYOUTS.indexOf(cue.layout);
  const Template = TEMPLATE_REGISTRY[cue.layout];
  const isRight = index % 3 !== 0;
  const stageWidth = index % 4 === 0 ? 1040 : 820;
  const stageLeft = isRight ? 1920 - stageWidth - 72 : 72;
  const textLeft = isRight ? 90 : 1030;
  const accent = index % 3 === 1 ? COLORS.gold : COLORS.blue;

  return (
    <>
      <SceneLabel cue={cue} index={index} />
      <div
        style={{
          position: "absolute",
          left: stageLeft,
          top: 164,
          width: stageWidth,
          height: 610,
          overflow: "hidden",
          border: `1px solid ${accent}88`,
          background: "rgba(3,8,15,0.68)",
          boxShadow: `0 0 34px ${accent}33`,
          ...entry(frame, startFrame),
        }}
      >
        <AbsoluteFill style={{opacity: 0.72, filter: "saturate(0.68) contrast(1.05)"}}>
          <Template />
        </AbsoluteFill>
        <AbsoluteFill style={{background: "linear-gradient(90deg, rgba(3,8,15,0.26), rgba(3,8,15,0.04))"}} />
      </div>
      <div style={{position: "absolute", left: textLeft, right: isRight ? 880 : 90, top: 300, zIndex: 4, ...entry(frame, startFrame + 8)}}>
        <div style={{width: 70, height: 5, background: accent, marginBottom: 22}} />
        <div style={{color: COLORS.white, fontSize: 66, fontWeight: 950, lineHeight: "78px", maxWidth: 760}}>{cue.section.subtitle}</div>
        <div style={{marginTop: 22, color: COLORS.dim, fontSize: 29, fontWeight: 750, lineHeight: "42px", maxWidth: 720}}>{cue.caption.zh}</div>
        <div style={{marginTop: 26, color: accent, fontSize: 17, fontWeight: 900, letterSpacing: 3}}>{cue.layout.toUpperCase()}</div>
      </div>
    </>
  );
};

const SubtitleV2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const transcript = activeTranscriptAtFrame(zhuzigeFullTranscript, frame, fps);
  return (
    <div style={{position: "absolute", left: 150, right: 150, bottom: 48, zIndex: 10, textAlign: "center", textShadow: "0 3px 12px rgba(0,0,0,0.96)"}}>
      <div style={{color: COLORS.white, fontSize: 34, fontWeight: 900, lineHeight: "44px"}}>{transcript.zh}</div>
      <div style={{color: "rgba(255,255,255,0.64)", fontSize: 20, fontWeight: 700, lineHeight: "30px", marginTop: 4}}>{transcript.en}</div>
    </div>
  );
};

export const ZhuzigeFullCompositionV2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cue = activeCue(frame, fps);
  return (
    <AbsoluteFill style={{background: "#03060B", overflow: "hidden", fontFamily: "Inter, Noto Sans SC, Microsoft YaHei UI, Microsoft YaHei, sans-serif"}}>
      <Loop durationInFrames={2714}>
        <OffthreadVideo src={staticFile("test.mp4")} volume={0} style={{width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.32) saturate(0.68)"}} />
      </Loop>
      <AbsoluteFill style={{background: "linear-gradient(90deg, rgba(2,6,12,0.72), rgba(4,10,18,0.18) 50%, rgba(2,6,12,0.68)), linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.78))"}} />
      <TemplateScene cue={cue} />
      <SubtitleV2 />
      <Audio src={staticFile("zhuzigeceo-audio.wav")} />
    </AbsoluteFill>
  );
};

