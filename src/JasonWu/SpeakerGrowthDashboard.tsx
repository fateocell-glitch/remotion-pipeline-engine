import {Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {LayoutEffectProps} from "./DemoEffectComponents";
import {IcoFontPathIcon} from "./components/common/IcoFontPathIcon";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const BLUE = "#38BDF8";
const GREEN = "#37F29A";
const WHITE = "#FFFFFF";

const textProp = (props: Record<string, unknown> | undefined, key: string, fallback: string) => {
  const value = props?.[key];
  return typeof value === "string" ? value : fallback;
};

const FeatureIcon: React.FC<{seed: string}> = ({seed}) => (
  <div style={{width: 52, height: 52, borderRadius: 13, border: `1.5px solid rgba(56,132,255,.58)`, boxShadow: "0 0 24px rgba(37,99,235,.36), inset 0 0 22px rgba(37,99,235,.16)", display: "grid", placeItems: "center", background: "rgba(6,18,38,.46)"}}>
    <IcoFontPathIcon seed={seed} color={BLUE} />
  </div>
);
const FeatureRow: React.FC<{title: string; sub: string; index: number; start: number}> = ({title, sub, index, start}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start + index * 12, start + 22 + index * 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease});
  const x = interpolate(frame, [start + index * 12, start + 24 + index * 12], [-22, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease});
  return (
    <div style={{display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", alignItems: "center", gap: 18, opacity, transform: `translateX(${x}px)`}}>
      <FeatureIcon seed={`${title}|${sub}|${index}`} />
      <div style={{minWidth: 0}}>
        <div style={{color: WHITE, fontSize: 30, lineHeight: "35px", fontWeight: 900, overflowWrap: "break-word"}}>{title}</div>
        <div style={{marginTop: 4, color: "rgba(148,210,255,.74)", fontSize: 15, lineHeight: "18px", fontWeight: 850, letterSpacing: 2.4}}>{sub}</div>
      </div>
    </div>
  );
};

const BrandBlock: React.FC<{props?: Record<string, unknown>}> = ({props}) => (
  <div style={{position: "absolute", left: 72, right: 0, bottom: 185}}>
    <div style={{fontSize: 86, lineHeight: "88px", fontWeight: 950, letterSpacing: -1, textShadow: "0 20px 36px rgba(0,0,0,.6)"}}>{textProp(props, "headline", "Hermes")}</div>
    <div style={{marginTop: 18, height: 5, width: 230, borderRadius: 999, background: BLUE, boxShadow: "0 0 26px rgba(56,189,248,.9)"}} />
    <div style={{marginTop: 18, color: BLUE, fontSize: 23, lineHeight: "28px", fontWeight: 950, letterSpacing: 2.2}}>{textProp(props, "skillLabel", "自媒体运营 SKILL")}</div>
  </div>
);
const GrowthCurve: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [start, start + 78], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease});
  const pathLength = Math.max(0.001, progress);
  return (
    <svg width="336" height="118" viewBox="0 0 336 118" style={{display: "block", overflow: "visible"}}>
      <defs>
        <linearGradient id="speaker-growth-curve" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1DDC72" stopOpacity=".35" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d="M8 94 C68 88 92 74 126 74 C166 74 169 46 204 45 C238 45 246 18 314 16" fill="none" stroke="url(#speaker-growth-curve)" strokeWidth="5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - pathLength} pathLength="1" style={{filter: "drop-shadow(0 0 14px rgba(55,242,154,.9))"}} />
      <circle cx={314} cy={16} r={interpolate(frame, [start + 64, start + 90], [0, 7], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease})} fill={GREEN} style={{filter: "drop-shadow(0 0 18px rgba(55,242,154,.95))"}} />
    </svg>
  );
};

export const SpeakerGrowthDashboard: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const enterOpacity = interpolate(frame, [start, start + 24], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease});
  const enterX = interpolate(frame, [start, start + 30], [-42, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease});
  const metricValue = textProp(props, "metricValue", "165");
  const numeric = Number(String(metricValue).replace(/[^\d.-]/g, ""));
  const animatedMetric = Number.isFinite(numeric)
    ? Math.round(interpolate(frame, [start + 72, start + 142], [0, numeric], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease})).toLocaleString("en-US")
    : metricValue;

  return (
    <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: 570, padding: "64px 58px 58px 72px", color: WHITE, opacity: enterOpacity, transform: `translate(${enterX}px, 150px)`, overflow: "visible"}}>
      <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "linear-gradient(180deg, transparent, rgba(56,189,248,.82), transparent)"}} />
      <div style={{height: 179}} />
      <div style={{marginTop: 54, display: "grid", gap: 48}}>
        <FeatureRow title={textProp(props, "feature1Title", "评论区自动回复")} sub={textProp(props, "feature1Sub", "AUTO-REPLY")} index={0} start={start + 44} />
        <FeatureRow title={textProp(props, "feature2Title", "委婉推荐 · 财务自由团")} sub={textProp(props, "feature2Sub", "SOFT CTA")} index={1} start={start + 44} />
      </div>

      <div style={{marginTop: 58, position: "relative", minHeight: 250}}>
        <div style={{display: "grid", gridTemplateColumns: "54px minmax(0, 1fr)", gap: 18, alignItems: "start"}}>
          <div style={{width: 50, height: 50, borderRadius: 16, background: "rgba(55,242,154,.1)", border: "1px solid rgba(55,242,154,.55)", display: "grid", placeItems: "center", boxShadow: "0 0 28px rgba(55,242,154,.2)"}}>
            <IcoFontPathIcon seed={textProp(props, "metricTitle", "入群率 猛增")} color={GREEN} />
          </div>
          <div>
            <div style={{color: GREEN, fontSize: 27, lineHeight: "32px", fontWeight: 950, letterSpacing: 1.4, textShadow: "0 0 20px rgba(55,242,154,.55)"}}>{textProp(props, "metricTitle", "入群率 猛增")}</div>
            <div style={{display: "flex", alignItems: "baseline", gap: 14, marginTop: 4}}>
              <span style={{color: GREEN, fontSize: 102, lineHeight: "108px", fontWeight: 950, letterSpacing: -2, textShadow: "0 0 32px rgba(55,242,154,.68)"}}>{animatedMetric}</span>
              <span style={{color: "rgba(226,255,239,.88)", fontSize: 24, fontWeight: 900}}>{textProp(props, "metricUnit", "生效会员")}</span>
            </div>
            <div style={{color: "rgba(164,255,204,.64)", fontSize: 15, fontWeight: 850, letterSpacing: 2.2}}>{textProp(props, "metricSub", "NEW MEMBERS · 近 30 天")}</div>
          </div>
        </div>
        <div style={{position: "absolute", left: 52, top: 128}}>
          <GrowthCurve start={start + 90} />
        </div>
      </div>

      <BrandBlock props={props} />
      <div style={{position: "absolute", left: 72, right: 90, bottom: 86, borderTop: "1px solid rgba(56,189,248,.34)", paddingTop: 18, color: "rgba(214,241,255,.68)", fontSize: 17, lineHeight: "23px", fontWeight: 900, letterSpacing: 2.4}}>{textProp(props, "footer", "获客一把好手 · GROWTH ENGINE")}</div>
    </div>
  );
};


