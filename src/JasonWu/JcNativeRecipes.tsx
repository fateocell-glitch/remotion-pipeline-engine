import React from "react";
import {AbsoluteFill} from "remotion";
import {
  Bot,
  Check,
  Code2,
  Crown,
  Eye,
  FileText,
  Flame,
  GitBranch,
  Lightbulb,
  Package,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  TerminalSquare,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import {normalizeComponentContent, toRendererContentProps} from "../design/component-content";
import {JcFontGate} from "./JcFontGate";
import * as jc from "./components/jc";
import {COLOR, FONT, type SemanticColor} from "./components/jc/tokens";

type RecordValue = Record<string, unknown>;
type RecipeContent = {
  category: string;
  headline: string;
  body: string;
  lines: string[];
  metric: {label: string; value: number; unit: string; detail: string};
};

const validColors = new Set<SemanticColor>(["blue", "green", "yellow", "red"]);
const avatarSrc = "data:image/svg+xml,%3Csvg%20xmlns=%27http%3A%2F%2Fwww.w3.org%2F2000%200%20160%20160%27%3E%3Crect%20width%3D%27160%27%20height%3D%27160%27%20fill%3D%27%23131a2a%27%2F%3E%3Ccircle%20cx%3D%2780%27%20cy%3D%2762%27%20r%3D%2732%27%20fill%3D%27%234d9eff%27%2F%3E%3Crect%20x%3D%2734%27%20y%3D%27104%27%20width%3D%2792%27%20height%3D%2736%27%20rx%3D%2718%27%20fill%3D%27%233ddc84%27%2F%3E%3C%2Fsvg%3E";

const asText = (value: unknown, fallback = ""): string => typeof value === "string" && value.trim() ? value.trim() : fallback;
const asNumber = (value: unknown, fallback = 72): number => Number.isFinite(Number(value)) ? Number(value) : fallback;
const stringList = (value: unknown): string[] => Array.isArray(value) ? value.map((item) => asText(item)).filter(Boolean) : [];

const recipeContent = (source: RecordValue): RecipeContent => {
  const normalized = normalizeComponentContent(source);
  const renderer = toRendererContentProps(source);
  const payload = normalized.contentPayload;
  const lines = payload.type === "chips"
    ? payload.items.map((item) => item.title).filter(Boolean)
    : payload.type === "steps"
      ? payload.steps.map((item) => item.text).filter(Boolean)
      : stringList(renderer.items).length
        ? stringList(renderer.items)
        : stringList(renderer.steps).length
          ? stringList(renderer.steps)
          : [normalized.headline];
  const body = payload.type === "narrative"
    ? payload.bodyText
    : payload.type === "metrics"
      ? asText(payload.detailText, asText(renderer.body, normalized.headline))
      : asText(renderer.body, normalized.headline);
  const subtext = payload.type === "narrative" ? asText(payload.highlightQuote, asText(renderer.highlightQuote)) : asText(renderer.highlightQuote);
  const metric = payload.type === "metrics"
    ? {label: payload.label, value: asNumber(payload.value), unit: payload.unit ?? "", detail: payload.detailText ?? ""}
    : {label: asText(renderer.label, normalized.headline), value: asNumber(renderer.value), unit: asText(renderer.unit), detail: body};
  return {category: normalized.category, headline: normalized.headline, body, subtext, lines: lines.length ? lines : [normalized.headline], metric};
};

const sourceAccent = (source: RecordValue, nativeColor: SemanticColor): SemanticColor => {
  if (source.__jcUseLayerAccent !== true) return nativeColor;
  const requested = String(source.accent ?? "");
  return validColors.has(requested as SemanticColor) ? requested as SemanticColor : nativeColor;
};

const lineAt = (content: RecipeContent, index: number): string => content.lines[index] ?? content.lines[content.lines.length - 1] ?? content.headline;

export const JcNativeStageBackdrop: React.FC<{children: React.ReactNode; scrim?: boolean}> = ({children, scrim = true}) => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(100% 90% at 24% 18%, #18243a 0%, #0b0e14 48%, #07090d 100%)",
      overflow: "hidden",
    }}
  >
    <JcFontGate />
    {scrim ? <jc.InfoScrim strength={0.62} side="left" /> : null}
    {children}
  </AbsoluteFill>
);

