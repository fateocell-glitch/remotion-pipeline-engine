"use strict";

const {generateInitialBeats} = require("./generate-beat-plan.cjs");
const {autoMatchProject} = require("./layout-matcher.cjs");
const {ensureProjectLifecycle} = require("./project-render-assets.cjs");
const {compactEffectCopy} = require("./services/effect-copy.cjs");
const {normalizeSimplifiedChinese} = require("./services/text-analysis.cjs");
const {enforceBeatTextSeparation, enforceHeadlineDiversity, extractBeatContent, matchWindowCaptions} = require("./services/beat-content-extraction.cjs");
const {detectLanguage} = require("./services/language-support.cjs");
const {resolveLanguageRoute} = require("./services/language-routing.cjs");

const roundSeconds = (milliseconds) => Number((milliseconds / 1000).toFixed(2));

const isCjk = (value) => /[\u3400-\u9fff]/.test(value);
const isDisplayBoundary = (character) => /[，。！？；,;.!?]/.test(character);
const splitDisplayText = (value) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const target = isCjk(text) ? 29 : 72;
  const chunks = [];
  let start = 0;
  let count = 0;
  for (let index = 0; index < text.length; index += 1) {
    count += 1;
    if (!isDisplayBoundary(text[index])) continue;
    if (count < target && index + 1 < text.length) continue;
    chunks.push(text.slice(start, index + 1).trim());
    start = index + 1;
    count = 0;
  }
  const trailing = text.slice(start).trim();
  if (trailing) chunks.push(trailing);
  return chunks.filter(Boolean);
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

function naturalSplitIndex(text, targetMin, targetMax) {
  const chars = Array.from(String(text || ""));
  let splitAt = 0;
  for (let index = 1; index < chars.length; index += 1) {
    const candidate = chars.slice(0, index).join("");
    const count = hanLength(candidate);
    if (count >= targetMin && count <= targetMax && /[，,；;。！？!?]$/.test(candidate)) splitAt = index;
  }
  return splitAt;
}

function splitLongCaptionRow(row, targetMin, targetMax, maxDuration) {
  const text = String(row.zh || "");
  const duration = Number(row.end) - Number(row.start);
  if (punctuationOnly.test(text) || (hanLength(text) <= targetMax && duration <= maxDuration)) return [row];
  const parts = [];
  let rest = text;
  while (hanLength(rest) > targetMax) {
    const splitAt = naturalSplitIndex(rest, targetMin, targetMax);
    if (!splitAt) break;
    const chars = Array.from(rest);
    parts.push(chars.slice(0, splitAt).join("").trim());
    rest = chars.slice(splitAt).join("").trim();
  }
  if (parts.length === 0) return [row];
  if (rest) parts.push(rest);
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
  const splitAt = naturalSplitIndex(text, 4, maxAdditional);
  if (!splitAt) return [row, null];
  const chars = Array.from(text);
  const leftText = chars.slice(0, splitAt).join("").trim();
  const rightText = chars.slice(splitAt).join("").trim();
  const total = Math.max(1, hanLength(text));
  const leftDuration = (Number(row.end) - Number(row.start)) * Math.max(1, hanLength(leftText)) / total;
  const middle = Number((Number(row.start) + leftDuration).toFixed(2));
  return [{...row, end: middle, zh: leftText}, {...row, start: middle, zh: rightText}];
}
function repairSplitLatinRows(rows) {
  const repaired = [];
  for (const row of rows) {
    const previous = repaired[repaired.length - 1];
    if (previous && /[A-Za-z0-9_-]$/.test(previous.zh) && /^[a-z0-9_-]/.test(row.zh) && !/[。！？；，,;.!?]$/.test(previous.zh)) {
      previous.zh = String(previous.zh) + String(row.zh);
      previous.en = [previous.en, row.en].filter(Boolean).join(" ");
      previous.end = row.end;
      continue;
    }
    repaired.push({...row});
  }
  return repaired;
}
const englishWordCount = (value) => String(value || "").trim().split(/\s+/).filter(Boolean).length;

