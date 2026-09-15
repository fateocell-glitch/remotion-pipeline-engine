import React, {type ComponentType} from "react";
import registryJson from "../design/components.registry.json";
import {MotionWrapper} from "./components/common/MotionWrapper";
import {JcNativeStageBackdrop, renderJcNativeRecipe} from "./JcNativeRecipes";
import type {LayoutEffectProps} from "./DemoEffectComponents";
import type {LayoutDef} from "./layoutRegistry";
import type {JasonWuCue, SemanticAccent} from "./timeline";

type RecordValue = Record<string, unknown>;
type RuntimeEntry = {
  id: string;
  name: string;
  description: string;
  family: string;
  manifest?: {
    id: string;
    intent: "narrative" | "metrics" | "process" | "contrast" | "system";
    capacity: {minItems: number; maxItems: number};
    keywords: string[];
    visualWeight: "heavy" | "medium" | "light";
  };
  runtime?: {exportName?: string};
};
type JcMotion = {
  commonProps?: RecordValue;
  designTokens?: RecordValue;
  beatDuration?: number;
  entranceDurationSeconds?: number;
  accent?: SemanticAccent;
};

const semanticAccents = new Set<SemanticAccent>(["blue", "green", "yellow", "red"]);
const accentOf = (value: unknown): SemanticAccent => semanticAccents.has(value as SemanticAccent) ? value as SemanticAccent : "blue";
const entryById = new Map((registryJson.components as RuntimeEntry[]).filter((entry) => entry.id.startsWith("jc-")).map((entry) => [entry.id, entry]));

const JcEffectAdapter: React.FC<{cue: JasonWuCue; props: RecordValue}> = ({cue, props}) => {
  const entry = entryById.get(String(props.__jcLayoutId ?? cue.layout));
  const exportName = entry?.runtime?.exportName;
  const motion = (props.__jcMotion ?? {}) as JcMotion;
  if (!exportName) return null;

  const recipe = renderJcNativeRecipe(exportName, props);
  if (!recipe) return null;
  const stage = props.__jcStageBackdropProvided === true ? recipe : <JcNativeStageBackdrop>{recipe}</JcNativeStageBackdrop>;

  return (
    <MotionWrapper
      commonProps={motion.commonProps as never}
      designTokens={(motion.designTokens ?? props.designTokens) as never}
      beatDuration={motion.beatDuration ?? Math.max(1, cue.end - cue.start)}
      entranceDurationSeconds={motion.entranceDurationSeconds ?? 2.2}
      accent={accentOf(motion.accent ?? props.accent)}
      preserveNativeMotion
    >
      {stage}
    </MotionWrapper>
  );
};

const categoryFor = (intent: NonNullable<RuntimeEntry["manifest"]>["intent"]): LayoutDef["meta"]["category"] =>
  intent === "metrics" ? "data" : intent === "narrative" || intent === "contrast" ? "story" : intent === "process" ? "interactive" : "data";

export const jcLayoutDefinitions: LayoutDef[] = [...entryById.values()].map((entry) => {
  const manifest = entry.manifest;
  if (!manifest || !entry.runtime?.exportName) {
    throw new Error(`Invalid JC registry entry: ${entry.id}`);
  }
  return {
    key: entry.id as JasonWuCue["layout"],
    component: JcEffectAdapter as ComponentType<LayoutEffectProps>,
    editableFields: [],
    defaultProps: {
      __jcLayoutId: entry.id,
      accent: "blue",
    },
    meta: {
      category: categoryFor(manifest.intent),
      label: entry.name,
      description: entry.description,
    },
    renderLayer: "primary",
    manifest,
    usesInternalMotionWrapper: true,
  };
});