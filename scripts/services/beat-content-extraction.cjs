'use strict';

const {deriveBeatText, normalizeSimplifiedChinese} = require('./text-analysis.cjs');
const {englishBeatContent} = require('./language-support.cjs');

const toSeconds = (value) => { const number = Number(value); if (!Number.isFinite(number)) return 0; return Math.abs(number) > 10000 ? number / 1000 : number; };
const timeLabel = (seconds) => { const value = Math.max(0, Math.floor(toSeconds(seconds))); return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0'); };
const normalizeCaption = (caption, index) => ({...caption, id: caption?.id || 'subtitle-' + String(index + 1).padStart(3, '0'), start: toSeconds(caption?.start ?? caption?.offsets?.from), end: toSeconds(caption?.end ?? caption?.offsets?.to), zh: normalizeSimplifiedChinese(caption?.zh ?? caption?.text)});
const overlapRatio = (caption, beat) => { const overlap = Math.max(0, Math.min(caption.end, beat.end) - Math.max(caption.start, beat.start)); const duration = Math.max(.01, caption.end - caption.start); return overlap / duration; };

function matchWindowCaptions(captions, beat, minimumOverlap = .3) {
  const normalized = (captions || []).map(normalizeCaption).filter((caption) => caption.end > caption.start && caption.zh);
  const window = {start: toSeconds(beat.start), end: toSeconds(beat.end)};
  const direct = normalized.filter((caption) => overlapRatio(caption, window) > minimumOverlap);
  if (direct.length) return {captions: direct, source: 'window'};
  const previous = normalized.filter((caption) => caption.end <= window.start).at(-1);
  const next = normalized.find((caption) => caption.start >= window.end);
  return {captions: [previous, next].filter(Boolean), source: 'lookaround'};
}

function localClause(captions) {
  const text = (captions || []).map((caption) => normalizeSimplifiedChinese(caption?.zh)).filter(Boolean).join('。');
  const clauses = text.split(/[。！？；，,]/).map((item) => item.replace(/^(?:主持人[：:]?|我们来|接下来|然后|其实|就是)/, '').trim()).filter((item) => item.length >= 6);
  return clauses.find((item) => item.length >= 8 && item.length <= 16) || clauses[0] || '';
}

const genericTextPattern = /^(?:突出这一拍的关键业务价值|呈现.+的关键变化|这一拍的核心判断|商业价值需要验证)$/;
const normalizeComparable = (value) => normalizeSimplifiedChinese(value).replace(/[，,。！？；、\s]/g, "");
const cleanLocalText = (value) => normalizeSimplifiedChinese(value)
  .replace(/^(?:主持人[：:]?|随着|再加上|对于|各大|其实|然后|接下来|我们来|就是)/, "")
  .replace(/[。！？；]/g, "")
  .trim();

function localText(captions) {
  return (captions || []).map((caption) => cleanLocalText(caption?.zh)).filter(Boolean).join("。");
}

function topicPhrase(captions, fallback = "") {
  const text = localText(captions);
  const rules = [
    [/(?:竞争.*白热化)/, "市场竞争白热化"],
    [/(?:差异化.*抹平)/, "品牌差异收窄"],
    [/(?:排队|叫号|黄牛)/, "排队热度爆棚"],
    [/(?:逆势突围|毫无前景|商场餐饮)/, "红海赛道突围"],
    [/(?:供需.*缺口)/, "日料供需缺口"],
    [/(?:两极分化)/, "日料市场分化"],
    [/(?:文化买单|偶尔吃|经常吃)/, "日料消费偏贵"],
    [/(?:高端吃不起|低端不敢吃|中端品牌.*不多)/, "中端品牌缺位"],
  ];
  for (const [pattern, phrase] of rules) if (pattern.test(text)) return phrase;
  const candidate = cleanLocalText(fallback).replace(/^(?:市场的|品牌的|产品的)/, "");
  if (candidate.length >= 4 && candidate.length <= 15) return candidate;
  const clause = localClause(captions).replace(/^(?:随着|再加上|对于)/, "").trim();
  if (clause.length >= 4 && clause.length <= 15) return clause;
  return candidate.slice(0, 15) || "核心观点";
}

function narrativePhrase(captions, headline, fallback = "") {
  const text = localText(captions);
  const rules = [
    [/(?:差异化.*抹平)/, "品牌差异化逐渐抹平"],
    [/(?:高端吃不起|低端不敢吃)/, "中端价格带仍有空档"],
    [/(?:两极分化)/, "高低端市场挤压中端空间"],
    [/(?:供需.*缺口)/, "中端需求长期缺少承接"],
    [/(?:排队|叫号|黄牛)/, "消费热度持续推动排队"],
  ];
  for (const [pattern, phrase] of rules) if (pattern.test(text)) return phrase;
  const normalizedHeadline = normalizeComparable(headline);
  const safeFallback = cleanLocalText(fallback);
  if (safeFallback.length >= 8 && safeFallback.length <= 14 && normalizeComparable(safeFallback) !== normalizedHeadline && !genericTextPattern.test(safeFallback)) return safeFallback;
  const segments = text.split(/[，,。！？；]/).map((item) => cleanLocalText(item)).filter((item) => item.length >= 8 && item.length <= 14 && normalizeComparable(item) !== normalizedHeadline);
  if (segments.length) return segments[0];
  return ("围绕" + headline + "持续调整").slice(0, 14);
}

function alternateTopicPhrase(captions, blocked = "") {
  const text = localText(captions);
  const normalizedBlocked = normalizeComparable(blocked);
  const rules = [
    [/(?:差异化.*抹平)/, "品牌差异收窄"],
    [/(?:改变和升级|持续升级)/, "品牌持续升级"],
    [/(?:排队数小时|叫号上千)/, "排队热度承压"],
    [/(?:供需.*缺口)/, "中端需求缺位"],
  ];
  for (const [pattern, phrase] of rules) if (pattern.test(text) && normalizeComparable(phrase) !== normalizedBlocked) return phrase;
  return "";
}

function separateBeatText(copy, captions) {
  const originalHeadline = cleanLocalText(copy?.headline);
  const originalEffect = cleanLocalText(copy?.effectZh);
  const same = normalizeComparable(originalHeadline) && normalizeComparable(originalHeadline) === normalizeComparable(originalEffect);
  const localHasKnownTopic = /(?:竞争.*白热化|差异化.*抹平|供需.*缺口|两极分化|中端品牌.*不多)/.test(localText(captions));
  const headline = same || localHasKnownTopic || genericTextPattern.test(originalHeadline) || originalHeadline.length < 4
    ? topicPhrase(captions, originalHeadline)
    : originalHeadline;
  let effectZh = same || localHasKnownTopic || genericTextPattern.test(originalEffect) || originalEffect.length < 8 || originalEffect.length > 18
    ? narrativePhrase(captions, headline, originalEffect)
    : originalEffect;
  if (normalizeComparable(headline) === normalizeComparable(effectZh)) effectZh = narrativePhrase(captions, headline);
  return {headline, effectZh};
}

function localizedFallback(captions, beatTimeRange) {
  const clause = localClause(captions);
  if (clause) {
    const separated = separateBeatText({headline: clause, effectZh: clause}, captions);
    return {...separated, steps: (captions || []).map((caption) => normalizeSimplifiedChinese(caption?.zh)).filter(Boolean).slice(0, 4)};
  }
  const marker = '核心观点 · ' + timeLabel(beatTimeRange.start);
  return {headline: marker, effectZh: '纯画面展示', steps: []};
}

function extractBeatContent(beatId, windowCaptions, beatTimeRange, index = 0) {
  if (beatTimeRange?.language === "en") return englishBeatContent(windowCaptions, index);
  const local = (windowCaptions || []).map((caption, captionIndex) => normalizeCaption(caption, captionIndex));
  if (!local.length) {
    const fallback = localizedFallback(local, beatTimeRange);
    return {chapter: String(index + 1).padStart(2, "0") + " · 字幕待补充", ...fallback, effectEn: "", source: "silence"};
  }
  try {
    const derived = deriveBeatText(local, index);
    if (!derived?.headline || !derived?.effectZh) throw new Error("BeatExtractionError: derivation returned incomplete copy");
    const separated = separateBeatText(derived, local);
    return {chapter: derived.chapter, ...separated, effectEn: derived.effectEn || "", steps: local.map((caption) => caption.zh).filter(Boolean).slice(0, 4), source: "derived"};
  } catch (error) {
    const context = {beatId, start: beatTimeRange?.start, end: beatTimeRange?.end, localCaptionCount: local.length, localExcerpt: local.map((caption) => caption.zh).join("。").slice(0, 280)};
    console.error("[beat-content-extraction] local derivation failed", context, error?.stack || error);
    const fallback = localizedFallback(local, beatTimeRange);
    return {chapter: String(index + 1).padStart(2, "0") + " · 字幕待补充", ...fallback, effectEn: "", source: "fallback"};
  }
}

function enforceBeatTextSeparation(beats, captions, {onlyAuto = false} = {}) {
  const normalizedCaptions = (captions || []).map(normalizeCaption);
  return (beats || []).map((beat, index) => {
    if (onlyAuto && (beat.layoutLocked || beat.textSource === "manual" || beat.effectCopySource === "manual")) return beat;
    const matched = matchWindowCaptions(normalizedCaptions, beat).captions;
    const separated = separateBeatText({headline: beat.subtitle, effectZh: beat.zh}, matched);
    const effectProps = {...(beat.effectProps || {}), headline: separated.headline, effectZh: separated.effectZh, body: separated.effectZh, title: separated.headline};
    const layers = Array.isArray(beat.layers) ? beat.layers.map((layer) => ({
      ...layer,
      effectProps: {...(layer.effectProps || {}), headline: layer.layout === "zoom-statement" ? separated.effectZh : separated.headline, effectZh: separated.effectZh, body: separated.effectZh, title: separated.headline},
    })) : beat.layers;
    return {...beat, subtitle: separated.headline, zh: separated.effectZh, effectProps, layers};
  });
}

function enforceHeadlineDiversity(beats, captions) {
  const ratio = beats.length ? new Set(beats.map((beat) => beat.subtitle)).size / beats.length : 1;
  if (beats.length <= 3 || ratio >= .6) return {beats, ratio, repaired: false};
  const seen = new Set();
  const repairedBeats = beats.map((beat, index) => {
    if (!seen.has(beat.subtitle)) { seen.add(beat.subtitle); return beat; }
    const matched = matchWindowCaptions(captions, beat).captions;
    const local = localizedFallback(matched, beat);
    const preferred = seen.has(local.headline) ? alternateTopicPhrase(matched, local.headline) : local.headline;
    const headline = preferred && !seen.has(preferred) ? preferred : "核心观点 · " + timeLabel(beat.start);
    seen.add(headline);
    return {...beat, subtitle: headline, zh: local.effectZh || "纯画面展示", effectProps: {...(beat.effectProps || {}), headline, effectZh: local.effectZh || "纯画面展示"}};
  });
  return {beats: repairedBeats, ratio: new Set(repairedBeats.map((beat) => beat.subtitle)).size / repairedBeats.length, repaired: true};
}

module.exports = {enforceBeatTextSeparation, enforceHeadlineDiversity, extractBeatContent, matchWindowCaptions, normalizeCaption, separateBeatText, timeLabel};

