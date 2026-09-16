import type {BaseComponentProps, ComponentContentPayload} from "./types";

type RecordValue = Record<string, unknown>;
const stringValue = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const rows = (value: unknown) => Array.isArray(value) ? value.map((item) => stringValue(item)).filter((item) => item.trim()) : [];
const numbers = (value: unknown) => Array.isArray(value) ? value.map((item) => Number(item)).filter(Number.isFinite) : [];
const isPayload = (value: unknown): value is ComponentContentPayload => !!value && typeof value === "object" && ["narrative", "chips", "metrics", "steps"].indexOf(String((value as RecordValue).type)) >= 0;
const cloneValue = (value: unknown): unknown => Array.isArray(value) ? value.map(cloneValue) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value as RecordValue).map(([key, item]) => [key, cloneValue(item)])) : value;
const deepMerge = (base: unknown, next: unknown): unknown => { if (Array.isArray(base)) { if (!Array.isArray(next) || next.length === 0) return cloneValue(base); return next.map((item, index) => deepMerge(base[index] ?? base[0] ?? {}, item)); } if (base && typeof base === "object" && !Array.isArray(base)) { const source = next && typeof next === "object" && !Array.isArray(next) ? next as RecordValue : {}; const merged: RecordValue = {}; for (const key of Object.keys(base as RecordValue)) merged[key] = deepMerge((base as RecordValue)[key], source[key]); for (const [key, value] of Object.entries(source)) if (!(key in merged)) merged[key] = cloneValue(value); return merged; } return next === undefined || next === null ? cloneValue(base) : next; };
const hydratePayload = (payload: unknown, fallback: unknown): unknown => isPayload(payload) && isPayload(fallback) && payload.type === fallback.type ? deepMerge(fallback, payload) : isPayload(payload) ? payload : isPayload(fallback) ? fallback : payload;

const chipItems = (payload: RecordValue, source: RecordValue) => {
  const tagged = rows(source.tags);
  const sourceItems = Array.isArray(payload.items) ? payload.items : tagged.map((title) => ({title, subtitle: ""}));
  return sourceItems.map((item) => ({title: stringValue(item?.title), subtitle: typeof item?.subtitle === "string" ? item.subtitle : ""}));
};

export const normalizeComponentContent = (source: RecordValue | undefined): BaseComponentProps => {
  const input = source ?? {};
  const projectLayer = input.__projectLayer === true;
  const category = stringValue(input.category, stringValue(input.eyebrow, stringValue(input.categoryTag, projectLayer ? "" : "DESIGN SYSTEM")));
  const headline = stringValue(input.headline, stringValue(input.title, projectLayer ? "" : "核心设计信号"));
  const payload = hydratePayload(input.contentPayload, input.defaultPayload);
  if (isPayload(payload)) {
    if (payload.type === "narrative") return {category, headline, contentPayload: {type: "narrative", bodyText: stringValue(payload.bodyText, stringValue(input.bullText, stringValue(input.body, stringValue(input.effectText, stringValue(input.text, projectLayer ? "" : "展示可编辑的真实组件预设"))))), ...(typeof payload.bearText === "string" || stringValue(input.bearText) ? {bearText: typeof payload.bearText === "string" ? payload.bearText : stringValue(input.bearText)} : {}), ...(typeof payload.highlightQuote === "string" || stringValue(input.highlightQuote) ? {highlightQuote: typeof payload.highlightQuote === "string" ? payload.highlightQuote : stringValue(input.highlightQuote)} : {})}};
    if (payload.type === "chips") return {category, headline, contentPayload: {type: "chips", items: chipItems(payload as unknown as RecordValue, input)}};
    if (payload.type === "metrics") return {category, headline, contentPayload: {type: "metrics", value: payload.value ?? input.value ?? input.progress ?? (projectLayer ? "" : 71), unit: stringValue(payload.unit), label: stringValue(payload.label, stringValue(input.label, stringValue(input.metric, projectLayer ? "" : "关键指标"))), ...(typeof payload.bodyText === "string" || typeof input.bodyText === "string" || typeof input.unit === "string" ? {bodyText: stringValue(payload.bodyText, stringValue(input.bodyText, stringValue(input.unit)))} : {}), ...(typeof payload.detailText === "string" || typeof input.detailText === "string" || typeof input.body === "string" || typeof input.effectText === "string" ? {detailText: stringValue(payload.detailText, stringValue(input.detailText, stringValue(input.body, stringValue(input.effectText))))} : {})}};
    return {category, headline, contentPayload: {type: "steps", steps: (Array.isArray(payload.steps) ? payload.steps : []).map((item, index) => ({stepNumber: Number(item?.stepNumber) || index + 1, text: stringValue(item?.text)})), ...(Number.isFinite(Number(payload.progress)) ? {progress: Number(payload.progress)} : {}), ...(typeof payload.bodyText === "string" ? {bodyText: payload.bodyText} : {})}};
  }
  const list = rows(input.steps).length ? rows(input.steps) : rows(input.items).length ? rows(input.items) : rows(input.tags).length ? rows(input.tags) : rows(input.years).length ? rows(input.years) : rows(input.nodes).length ? rows(input.nodes) : rows(input.units);
  return {category, headline, contentPayload: list.length ? {type: "steps", steps: list.map((text, index) => ({stepNumber: index + 1, text}))} : {type: "narrative", bodyText: stringValue(input.body, stringValue(input.effectText, stringValue(input.text, "展示可编辑的真实组件预设")))} };
};

