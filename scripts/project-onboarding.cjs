"use strict";

const {generateInitialBeats} = require("./generate-beat-plan.cjs");
const {autoMatchProject} = require("./layout-matcher.cjs");
const {ensureProjectLifecycle} = require("./project-render-assets.cjs");
const {compactEffectCopy} = require("./services/effect-copy.cjs");
const {normalizeSimplifiedChinese} = require("./services/text-analysis.cjs");
const {enforceBeatTextSeparation, enforceHeadlineDiversity, extractBeatContent, matchWindowCaptions} = require("./services/beat-content-extraction.cjs");
const {detectLanguage} = require("./services/language-support.cjs");

const roundSeconds = (milliseconds) => Number((milliseconds / 1000).toFixed(2));

const isCjk = (value) => /[\u3400-\u9fff]/.test(value);
const splitDisplayText = (value) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const limit = isCjk(text) ? 22 : 72;
  const chunks = [];
  let current = "";
  for (const character of text) {
    current += character;
    if (/[，。！？；,;.!?]/.test(character) || current.length >= limit) {
      const chunk = current.trim();
      if (chunk) chunks.push(chunk);
      current = "";
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

function whisperToCaptions(transcript, language = detectLanguage(transcript)) {
  const rows = transcript?.transcription ?? [];
  const splitRows = rows.flatMap((row) => {
    const start = roundSeconds(row?.offsets?.from);
    const end = roundSeconds(row?.offsets?.to);
    const chunks = splitDisplayText(row?.text);
    if (!chunks.length || end <= start) return [];
    const weights = chunks.map((chunk) => Math.max(1, chunk.replace(/[，。！？；,;.!?]/g, "").length));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = start;
    return chunks.map((zh, index) => {
      const next = index === chunks.length - 1 ? end : Number((cursor + (end - start) * weights[index] / totalWeight).toFixed(2));
      const text = language === "en" ? String(zh).replace(/\s+/g, " ").trim() : normalizeSimplifiedChinese(zh);
      const caption = {start: cursor, end: next, zh: text, en: language === "en" ? text : ""};
      cursor = next;
      return caption;
    });
  });
  return splitRows.filter((caption) => caption.zh && caption.end > caption.start).map((caption, index) => ({...caption, id: `subtitle-${String(index + 1).padStart(3, "0")}`}));
}


const hanLength = (value) => String(value ?? "").replace(/[\s，。！？；、,.!?;:\-–—]/g, "").length;
const terminalPunctuation = /[。！？!?]$/;
const commaPunctuation = /[，,；;]$/;
const punctuationOnly = /^[\s，。！？；、,.!?;:]+$/;

function normalizeCaptionRow(caption, index) {
  return {
    ...caption,
    id: String(caption?.id || "subtitle-" + String(index + 1).padStart(3, "0")),
    start: Number(caption?.start),
    end: Number(caption?.end),
    zh: normalizeSimplifiedChinese(caption?.zh ?? caption?.text ?? "").replace(/,/g, "，").replace(/\./g, "。").replace(/!/g, "！").replace(/\?/g, "？").replace(/;/g, "；"),
    en: String(caption?.en || "").trim(),
  };
}

function splitLongCaptionRow(row, targetMin, targetMax, maxDuration) {
  const text = String(row.zh || "");
  const duration = Number(row.end) - Number(row.start);
  if (punctuationOnly.test(text) || (hanLength(text) <= targetMax && duration <= maxDuration)) return [row];
  const suffixes = ["二手市场", "什么程度", "找上门来", "活动现场", "定制贴纸", "制作过程", "这台机器", "生日派对", "自己的品牌", "即时惊喜", "换个场景", "换个用法"];
  const parts = [];
  let rest = text;
  while (hanLength(rest) > targetMax) {
    const chars = Array.from(rest);
    let splitAt = 0;
    for (let index = 1; index < chars.length; index += 1) {
      const candidate = chars.slice(0, index).join("");
      const count = hanLength(candidate);
      if (count >= targetMin && count <= targetMax && suffixes.some((suffix) => candidate.endsWith(suffix))) splitAt = index;
    }
    if (!splitAt) {
      for (let index = 1; index < chars.length; index += 1) {
        const count = hanLength(chars.slice(0, index).join(""));
        if (count <= targetMax) splitAt = index;
      }
    }
    if (splitAt <= 0 || splitAt >= chars.length) break;
    parts.push(chars.slice(0, splitAt).join("").trim());
    rest = chars.slice(splitAt).join("").trim();
  }
  if (rest) parts.push(rest);
  if (parts.length <= 1) return [row];
  const total = parts.reduce((sum, part) => sum + Math.max(1, hanLength(part)), 0);
  let cursor = Number(row.start);
  return parts.map((part, index) => {
    const next = index === parts.length - 1 ? Number(row.end) : Number((cursor + duration * Math.max(1, hanLength(part)) / total).toFixed(2));
    const chunk = {...row, start: cursor, end: next, zh: part};
    cursor = next;
    return chunk;
  });
}
function splitCaptionForRemaining(row, maxAdditional) {
  const text = String(row.zh || "");
  if (hanLength(text) <= maxAdditional || punctuationOnly.test(text)) return [row, null];
  const suffixes = ["二手市场", "什么程度", "找上门来", "活动现场", "定制贴纸", "制作过程", "这台机器", "生日派对", "自己的品牌", "即时惊喜", "换个场景", "换个用法"];
  const chars = Array.from(text);
  let splitAt = 0;
  for (let index = 1; index < chars.length; index += 1) {
    const candidate = chars.slice(0, index).join("");
    const count = hanLength(candidate);
    if (count <= maxAdditional && suffixes.some((suffix) => candidate.endsWith(suffix))) splitAt = index;
  }
  if (!splitAt) {
    for (let index = 1; index < chars.length; index += 1) {
      if (hanLength(chars.slice(0, index).join("")) <= maxAdditional) splitAt = index;
    }
  }
  if (splitAt <= 0 || splitAt >= chars.length) return [row, null];
  const leftText = chars.slice(0, splitAt).join("").trim();
  const rightText = chars.slice(splitAt).join("").trim();
  const total = Math.max(1, hanLength(text));
  const leftDuration = (Number(row.end) - Number(row.start)) * Math.max(1, hanLength(leftText)) / total;
  const middle = Number((Number(row.start) + leftDuration).toFixed(2));
  return [{...row, end: middle, zh: leftText}, {...row, start: middle, zh: rightText}];
}
function mergeShortCaptions(captions, {targetMin = 14, targetMax = 22, minDuration = 2.5, maxDuration = 4.5} = {}) {
  const rows = (captions || []).map(normalizeCaptionRow).flatMap((caption) => splitLongCaptionRow(caption, targetMin, targetMax, maxDuration))
    .filter((caption) => Number.isFinite(caption.start) && Number.isFinite(caption.end) && caption.end > caption.start && caption.zh)
    .sort((left, right) => left.start - right.start);
  const prepared = [];
  for (const row of rows) {
    if (punctuationOnly.test(row.zh) && prepared.length) {
      const previous = prepared[prepared.length - 1];
      previous.zh = normalizeSimplifiedChinese(String(previous.zh || "") + row.zh);
      previous.en = [previous.en, row.en].filter(Boolean).join(" ");
      previous.end = Math.max(previous.end, row.end);
      continue;
    }
    prepared.push({...row});
  }

  const merged = [];
  let group = [];
  const groupText = () => normalizeSimplifiedChinese(group.map((caption) => caption.zh || "").join(""));
  const flush = () => {
    if (!group.length) return;
    const first = group[0], last = group[group.length - 1];
    merged.push({
      id: first.id || "subtitle-" + String(merged.length + 1).padStart(3, "0"),
      start: first.start,
      end: last.end,
      zh: groupText(),
      en: group.map((caption) => caption.en || "").filter(Boolean).join(" "),
    });
    group = [];
  };

  for (const row of prepared) {
    const beforeText = groupText();
    const beforeChars = hanLength(beforeText);
    if (group.length && beforeChars < targetMin && hanLength(beforeText + row.zh) > targetMax) {
      const [left, right] = splitCaptionForRemaining(row, Math.max(4, targetMax - beforeChars));
      group.push(left);
      flush();
      if (right) group.push(right);
      continue;
    }
    if (group.length && beforeChars >= targetMin && hanLength(beforeText + row.zh) > targetMax) flush();
    group.push(row);
    const text = groupText();
    const chars = hanLength(text);
    const duration = group[group.length - 1].end - group[0].start;
    const shortCommaLead = group.length === 1 && commaPunctuation.test(text) && chars < 10;
    if (shortCommaLead) continue;
    if (terminalPunctuation.test(text) && (chars >= targetMin || duration >= minDuration)) { flush(); continue; }
    if (chars >= targetMax) { flush(); continue; }
    if (duration >= maxDuration && chars >= targetMin) { flush(); continue; }
  }
  flush();
  return merged.map((caption, index) => ({...caption, id: "subtitle-" + String(index + 1).padStart(3, "0")}));
}
function mergeWhisperCaptions(captions, translatedTranscript, language = "zh") {
  if (language === "en") return captions.map((caption) => ({...caption, en: caption.en || caption.zh}));
  const translations = whisperToCaptions(translatedTranscript, "en");
  const english = captions.map(() => []);

  for (const translation of translations) {
    const targets = captions.map((caption, index) => ({caption, index}))
      .filter(({caption}) => caption.end > translation.start && caption.start < translation.end);
    if (!targets.length) continue;

    const words = translation.zh.trim().split(/\s+/).filter(Boolean);
    const totalDuration = targets.reduce((sum, {caption}) => sum + Math.max(0.01, Math.min(caption.end, translation.end) - Math.max(caption.start, translation.start)), 0);
    let wordOffset = 0;
    targets.forEach(({caption, index}, targetIndex) => {
      const duration = Math.max(0.01, Math.min(caption.end, translation.end) - Math.max(caption.start, translation.start));
      const remainingTargets = targets.length - targetIndex;
      const remainingWords = words.length - wordOffset;
      const wordCount = targetIndex === targets.length - 1 ? remainingWords : Math.max(1, Math.min(remainingWords - (remainingTargets - 1), Math.round(words.length * duration / totalDuration)));
      const slice = words.slice(wordOffset, wordOffset + wordCount).join(" ");
      if (slice) english[index].push(slice);
      wordOffset += wordCount;
    });
  }

  return captions.map((caption, index) => ({...caption, en: english[index].join(" ")}));
}
const compactText = compactEffectCopy;
const isPlaceholder = (value, pattern) => pattern.test(compactText(value));

function emptyWindowCopy(index) { return {chapter: String(index + 1).padStart(2, "0") + " · 字幕待补充", headline: "本段暂无有效口播", effectZh: "请补充当前时间窗口字幕", effectEn: "No usable speech was detected in this beat"}; }

function hydrateBeatDrafts(beats, captions, {force = false, language = "zh"} = {}) {
  return beats.map((beat, index) => {
    const match = matchWindowCaptions(captions, beat);
    const derived = extractBeatContent(beat.id, match.captions, {...beat, language}, index);
    const shouldReplaceChapter = force || isPlaceholder(beat.eyebrow, /^CHAPTER\s+\d+$/i);
    const shouldReplaceHeadline = force || isPlaceholder(beat.subtitle, /^Key Point\s+\d+$/i);
    const shouldReplaceZh = force || isPlaceholder(beat.zh, /^文案要点\s*\d+$/);
    const shouldReplaceEn = force || isPlaceholder(beat.en, /^Core point\s+\d+$/i);

    return {
      ...beat,
      eyebrow: shouldReplaceChapter ? derived.chapter : beat.eyebrow,
      subtitle: shouldReplaceHeadline ? derived.headline : beat.subtitle,
      zh: shouldReplaceZh ? (derived.effectText || derived.effectZh) : beat.zh,
      en: language === "en" ? (derived.effectText || derived.effectEn || beat.en) : (shouldReplaceEn ? derived.effectEn : beat.en),
      effectText: derived.effectText || derived.effectZh || beat.effectText || beat.zh,
      textSource: "auto",
      effectCopySource: "auto",
    };
  });
}

function isAutoDerivedBeat(beat) {
  if (beat?.layoutLocked) return false;
  if (beat?.textSource === "manual" || beat?.effectCopySource === "manual") return false;
  return beat?.textSource === "auto"
    || beat?.effectCopySource === "auto"
    || /^\d{2}\s*·\s*核心观点$/.test(String(beat?.eyebrow ?? ""))
    || /^(?:主持人[：:]?|Key Point\b|CHAPTER\b)/i.test(String(beat?.subtitle ?? ""));
}

function rebuildProjectText(project, {force = false} = {}) {
  const captions = (project?.captions ?? []).map((caption) => ({...caption, zh: normalizeSimplifiedChinese(caption?.zh)}));
  const beats = hydrateBeatDrafts(project?.beats ?? [], captions, {force}).map((beat, index) => {
    const original = project.beats[index];
    if (!force && !isAutoDerivedBeat(original)) return beat;
    const match = matchWindowCaptions(captions, original);
    const derived = extractBeatContent(original.id, match.captions, original, index);
    return {...beat, eyebrow: derived.chapter, subtitle: derived.headline, zh: derived.effectZh, en: derived.effectEn, textSource: "auto", effectCopySource: "auto"};
  });
  const diversity = enforceHeadlineDiversity(beats, captions);
  return {...project, captions, beats: enforceBeatTextSeparation(diversity.beats, captions, {onlyAuto: true})};
}

function buildProjectFromWhisper({
  projectId,
  name,
  videoSrc,
  audioSrc,
  duration,
  transcript,
  translation,
  targetBeatDuration = 30,
}) {
  if (!/^[a-z0-9-]+$/.test(projectId ?? "")) {
    throw new Error("Project id must use lowercase letters, numbers, and hyphens.");
  }
  const language = detectLanguage(transcript);
  const captions = mergeWhisperCaptions(whisperToCaptions(transcript, language), translation, language);
  const beats = hydrateBeatDrafts(generateInitialBeats(duration, targetBeatDuration, captions, {language}).map((beat) => ({
    id: beat.id,
    start: beat.start,
    end: beat.end,
    eyebrow: beat.chapter,
    subtitle: beat.headline,
    zh: beat.zh,
    en: language === "en" ? beat.zh : beat.en,
    effectText: language === "en" ? beat.zh : beat.zh,
    layout: beat.layout,
    layoutSource: "auto",
    layoutLocked: false,
    effectProps: {},
  })), captions, {language});

  const diversity = language === "en" ? {beats} : enforceHeadlineDiversity(beats, captions);
  const separatedBeats = language === "en" ? diversity.beats : enforceBeatTextSeparation(diversity.beats, captions);
  return ensureProjectLifecycle(autoMatchProject({
    schemaVersion: 1,
    projectId,
    name: name?.trim() || projectId,
    compositionId: "ProjectEditor",
    fps: 30,
    width: 1920,
    height: 1080,
    videoSrc,
    audioSrc,
    targetBeatDuration,
    language,
    beats: separatedBeats,
    captions,
  }));
}

module.exports = {buildProjectFromWhisper, hydrateBeatDrafts, mergeShortCaptions, mergeWhisperCaptions, rebuildProjectText, whisperToCaptions};