function mergeEnglishCaptions(captions, {minWords = 8, maxWords = 18, maxDuration = 5} = {}) {
  const rows = (captions || []).map((caption, index) => ({
    ...caption,
    id: String(caption?.id || "subtitle-" + String(index + 1).padStart(3, "0")),
    start: Number(caption?.start),
    end: Number(caption?.end),
    zh: String(caption?.zh ?? caption?.en ?? caption?.text ?? "").replace(/\s+/g, " ").trim(),
    en: String(caption?.en ?? caption?.zh ?? caption?.text ?? "").replace(/\s+/g, " ").trim(),
  })).filter((caption) => Number.isFinite(caption.start) && Number.isFinite(caption.end) && caption.end > caption.start && caption.zh)
    .sort((left, right) => left.start - right.start);
  const merged = [];
  let group = [];
  const groupText = () => group.map((caption) => caption.zh).join(" ").replace(/\s+/g, " ").trim();
  const flush = () => {
    if (!group.length) return;
    const first = group[0];
    const last = group[group.length - 1];
    const text = groupText();
    merged.push({id: first.id || "subtitle-" + String(merged.length + 1).padStart(3, "0"), start: first.start, end: last.end, zh: text, en: text});
    group = [];
  };
  for (const row of rows) {
    const nextText = [groupText(), row.zh].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (group.length && englishWordCount(nextText) > maxWords && englishWordCount(groupText()) >= minWords) flush();
    group.push(row);
    const text = groupText();
    const duration = group[group.length - 1].end - group[0].start;
    if ((/[.!?]$/.test(text) && englishWordCount(text) >= minWords) || (duration >= maxDuration && englishWordCount(text) >= minWords)) flush();
  }
  flush();
  return merged.map((caption, index) => ({...caption, id: "subtitle-" + String(index + 1).padStart(3, "0")}));
}

function mergeShortCaptions(captions, {targetMin = 23, targetMax = 29, minDuration = 2.5, maxDuration = 4.5, language = "zh"} = {}) {
  if (language === "en") return mergeEnglishCaptions(captions);
  const rows = repairSplitLatinRows((captions || []).map(normalizeCaptionRow)).flatMap((caption) => splitLongCaptionRow(caption, targetMin, targetMax, maxDuration))
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
    if (terminalPunctuation.test(text) && chars >= targetMin) { flush(); continue; }
    if (chars >= targetMax) { flush(); continue; }
    if (duration >= maxDuration && chars >= targetMin) { flush(); continue; }
  }
  flush();
  // Reflow undersized rows forward with a bounded single pass.
  const reflowed = merged.map((caption) => ({...caption}));
  for (let index = 0; index < reflowed.length - 1; index += 1) {
    const current = reflowed[index];
    if (hanLength(current.zh) >= targetMin) continue;
    const following = reflowed[index + 1];
    const combined = {...current, end: following.end, zh: normalizeSimplifiedChinese(String(current.zh || "") + String(following.zh || "")), en: [current.en, following.en].filter(Boolean).join(" ")};
    const chunks = splitLongCaptionRow(combined, targetMin, targetMax, Number.POSITIVE_INFINITY);
    reflowed.splice(index, 2, ...chunks);
    if (chunks.length === 1) index -= 1;
  }
  return reflowed.map((caption, index) => ({...caption, id: "subtitle-" + String(index + 1).padStart(3, "0")}));
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
    const match = matchWindowCaptions(captions, beat, 0.01);
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
      visualCard: {bodyText: derived.bodyText || derived.effectZh, steps: derived.steps || []},
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
    return {...beat, eyebrow: derived.chapter, subtitle: derived.headline, zh: derived.effectZh, effectText: derived.effectZh, en: derived.effectEn, visualCard: {bodyText: derived.bodyText || derived.effectZh, steps: derived.steps || []}, textSource: "auto", effectCopySource: "auto"};
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
  sourceLanguage = "auto",
  targetLanguage = "same",
  detectedSourceLanguage,
}) {
  if (!/^[a-z0-9-]+$/.test(projectId ?? "")) {
    throw new Error("Project id must use lowercase letters, numbers, and hyphens.");
  }
  const target = Number(targetBeatDuration);
  if (!Number.isFinite(target) || target < 25 || target > 35) {
    throw new Error("targetBeatDuration must be between 25 and 35 seconds.");
  }

  const route = resolveLanguageRoute({
    sourceLanguage,
    targetLanguage,
    detectedSourceLanguage: detectedSourceLanguage || detectLanguage(transcript),
  });
  const language = route.finalLanguage;
  const captionLanguage = route.detectedSourceLanguage;
  const captions = mergeWhisperCaptions(whisperToCaptions(transcript, captionLanguage), translation, captionLanguage);
  const beats = hydrateBeatDrafts(generateInitialBeats(duration, target, captions, {language}).map((beat) => ({
    id: beat.id,
    start: beat.start,
    end: beat.end,
    eyebrow: beat.chapter,
    subtitle: beat.headline,
    zh: beat.zh,
    en: language === "en" ? beat.zh : beat.en,
    effectText: beat.zh,
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
    targetBeatDuration: target,
    sourceLanguage: route.sourceLanguage,
    targetLanguage: route.targetLanguage,
    detectedSourceLanguage: route.detectedSourceLanguage,
    language,
    beats: separatedBeats,
    captions,
  }));
}

module.exports = {buildProjectFromWhisper, hydrateBeatDrafts, mergeShortCaptions, mergeWhisperCaptions, rebuildProjectText, whisperToCaptions};
