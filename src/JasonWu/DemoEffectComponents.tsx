import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {JasonWuCue} from "./timeline";
import {getEntranceDurationFrames, resolveContentItems, resolveContentNumber, resolveContentText} from "./layoutRuntime";

export type LayoutEffectProps = {
  cue: JasonWuCue;
  props?: Record<string, unknown>;
};

const COLORS = {
  blue: "var(--primary-accent)",
  gold: "#FFD166",
  green: "#36D399",
  white: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  panel: "var(--card-panel)",
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const stringProp = (props: Record<string, unknown> | undefined, key: string, fallback: string) => typeof props?.[key] === "string" && props[key].trim() ? props[key] : fallback;
const numberProp = (props: Record<string, unknown> | undefined, key: string, fallback: number) => typeof props?.[key] === "number" && Number.isFinite(props[key]) ? props[key] : fallback;

const demoEnter = (frame: number, start: number, x = -28) => ({
  opacity: interpolate(frame, [start, start + 24], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut}),
  translate: `${interpolate(frame, [start, start + 24], [x, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut})}px 0`,
});

const PersonDisc: React.FC<{name: string; role: string; size: number; active?: boolean}> = ({name, role, size, active}) => (
  <div style={{width: size, height: size, borderRadius: "50%", background: active ? "#94a3b8" : "rgba(255,255,255,0.16)", border: `3px solid ${active ? COLORS.blue : "rgba(255,255,255,0.18)"}`, boxShadow: active ? "0 0 42px rgba(10,132,255,0.55)" : "none", position: "relative", overflow: "hidden"}}>
    <div style={{position: "absolute", left: "50%", top: "27%", width: size * 0.22, height: size * 0.22, borderRadius: "50%", background: "#202936", translate: "-50% 0"}} />
    <div style={{position: "absolute", left: "20%", right: "20%", bottom: "-3%", height: "34%", borderRadius: "50% 50% 0 0", background: "#202936"}} />
    <div style={{position: "absolute", left: 0, right: 0, bottom: 22, color: COLORS.white, textAlign: "center", fontSize: 18, fontWeight: 950}}>{name}</div>
    <div style={{position: "absolute", left: 0, right: 0, bottom: 5, color: active ? COLORS.blue : COLORS.dim, textAlign: "center", fontSize: 11, fontWeight: 900, letterSpacing: 2}}>{role}</div>
  </div>
);

export const DemoAvatarFlip: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps);
  const outgoing = cue.people?.[0];
  const incoming = cue.people?.[1];
  const leftName = stringProp(props, "leftName", outgoing?.name ?? (cue.section.subtitle.slice(0, 6) || "人物 A"));
  const leftRole = stringProp(props, "leftRole", outgoing?.role ?? (cue.section.eyebrow || "起始角色"));
  const rightName = stringProp(props, "rightName", incoming?.name ?? (cue.caption.zh.slice(0, 6) || "人物 B"));
  const rightRole = stringProp(props, "rightRole", incoming?.role ?? (cue.section.eyebrow || "目标角色"));
  return <div style={{position: "absolute", left: 95, top: 210, display: "flex", alignItems: "center", gap: 28, ...demoEnter(frame, start + 10, -34)}}><PersonDisc name={leftName} role={leftRole} size={155} /><div style={{color: COLORS.dim, fontSize: 58, fontWeight: 950}}>→</div><PersonDisc name={rightName} role={rightRole} size={220} active /></div>;
};

const RollingNumber: React.FC<{from: number; to: number; start: number; end: number; suffix?: string}> = ({from, to, start, end, suffix = ""}) => {
  const frame = useCurrentFrame();
  const value = Math.round(interpolate(frame, [start, end], [from, to], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut}));
  return <>{value.toLocaleString("en-US")}{suffix}</>;
};

const StatCard: React.FC<{label: string; from: number; to: number; suffix?: string; color: string; start: number}> = ({label, from, to, suffix, color, start}) => {
  const frame = useCurrentFrame();
  return <div style={{width: 260, padding: "16px 18px", borderRadius: 10, background: COLORS.panel, border: `1px solid ${color}`, boxShadow: `0 0 28px color-mix(in srgb, ${color} 27%, transparent)`, ...demoEnter(frame, start, 0)}}><div style={{color, fontSize: 14, fontWeight: 950, letterSpacing: 2}}>{label}</div><div style={{color: COLORS.white, fontSize: 52, lineHeight: "60px", fontWeight: 950}}><RollingNumber from={from} to={to} suffix={suffix} start={start + 12} end={start + 88} /></div></div>;
};

