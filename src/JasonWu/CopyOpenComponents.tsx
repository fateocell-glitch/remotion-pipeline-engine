import React from "react";
import type {LayoutEffectProps} from "./DemoEffectComponents";
import {HeroTitle} from "./copyopen/HeroTitle";
import {ProgressBar} from "./copyopen/ProgressBar";
import {ComparisonCard} from "./copyopen/ComparisonCard";
import {TerminalScene, type TerminalStep} from "./copyopen/TerminalScene";
import {EndTag} from "./copyopen/EndTag";
import {BarChart} from "./copyopen/charts/BarChart";
import {LineChart} from "./copyopen/charts/LineChart";
import {PieChart} from "./copyopen/charts/PieChart";
import {KPIGrid} from "./copyopen/charts/KPIGrid";

const TEXT = "#F8FAFC";
const BLUE = "#22D3EE";
const GREEN = "#10B981";
const PURPLE = "#A78BFA";
const DARK = "#07111f";
const CARD = "#0F172A";
const GRID = "#334155";

const str = (props: Record<string, unknown> | undefined, keys: string[], fallback: string) => {
  for (const key of keys) {
    const value = props?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
};
const num = (props: Record<string, unknown> | undefined, keys: string[], fallback: number) => {
  for (const key of keys) {
    const value = Number(props?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
};
const list = (props: Record<string, unknown> | undefined, keys: string[], fallback: string[]) => {
  for (const key of keys) {
    const value = props?.[key];
    if (Array.isArray(value)) {
      const rows = value.map((item) => String(item ?? "").trim()).filter(Boolean);
      if (rows.length) return rows;
    }
  }
  return fallback;
};
const values = (props: Record<string, unknown> | undefined, fallback: number[]) => {
  const raw = props?.values;
  if (Array.isArray(raw)) {
    const nums = raw.map(Number).filter(Number.isFinite);
    if (nums.length) return nums;
  }
  return fallback;
};
const chartData = (props: Record<string, unknown> | undefined, fallbackLabels: string[], fallbackValues: number[]) => {
  const labels = list(props, ["items", "steps", "nodes"], fallbackLabels);
  const nums = values(props, fallbackValues);
  return labels.slice(0, Math.max(labels.length, nums.length)).map((label, index) => ({label: label || fallbackLabels[index % fallbackLabels.length], value: nums[index] ?? fallbackValues[index % fallbackValues.length]}));
};

export const CopyOpenHeroTitle: React.FC<LayoutEffectProps> = ({cue, props}) => (
  <HeroTitle title={str(props, ["body", "bodyText", "effectText", "text"], cue.section.subtitle)} subtitle={str(props, ["highlightQuote", "subtitle", "subLabel"], "")} accentColor={BLUE} textColor={TEXT} subtitleColor={PURPLE} scrimBackground="transparent" />
);

export const CopyOpenProgressBar: React.FC<LayoutEffectProps> = ({cue, props}) => (
  <ProgressBar progress={num(props, ["progress", "value", "marketTo"], 76)} label={str(props, ["label", "bodyText", "body", "effectText", "metricLabel"], cue.section.subtitle)} backgroundColor="transparent" trackColor="#1E293B" textColor={TEXT} color={GREEN} animationStyle="pulse" />
);

export const CopyOpenComparisonCard: React.FC<LayoutEffectProps> = ({cue, props}) => (
  <ComparisonCard title={str(props, ["headline", "title"], cue.section.subtitle)} leftLabel={str(props, ["leftLabel", "marketLabel"], "Long video")} rightLabel={str(props, ["rightLabel", "engineeringLabel"], "Short clips")} leftValue={str(props, ["leftValue"], String(num(props, ["from"], 58)))} rightValue={str(props, ["rightValue"], String(num(props, ["to", "value", "progress"], 8)))} backgroundColor="transparent" cardBackgroundColor={CARD} textColor={TEXT} leftColor="#F59E0B" rightColor={GREEN} changeIndicator={str(props, ["body", "effectText"], "ready")} changeDirection="up" />
);

export const CopyOpenTerminalScene: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const rows = list(props, ["steps", "items"], ["openmontage clip input.mp4", "transcribing audio...", "ranking highlight candidates...", "8 clips ready", "remotion render JcMotionCards", "done -> out/shorts"]);
  const steps: TerminalStep[] = rows.map((text, index) => index % 3 === 0 ? {kind: "cmd", text, typeSpeed: 0.025} : index % 3 === 2 ? {kind: "pill", text, color: GREEN} : {kind: "out", text});
  return <TerminalScene title={str(props, ["headline", "title"], cue.section.subtitle)} backgroundColor="transparent" accentColor={GREEN} steps={steps} />;
};

export const CopyOpenEndTag: React.FC<LayoutEffectProps> = ({cue, props}) => (
  <EndTag text={str(props, ["body", "effectText", "headline", "title"], cue.section.subtitle)} palette="cool_offwhite_on_black" fadeInSeconds={0.5} holdSeconds={3.2} fadeOutSeconds={0.5} overlay />
);

export const CopyOpenBarChart: React.FC<LayoutEffectProps> = ({cue, props}) => (
  <BarChart title={str(props, ["headline", "title"], cue.section.subtitle)} backgroundColor="transparent" textColor={TEXT} gridColor={GRID} animationStyle="pop" data={chartData(props, ["Hook", "Value", "Pace", "Share"], [94, 82, 76, 69])} />
);

export const CopyOpenLineChart: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const data = chartData(props, ["0", "10", "20", "30"], [100, 91, 86, 78]);
  return <LineChart title={str(props, ["headline", "title"], cue.section.subtitle)} backgroundColor="transparent" textColor={TEXT} gridColor={GRID} xLabel="seconds" yLabel="watch" series={[{label: str(props, ["label", "metricLabel"], "trend"), color: BLUE, data: data.map((item, index) => ({x: Number(item.label) || index * 10, y: item.value}))}]} />;
};

export const CopyOpenPieChart: React.FC<LayoutEffectProps> = ({cue, props}) => (
  <PieChart title={str(props, ["headline", "title"], cue.section.subtitle)} backgroundColor="transparent" textColor={TEXT} donut animationStyle="sequential" data={chartData(props, ["Hook", "Proof", "Story", "CTA"], [35, 30, 20, 15]).map((item, index) => ({...item, color: [BLUE, GREEN, "#F59E0B", PURPLE][index % 4]}))} />
);

export const CopyOpenKPIGrid: React.FC<LayoutEffectProps> = ({cue, props}) => {
  const data = chartData(props, ["clips", "avg score", "minutes saved"], [8, 86, 74]).slice(0, 6);
  return <KPIGrid title={str(props, ["headline", "title"], cue.section.subtitle)} backgroundColor="transparent" cardBackgroundColor={CARD} textColor={TEXT} columns={Math.min(3, Math.max(2, data.length)) as 2 | 3} animationStyle="cascade" metrics={data.map((item, index) => ({label: item.label, value: item.value, suffix: index === 1 ? "%" : undefined, change: [12.4, 5.2, 18.1][index % 3]}))} />;
};