export const toRendererContentProps = (source: RecordValue | undefined): RecordValue => {
  const normalized = normalizeComponentContent(source);
  const base: RecordValue = {category: normalized.category, eyebrow: normalized.category, categoryTag: normalized.category, headline: normalized.headline, title: normalized.headline};
  const payload = normalized.contentPayload;
  if (payload.type === "narrative") return {...base, body: payload.bodyText, effectText: payload.bodyText, effectZh: payload.bodyText, text: payload.bodyText, bullText: payload.bodyText, bearText: payload.bearText, highlightQuote: payload.highlightQuote};
  if (payload.type === "chips") { const values = payload.items.map((item) => item.title); const subtitles = payload.items.map((item) => typeof item.subtitle === "string" ? item.subtitle : ""); return {...base, tags: values, items: values, steps: values, comments: values, itemSubtitles: subtitles, subLabels: subtitles, subLabel: subtitles.find((value) => value.trim()) || ""}; }
  if (payload.type === "metrics") { const list = rows(source?.items).length ? rows(source?.items) : rows(source?.steps); const numeric = Number(payload.value); const bodyText = stringValue(payload.bodyText, stringValue(payload.unit, normalized.headline)); const detailText = stringValue(payload.detailText, stringValue(source?.summary, stringValue(source?.body, stringValue(source?.effectText, source?.__projectLayer === true ? "" : "展示可编辑的真实组件预设")))); return {...base, value: payload.value, progress: payload.value, count: payload.value, values: list.length && Number.isFinite(numeric) ? list.map(()=>numeric) : numbers(source?.values), metric: payload.label, label: payload.label, metricLabel: payload.label, unit: payload.unit, marketLabel: stringValue(source?.marketLabel, payload.label), marketTo: source?.marketTo ?? payload.value, marketSuffix: stringValue(source?.marketSuffix, payload.unit), engineeringLabel: stringValue(source?.engineeringLabel, source?.__projectLayer === true ? "" : "增长指标"), engineeringTo: source?.engineeringTo ?? source?.value2 ?? payload.value, engineeringSuffix: stringValue(source?.engineeringSuffix, payload.unit), bodyText, detailText, summary: detailText, body: detailText, effectText: detailText, effectZh: detailText, startLabel: stringValue(source?.startLabel, "起点"), endLabel: stringValue(source?.endLabel, "目标阶段"), items: list, steps: list, comments: list}; }
  const values = payload.steps.map((item) => item.text); const bodyText = typeof payload.bodyText === "string" ? payload.bodyText : stringValue(source?.body, stringValue(source?.effectText, stringValue(source?.text))); return {...base, steps: values, items: values, years: values, nodes: values, units: values, comments: values, label: stringValue(source?.label, normalized.category), title: stringValue(source?.title, normalized.headline), body: bodyText, bodyText, effectText: bodyText, effectZh: bodyText, text: bodyText, ...(typeof payload.progress === "number" ? {progress: payload.progress, value: payload.progress, values: values.map(()=>payload.progress)} : {values: numbers(source?.values)})};
};