export const MarketGrowthAndTimeline: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const progress = interpolate(frame, [start + 26, start + 190], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut});
  const years = resolveContentItems(cue, props, ["years", "items", "steps"]);
  const marketLabel = stringProp(props, "marketLabel", cue.metric?.label ?? resolveContentText(cue, props));
  const marketTo = resolveContentNumber(props, "marketTo", 0);
  const engineeringTo = resolveContentNumber(props, "engineeringTo", 0);
  return <><div style={{position: "absolute", right: 92, top: 450, display: "flex", gap: 14}}><StatCard label={marketLabel} from={0} to={marketTo} suffix={stringProp(props, "marketSuffix", "Y")} color={COLORS.blue} start={start + 18} /><StatCard label={stringProp(props, "engineeringLabel", "ENGINEERING")} from={0} to={engineeringTo} color={COLORS.gold} start={start + 36} /></div><div style={{position: "absolute", left: 270, right: 270, bottom: 205, height: 58, ...demoEnter(frame, start + 44, 0)}}><div style={{position: "absolute", left: 0, right: 0, top: 28, height: 4, background: "rgba(255,255,255,0.22)"}} /><div style={{position: "absolute", left: 0, top: 28, width: `${progress * 100}%`, height: 4, background: COLORS.blue, boxShadow: "0 0 18px rgba(10,132,255,0.9)"}} /><div style={{position: "absolute", left: `${progress * 100}%`, top: 17, width: 26, height: 26, borderRadius: "50%", background: COLORS.gold, translate: "-50% 0", boxShadow: "0 0 22px rgba(255,209,102,0.85)"}} />{years.map((year, index) => <div key={`${year}-${index}`} style={{position: "absolute", left: `${years.length === 1 ? 0 : (index / (years.length - 1)) * 100}%`, top: 38, translate: "-50% 0", color: index === years.length - 1 ? COLORS.blue : COLORS.dim, fontSize: 18, fontWeight: 950}}>{year}</div>)}</div></>;
};

export const GrowthTimelineLine: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const progress = interpolate(frame, [start + 18, start + 154], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
  const years = resolveContentItems(cue, props, ['years', 'items', 'steps']);
  return <div style={{position: 'absolute', left: 175, right: 175, bottom: 205, height: 108, ...demoEnter(frame, start + 16, 0)}}><div style={{position: 'absolute', left: 0, right: 0, top: 32, height: 4, background: 'rgba(255,255,255,.22)'}} /><div style={{position: 'absolute', left: 0, top: 32, width: (progress * 100) + '%', height: 4, background: COLORS.blue, boxShadow: '0 0 18px rgba(10,132,255,.9)'}} /><div style={{position: 'absolute', left: (progress * 100) + '%', top: 21, width: 26, height: 26, borderRadius: '50%', background: COLORS.gold, translate: '-50% 0', boxShadow: '0 0 22px rgba(255,209,102,.85)'}} />{years.map((year, index) => <div key={year + '-' + index} style={{position: 'absolute', left: (years.length === 1 ? 0 : (index / (years.length - 1)) * 100) + '%', top: 52, translate: '-50% 0', color: index === years.length - 1 ? COLORS.blue : COLORS.dim, fontSize: 18, fontWeight: 950}}>{year}</div>)}</div>;
};

export const CapitalDashboardNumbers: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const marketLabel = stringProp(props, 'marketLabel', cue.metric?.label ?? resolveContentText(cue, props));
  const marketTo = resolveContentNumber(props, 'marketTo', 0);
  const engineeringTo = resolveContentNumber(props, 'engineeringTo', 0);
  return <div style={{position: 'absolute', right: 100, top: 382, display: 'flex', gap: 18}}><StatCard label={marketLabel} from={0} to={marketTo} suffix={stringProp(props, 'marketSuffix', '')} color={COLORS.blue} start={start + 18} /><StatCard label={stringProp(props, 'engineeringLabel', '增长指标')} from={0} to={engineeringTo} suffix={stringProp(props, 'engineeringSuffix', '')} color={COLORS.gold} start={start + 38} /></div>;
};

