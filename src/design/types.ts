export type NarrativeContentPayload = {type: "narrative"; bodyText: string; bearText?: string; highlightQuote?: string};
export type ChipsContentPayload = {type: "chips"; items: Array<{title: string; subtitle?: string}>};
export type MetricsContentPayload = {type: "metrics"; value: number | string; unit?: string; label: string; bodyText?: string; detailText?: string};
export type StepsContentPayload = {type: "steps"; steps: Array<{stepNumber: number; text: string}>; progress?: number; bodyText?: string};
export type ComponentContentPayload = NarrativeContentPayload | ChipsContentPayload | MetricsContentPayload | StepsContentPayload;

export interface BaseComponentProps {
  category: string;
  headline: string;
  contentPayload: ComponentContentPayload;
}


