"use strict";

const MULTI_ITEM_LAYOUTS = new Set([
  "ordered-sequence", "diagonal-chips", "floating-chips", "closing-checklist",
  "checklist-editorial", "photo-wall", "platform-shift-line", "recovery-progress-bars",
  "briefing-poster", "rewind-milestones", "tradeoff-reject-round", "reject-list",
  "check-progress", "event-timeline", "route-map", "org-chart"
]);
const NARRATIVE_BODY_LAYOUTS = new Set(["clipboard-note"]);
const LIST_KEYS = ["items", "steps", "chips", "milestones", "years", "values", "badges", "specList"];
const TEMPLATE_DEFAULTS = new Set([
  "核心判断", "核心价值", "产品路径", "下一步行动", "阶段观察",
  "LIVE SIGNALS", "APPLE SILICON", "M-SERIES POWER", "PRO WORKFLOW"
]);
const ENGLISH_TRAILING_WORDS = new Set(["and", "of", "to", "with", "for", "in", "on", "at", "from", "by"]);
const ENGLISH_SMALL_WORDS = new Set(["and", "or", "nor", "but", "a", "an", "the", "as", "at", "by", "for", "in", "of", "on", "per", "to", "via", "with"]);

const text = (value) => typeof value === "string" ? value.trim() : "";
const words = (value) => text(value).split(/\s+/).filter(Boolean);
const isEnglish = (project, beat) => /^(en|eng)(-|_|$)/i.test(String(project.language || beat.language || ""));
const firstText = (...values) => values.map(text).find(Boolean) || "";
const hasWhisperMarker = (value) => /\[(?:music|inaudible|silence|speaker[^\]]*)\]|<\|[^|]+\|>|\b(?:um|uh)\b/i.test(value);
const isTemplateDefault = (value) => TEMPLATE_DEFAULTS.has(text(value).toUpperCase()) || /^\{\{.+\}\}$/.test(text(value));
const cjkCharacters = (value) => (text(value).match(/[\u3400-\u9fff]/g) || []).length;
const latinTokens = (value) => text(value).match(/[A-Za-z]+[A-Za-z0-9-]*|\d+[A-Za-z0-9-]*/g) || [];
function hasValidChineseOrMixedHeadline(value) {
  const cjkCount = cjkCharacters(value);
  const productTokens = latinTokens(value);
  if (productTokens.length) return cjkCount >= 2 && cjkCount <= 15 && productTokens.length <= 4;
  return cjkCount >= 4 && cjkCount <= 15;
}


function getLayerProps(beat, layer) {
  const legacy = layer && layer.effectProps && typeof layer.effectProps === "object" ? layer.effectProps : {};
  const payload = layer && layer.payload && typeof layer.payload === "object" ? layer.payload : {};
  if (Object.keys(payload).length) return {...legacy, ...payload};
  return Object.keys(legacy).length ? legacy : beat.effectProps || {};
}

function getHeadline(beat) {
  const props = beat.effectProps || {};
  return firstText(beat.headline, props.headline, beat.subtitle, props.title);
}

function getEffectText(beat) {
  const props = beat.effectProps || {};
  return firstText(beat.effectText, beat.effectZh, props.effectText, props.effectZh, props.body, beat.zh, beat.en);
}

function getItemList(props) {
  for (const key of LIST_KEYS) {
    if (Array.isArray(props && props[key])) return props[key];
  }
  return null;
}

function titleCaseIsValid(value) {
  return words(value).every((word, index) => {
    const normalized = word.replace(/^[^A-Za-z0-9]+/, "");
    if (!normalized) return true;
    const lower = normalized.toLowerCase();
    if (index > 0 && ENGLISH_SMALL_WORDS.has(lower)) return normalized === lower;
    return /^[A-Z0-9]/.test(normalized);
  });
}

function layerEndSeconds(commonProps, beatDuration) {
  const start = Math.max(0, Number(commonProps && commonProps.enterOffset) || 0);
  const duration = Number(commonProps && commonProps.duration);
  if (Number.isFinite(duration) && duration > 0) return start + duration;
  const exitOffset = Math.max(0, Number(commonProps && commonProps.exitOffset) || 0);
  return Math.max(start, beatDuration - exitOffset);
}

function error(code, message, details) {
  return {code, message, details: details || null};
}