export const SplitScreenAccent: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const from = numberProp(props, "from", 8);
  const to = numberProp(props, "to", 25);
  const value = interpolate(frame, [start + 50, start + 134], [from, to], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut});
  const left = stringProp(props, "leftLabel", cue.section.subtitle);
  const right = stringProp(props, "rightLabel", cue.caption.zh);
  return <div style={{position: "absolute", right: 84, top: 192, width: 600, maxWidth: "60%", padding: 20, zIndex: 10, overflow: "hidden", borderRadius: 12, background: "rgba(15,23,42,.85)", backdropFilter: "blur(8px)", border: `1px solid ${COLORS.blue}`, boxShadow: "0 14px 42px rgba(0,0,0,.34), 0 0 28px rgba(10,132,255,.18)", ...demoEnter(frame, start + 14, 36)}}><div style={{color: COLORS.blue, fontSize: 15, fontWeight: 950, letterSpacing: 3}}>{stringProp(props, "title", cue.section.eyebrow)}</div><div style={{display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginTop: 15}}>{[{label: left, value: stringProp(props, "leftValue", `${from}%`), color: COLORS.gold}, {label: right, value: stringProp(props, "rightValue", `${to}%`), color: COLORS.blue}].map((item, index) => <div key={item.label + index} style={{minWidth: 0, minHeight: 112, padding: "14px 13px", overflow: "hidden", borderRadius: 8, border: `1px solid ${item.color}`, background: "rgba(2,8,23,.62)", opacity: interpolate(frame, [start + 24 + index * 12, start + 48 + index * 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}><div style={{minHeight: 34, color: item.color, fontSize: 13, lineHeight: "17px", fontWeight: 950, overflow: "hidden"}}>{item.label}</div><div style={{marginTop: 8, color: COLORS.white, fontSize: 28, lineHeight: "32px", fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{item.value}</div></div>)}</div><div style={{display: "flex", alignItems: "center", gap: 10, marginTop: 15}}><div style={{color: COLORS.dim, fontSize: 13, fontWeight: 900, whiteSpace: "nowrap"}}>{from}% → {to}%</div><div style={{height: 10, flex: 1, borderRadius: 99, background: "rgba(255,255,255,.13)", overflow: "hidden"}}><div style={{width: `${Math.min(100, Math.max(0, value * 3))}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.gold})`, boxShadow: "0 0 18px rgba(255,209,102,.75)"}} /></div></div></div>;
};

export const SpecBadgeAndTypewriter: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const text = stringProp(props, "text", stringProp(props, "effectZh", cue.caption.zh || cue.section.subtitle));
  const typingFrames = getEntranceDurationFrames("pivot-list", fps, 1, text.length);
  const typed = Math.floor(interpolate(frame, [start + Math.round(fps * .5), start + Math.round(fps * .5) + typingFrames], [0, text.length], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  return <div style={{position: "absolute", right: 100, top: 520, width: 700, maxWidth: "52%", padding: "18px 22px", borderRadius: 10, background: "rgba(3,8,15,.84)", border: `1px solid ${COLORS.green}`, color: COLORS.green, fontSize: 28, lineHeight: "38px", fontWeight: 950, boxShadow: "0 0 28px rgba(54,211,153,.3)", opacity: interpolate(frame, [start + 28, start + 52], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>{text.slice(0, typed)}<span style={{opacity: Math.sin(frame / 6) > 0 ? 1 : .2}}>▌</span></div>;
};

export const KineticTypographyAccent: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const slam = spring({frame: frame - start - 18, fps, config: {damping: 10, stiffness: 220}});
  const sweep = interpolate(frame, [start + 42, start + 105], [-120, 720], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.linear});
  const headline = stringProp(props, "headline", cue.caption.zh || cue.section.subtitle);
  return <div style={{position: "absolute", left: 620, right: 100, top: 525, color: COLORS.white, textAlign: "center", scale: interpolate(slam, [0, 1], [.58, 1.04], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), rotate: `${interpolate(slam, [0, 1], [-2, .4], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}deg`}}><div style={{position: "relative", overflow: "hidden", fontSize: 62, lineHeight: "70px", fontWeight: 950, textShadow: "0 0 38px rgba(10,132,255,.88)"}}>{headline}<div style={{position: "absolute", top: 0, bottom: 0, left: sweep, width: 82, rotate: "18deg", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.68), transparent)"}} /></div><div style={{marginTop: 8, color: COLORS.gold, fontSize: 20, fontWeight: 950}}>{cue.section.eyebrow}</div></div>;
};

export const FloatingCommentCards: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const comments = resolveContentItems(cue, props, ["comments", "items", "steps"]).slice(0, 3);
  return <>{comments.map((comment, index) => <div key={`${comment}-${index}`} style={{position: "absolute", right: 125 + index * 52 + Math.sin((frame - start) / 16 + index) * 8, bottom: 255 + index * 70, padding: "13px 18px", borderRadius: 11, background: "rgba(3,8,15,.88)", border: `1px solid ${index === 1 ? COLORS.gold : COLORS.blue}`, color: COLORS.white, fontSize: 21, fontWeight: 950, boxShadow: `0 0 22px ${index === 1 ? COLORS.gold : COLORS.blue}55`, ...demoEnter(frame, start + 54 + index * 18, 58)}}>{comment}</div>)}</>;
};

export const FallbackTechPanel: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = Math.round(cue.start * fps) + 8;
  const effectZh = stringProp(props, "effectZh", cue.caption.zh);
  const effectEn = stringProp(props, "effectEn", cue.caption.en);
  return <div style={{position: "absolute", left: 92, top: 230, width: 660, padding: "24px 28px", background: "rgba(3,8,15,.68)", borderLeft: `3px solid ${COLORS.blue}`, borderBottom: "1px solid rgba(255,255,255,.18)", ...demoEnter(frame, start, -28)}}><div style={{color: COLORS.blue, fontSize: 16, fontWeight: 950, letterSpacing: 3}}>{cue.section.eyebrow}</div><div style={{marginTop: 14, color: COLORS.white, fontSize: 48, lineHeight: "58px", fontWeight: 950}}>{stringProp(props, "headline", cue.section.subtitle)}</div><div style={{marginTop: 14, color: COLORS.dim, fontSize: 25, fontWeight: 800}}>{effectZh}</div>{effectEn ? <div style={{marginTop: 8, color: "rgba(255,255,255,.72)", fontSize: 15, fontWeight: 800, letterSpacing: 1.2}}>{effectEn}</div> : null}</div>;
};