export const renderJcNativeRecipe = (exportName: string, source: RecordValue): React.ReactNode => {
  const content = recipeContent(source);
  const headline = content.headline;
  const body = content.body || headline;
  const lines = content.lines;
  const metric = content.metric;
  const color = (nativeColor: SemanticColor) => sourceAccent(source, nativeColor);

  switch (exportName) {
    case "BadgeCard":
      return <div style={{position: "absolute", left: 610, top: 330}}><jc.BadgeCard icon={<Crown size={64} />} zhTitle={headline} zhResult={body} enKicker={content.category} accent={color("yellow")} enterAt={0} /></div>;
    case "BarChart":
      return <div style={{position: "absolute", left: 430, top: 285}}><jc.BarChart width={760} accent={color("yellow")} items={lines.slice(0, 4).map((label, index) => ({label, value: Math.max(12, metric.value - index * 14), display: String(Math.max(12, metric.value - index * 14)), highlight: index === 0}))} /></div>;
    case "BigNumber":
      return <div style={{position: "absolute", left: 500, top: 290}}><jc.BigNumber value={metric.value} suffix={metric.unit || "%"} color={color("green")} enKicker={metric.label || content.category} zhSub={metric.detail || body} size="mega" enterAt={0} /></div>;
    case "BilingualSub":
      return <><jc.HeroText kicker="CAPTION" segments={[{t: headline, color: color("blue")}]} top={250} enterAt={0} /><jc.BilingualSub zh={body} en={content.category} /></>;
    case "Breathe":
      return <div style={{position: "absolute", left: 690, top: 290}}><jc.Breathe amp={2}><div style={{width: 360, height: 360, borderRadius: 180, border: `6px solid ${COLOR.green}`, color: COLOR.green, boxShadow: `0 0 90px ${COLOR.green}66`, display: "flex", alignItems: "center", justifyContent: "center"}}><ShieldCheck size={150} /></div></jc.Breathe></div>;
    case "BrickWall":
      return <div style={{position: "absolute", left: 470, top: 360}}><jc.BrickWall label={headline} enLabel={content.category} rows={3} width={880} enterAt={0} /></div>;
    case "CardWall":
      return <div style={{position: "absolute", left: 250, top: 250}}><jc.CardWall cols={3} cardWidth={360} gap={22} items={lines.slice(0, 6).map((text, index) => ({name: String.fromCharCode(65 + index), text}))} enterAt={0} /></div>;
    case "Checklist":
      return <jc.Checklist accent={color("green")} top={250} items={lines.slice(0, 3).map((text, index) => ({icon: index === 0 ? <Eye size={34} /> : index === 1 ? <Flame size={34} /> : <Check size={34} />, segments: [{t: text}], enterAt: index * 10}))} />;
    case "Chip":
      return <div style={{position: "absolute", left: 520, top: 420, display: "flex", gap: 28}}>{lines.slice(0, 3).map((text, index) => <jc.Chip key={`${text}-${index}`} icon={index === 0 ? <Sparkles size={32} /> : index === 1 ? <Flame size={32} /> : <Check size={32} />} accent={color(index === 0 ? "blue" : index === 1 ? "red" : "green")} outlined={index === 1} segments={[{t: text}]} enterAt={index * 10} />)}</div>;
    case "CloneCascade":
      return <div style={{position: "absolute", left: 260, top: 405}}><jc.CloneCascade icon={<Star size={46} />} label={content.subtext || headline} cloneCount={4} warnText={body} accent={color("red")} enterAt={0} /></div>;
    case "CompareCard":
      return <div style={{position: "absolute", left: 390, top: 240}}><jc.CompareCard width={900} items={lines.slice(0, 3).map((name, index) => ({logo: index === 0 ? <Bot size={38} /> : index === 1 ? <Wand2 size={38} /> : <Code2 size={38} />, name, weak: index === 0 ? lineAt(content, 1) : body, strong: index === 0 ? body : lineAt(content, index - 1), strongColor: color(index === 0 ? "green" : index === 1 ? "blue" : "yellow")}))} /></div>;
    case "CurveOverlay": {
      const curveColor = color("blue");
      return <div style={{position: "absolute", left: 260, top: 250}}><jc.CurveOverlay width={1120} height={520} color={curveColor} strokeWidth={10} enterAt={0} /><div style={{color: COLOR[curveColor], fontSize: 44, fontWeight: 900, marginTop: -98}}>{metric.label || headline}</div></div>;
    }
    case "DMCardStack":
      return <div style={{position: "absolute", left: 420, top: 235}}><jc.DMCardStack cards={lines.slice(0, 3).map((text, index) => ({chip: {text: index === 0 ? content.category : index === 1 ? "SIGNAL" : "RESULT", color: color(index === 0 ? "blue" : index === 1 ? "yellow" : "green")}, text, width: 640 - index * 40}))} /></div>;
    case "FlowChain":
      return <div style={{position: "absolute", left: 260, top: 360}}><jc.FlowChain nodeWidth={230} nodes={lines.slice(0, 3).map((text, index) => ({icon: index === 0 ? <Bot size={46} /> : index === 1 ? <GitBranch size={46} /> : <Package size={46} />, lines: [text], accent: color(index === 0 ? "blue" : index === 1 ? "yellow" : "green")}))} /></div>;
    case "Flywheel":
      return <div style={{position: "absolute", left: 680, top: 250}}><jc.Flywheel size={430} color={color("green")} icon={<Zap size={88} />} /></div>;
    case "HeroText":
      return <jc.HeroText kicker={[{t: content.category.toLowerCase(), color: color("blue")}, {t: " system"}]} segments={[{t: headline, color: color("yellow")}]} zhSub={body} echo="motion card hero" top={270} enterAt={8} />;
    case "InfoCard":
      return <div style={{position: "absolute", left: 520, top: 380}}><jc.InfoCard icon={<Lightbulb size={56} />} en={content.category} zh={body} accent={color("yellow")} enterAt={0} /></div>;
    case "InfoScrim":
      return <><jc.InfoScrim strength={0.9} side="right" /><jc.HeroText kicker="SCRIM" segments={[{t: headline, color: color("blue")}]} top={330} enterAt={0} /></>;
    case "LoopDiagram":
      return <div style={{position: "absolute", left: 620, top: 235}}><jc.LoopDiagram size={500} color={color("blue")} labels={lines.slice(0, 4)} /></div>;
    case "MatrixIcon":
      return <div style={{position: "absolute", left: 670, top: 260}}><jc.MatrixIcon color={color("yellow")} rows={5} cols={5} cell={58} gap={12} icon={<Scale size={92} />} /></div>;
    case "NamePlate":
      return <div style={{position: "absolute", left: 570, top: 400}}><jc.NamePlate name={headline} slug={content.category} avatarText={headline.charAt(0) || "J"} enterAt={0} /></div>;
    case "PersonBadge":
      return <div style={{position: "absolute", left: 570, top: 400}}><jc.PersonBadge avatarSrc={avatarSrc} name={headline} zhSub={body} accent={color("blue")} enterAt={0} /></div>;
    case "PersonCard":
      return <div style={{position: "absolute", left: 360, top: 330}}><jc.PersonCard name={headline} zhRole={body} avatarText={headline.charAt(0) || "J"} orgChip={{text: content.category, color: color("green")}} kickerNote="SANDBOXED" enterAt={0} /></div>;
    case "PhoneMockup":
      return <div style={{position: "absolute", left: 720, top: 95}}><jc.PhoneMockup width={340} glow="purple" scrollTo={-170} scrollStart={20}><div style={{minHeight: 930, padding: "78px 30px 30px", background: "#f3f4f6", color: "#111827", fontSize: 28, lineHeight: 1.55}}><b>{headline}</b><br />{lines.slice(0, 4).map((text, index) => <React.Fragment key={`${text}-${index}`}>{index + 1}. {text}<br /></React.Fragment>)}<br />{body}</div></jc.PhoneMockup></div>;
    case "QuoteDoc":
      return <div style={{position: "absolute", left: 360, top: 190}}><jc.QuoteDoc width={960} source={content.category} title={headline} zhNote={body} zhNoteYPct={60} blocks={lines.slice(0, 3).map((text, index) => ({t: text, heading: index === 0, hl: index === 2}))} highlightAt={18} noteAt={28} /></div>;
    case "ScoreBoard":
      return <div style={{position: "absolute", left: 500, top: 250}}><jc.ScoreBoard rows={lines.slice(0, 3).map((text, index) => ({enKicker: content.category, zhLabel: text, left: Math.max(4, metric.value - index * 8), right: Math.max(1, metric.value - 13 - index * 8), note: index === 0 ? body : undefined}))} enterAt={0} /></div>;
    case "ShotCard":
      return <div style={{position: "absolute", left: 400, top: 230}}><jc.ShotCard width={920} radius={26} glow="purple" highlight={{xPct: 12, yPct: 33, wPct: 62, hPct: 18}} zhBar={{text: body}} enterAt={0}><div style={{background: "#fff", padding: 52, color: "#111827", minHeight: 430, lineHeight: 1.45}}><div style={{fontSize: 48, fontWeight: 900}}>{headline}</div><div style={{marginTop: 32, fontSize: 30}}>{body}</div><div style={{marginTop: 28, fontSize: 30, color: "#475467"}}>{lineAt(content, 0)}</div></div></jc.ShotCard></div>;
    case "SideLabel":
      return <jc.SideLabel color={color("blue")} en={content.category} zh={headline} sub={body} icon={<Sparkles size={28} />} variant="title" />;
    case "SolventTank":
      return <div style={{position: "absolute", left: 610, top: 160}}><jc.SolventTank enterAt={0} pourAt={12} dissolveAt={45} resistAt={75} /></div>;
    case "Stamp":
      return <div style={{position: "absolute", left: 650, top: 360}}><jc.Stamp text={headline} color={color("green")} fontSize={110} icon={<Check size={92} />} enSub={content.category} enterAt={0} /></div>;
    case "StepList":
      return <div style={{position: "absolute", left: 430, top: 270}}><jc.StepList accent={color("blue")} steps={lines.slice(0, 3).map((text, index) => ({icon: index === 0 ? <FileText size={30} /> : index === 1 ? <Flame size={30} /> : <Wand2 size={30} />, text}))} /></div>;
    case "TimelineCard":
      return <div style={{position: "absolute", left: 630, top: 250}}><jc.TimelineCard width={520} title={content.category} subtitle={headline} enterAt={0} nodes={lines.slice(0, 3).map((label, index) => ({date: index < 9 ? "0" + String(index + 1) : String(index + 1), label, color: color(index === 0 ? "blue" : index === 1 ? "yellow" : "green"), icon: index === 0 ? <FileText size={20} /> : index === 1 ? <Flame size={20} /> : <Play size={20} />}))} /></div>;
    case "TimelineEvents":
      return <div style={{position: "absolute", left: 300, top: 430}}><jc.TimelineEvents width={1080} events={lines.slice(0, 3).map((title, index) => ({xPct: [5, 47, 86][index] ?? 86, title, sub: index === 0 ? body : "", chip: {text: index === 0 ? "OPEN" : index === 1 ? "PAYOFF" : "DONE", color: color(index === 0 ? "blue" : index === 1 ? "yellow" : "green")}}))} /></div>;
    case "TweetCard":
      return <div style={{position: "absolute", left: 320, top: 210}}><jc.TweetCard name={content.category} zhIdentity={body} avatarText={content.category.charAt(0) || "J"} headlineTop={content.category} headlineMain={headline} headlineColor={color("red")} zhSub={body} headlineSub="BY MOTION CARDS" chips={lines.slice(0, 2).map((text, index) => ({text, color: color(index === 0 ? "blue" : "yellow")}))} /></div>;
    case "UnitMatrix":
      return <div style={{position: "absolute", left: 390, top: 300}}><jc.UnitMatrix groups={2} rows={6} cols={10} color={color("green")} cell={44} gap={9} fillRatio={Math.max(0.01, Math.min(1, metric.value / 100))} enterAt={0} /></div>;
    case "VerdictBox":
      return <><jc.VerdictBox color={color("red")} side="left" headerZh={headline} headerEn="DROP" headerIcon={<X size={28} />} boxEnterAt={0} top={360} chips={lines.slice(0, 2).map((label, index) => ({icon: <X size={34} />, label, revealAt: 12 + index * 10}))} /><jc.VerdictBox color={color("green")} side="right" headerZh={body} headerEn="KEEP" headerIcon={<Check size={28} />} boxEnterAt={8} top={360} chips={lines.slice(0, 2).map((label, index) => ({icon: <Check size={34} />, label, revealAt: 20 + index * 10}))} /></>;
    case "ViewsBadge":
      return <div style={{position: "absolute", left: 650, top: 420}}><jc.ViewsBadge from={0} to={metric.value} unit={metric.unit || "M+"} label={metric.label || content.category} enterAt={0} /></div>;
    case "WindowCard":
      return <div style={{position: "absolute", left: 450, top: 250}}><jc.WindowCard title={headline} icon={<TerminalSquare size={34} />} width={820} height={430} chip={{text: content.category, color: color("blue")}}><div style={{color: "#F8FAFC", fontSize: 30, lineHeight: 1.7, fontFamily: FONT.en}}>{lines.slice(0, 4).map((text, index) => <React.Fragment key={`${text}-${index}`}>entry: {text}<br /></React.Fragment>)}status: {body}</div></jc.WindowCard></div>;
    default:
      return null;
  }
};