function validateBeatIntegrity(beat, project = {}) {
  const errors = [];
  const headline = getHeadline(beat);
  const effectText = getEffectText(beat);
  const english = isEnglish(project, beat);
  const start = Number(beat.start);
  const end = Number(beat.end);
  const beatDuration = end - start;
  const layers = Array.isArray(beat.layers) && beat.layers.length ? beat.layers : [{layout: beat.layout, effectProps: beat.effectProps || {}, commonProps: beat.commonProps || {}}];

  if (!headline) errors.push(error("headline-missing", "缺少核心大标题，无法开始渲染。"));
  if (!effectText) errors.push(error("effect-copy-missing", "缺少效果文案，无法开始渲染。"));
  if (headline && effectText && headline === effectText) errors.push(error("copy-duplicate", "核心大标题与效果文案完全相同，请重新提炼为不同层级。"));
  if (hasWhisperMarker(headline) || hasWhisperMarker(effectText)) errors.push(error("whisper-marker", "文案中仍含有 Whisper 占位符或转录标记。"));

  if (english && headline) {
    const headlineWords = words(headline);
    if (headlineWords.length < 3 || headlineWords.length > 6) errors.push(error("headline-en-length", "英文核心大标题必须为 3 至 6 个单词。"));
    if (ENGLISH_TRAILING_WORDS.has(headlineWords.at(-1)?.toLowerCase())) errors.push(error("headline-en-ending", "英文核心大标题不能以连词或介词结尾。"));
    if (!titleCaseIsValid(headline)) errors.push(error("headline-en-title-case", "英文核心大标题应使用 Title Case。"));
  }
  if (!english && headline) {
    if (!hasValidChineseOrMixedHeadline(headline)) errors.push(error("headline-zh-length", "中文核心大标题必须为 4 至 15 个字；含英文产品名时需至少 2 个中文字符和 1 至 4 个英文产品词。", {cjkCharacters: cjkCharacters(headline), latinTokens: latinTokens(headline).length}));
    if (/[，,、:：;；]$/.test(headline)) errors.push(error("headline-zh-ending", "中文核心大标题不能以未闭合标点结尾。"));
  }

  const isAbsorbedTerminalTail = Boolean(beat?.terminalTailAbsorbed) && Array.isArray(project?.beats) && project.beats.at(-1)?.id === beat.id;
  const maxBeatDuration = isAbsorbedTerminalTail ? 38 : 35;
  if (!Number.isFinite(beatDuration) || beatDuration < 18 || beatDuration > maxBeatDuration) errors.push(error("beat-duration", isAbsorbedTerminalTail ? "合并末尾短段后的最后一拍必须位于 18 至 38 秒。" : "单拍时长必须位于 18 至 35 秒的语义安全区间。", {duration: beatDuration, maxDuration: maxBeatDuration}));

  let previousEnd = null;
  for (let index = 0; index < layers.length; index += 1) {
    const layer = layers[index] || {};
    const props = getLayerProps(beat, layer);
    const layout = layer.layout || beat.layout || "unknown";
    const values = getItemList(props);
    if (MULTI_ITEM_LAYOUTS.has(layout)) {
      const realItems = Array.isArray(values) ? values.filter((value) => text(value) && !isTemplateDefault(value)) : [];
      if (!realItems.length) errors.push(error("component-items", "组件 “" + layout + "” 至少需要一项真实且非空的内容。", {layerIndex: index, layout}));
    } else if (NARRATIVE_BODY_LAYOUTS.has(layout)) {
      const bodyText = firstText(props.bodyText, props.body, props.text, props.effectText, layer.effectText, beat.effectText, beat.zh, beat.en);
      if (!bodyText || isTemplateDefault(bodyText)) errors.push(error("component-body", "组件 “" + layout + "” 需要一段真实且非空的正文内容。", {layerIndex: index, layout}));
    } else if (Array.isArray(values) && values.some((value) => !text(value) || isTemplateDefault(value))) {
      errors.push(error("component-template", "组件 “" + layout + "” 含有空项或未替换的模板默认值。", {layerIndex: index, layout}));
    }
    const commonProps = layer.commonProps || {};
    const enter = Math.max(0, Number(commonProps.enterOffset) || 0);
    const layerEnd = layerEndSeconds(commonProps, beatDuration);
    if (enter >= beatDuration || layerEnd > beatDuration + 0.01) errors.push(error("layer-timing", "组件 “" + layout + "” 的进退场时间超出当前 Beat 范围。", {layerIndex: index, enter, layerEnd, beatDuration}));
    if (previousEnd !== null && previousEnd > enter + 0.01) errors.push(error("layer-handoff", "双图层交接倒挂：上一层尚未退出，下一层已进入。", {layerIndex: index, previousEnd, enter}));
    previousEnd = layerEnd;
  }

  return {valid: errors.length === 0, isEn: english, headline, effectText, errors};
}

function shouldAbortForStall({now, lastProgressAt, previousCpuSeconds, currentCpuSeconds, stallMs = 30000}) {
  if (Number(now) - Number(lastProgressAt) < stallMs) return false;
  if (!Number.isFinite(previousCpuSeconds) || !Number.isFinite(currentCpuSeconds)) return false;
  return currentCpuSeconds - previousCpuSeconds < 0.05;
}

function diagnoseRenderFailure(output) {
  const value = String(output || "").toLowerCase();
  if (/out of memory|heap|allocation failed|insufficient memory|memory limit/.test(value)) return "系统内存不足";
  if (/timeout|stalled|no frame progress/.test(value)) return "Remotion 渲染进程无帧输出，已自动终止";
  return "组件动画异常或 Chromium 渲染异常";
}

module.exports = {validateBeatIntegrity, shouldAbortForStall, diagnoseRenderFailure};

