'use strict';

const {deriveBeatText, normalizeSimplifiedChinese} = require('./text-analysis.cjs');
const {englishBeatContent} = require('./language-support.cjs');
const {extractVisualCard, overlap} = require('./visual-card-extractor.cjs');
const {VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT} = require('./beat-extractor-prompt.cjs');
const {ensureCompleteVisualCopy} = require('./copy-completeness.cjs');
const {inferCommercialTextRole, assignSemanticAccent} = require('./commercial-analysis-preset.cjs');

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
  return candidate || "核心观点";
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
  const local = (windowCaptions || []).map((caption, captionIndex) => normalizeCaption(caption, captionIndex));
  const textRole = inferCommercialTextRole({captions: local, layerIndex: beatTimeRange?.layerIndex, layerCount: beatTimeRange?.layerCount});
  const sourceText = local.map((caption) => caption.zh || caption.en || "").join(" ");
  const accent = assignSemanticAccent({role: textRole, text: sourceText, previousAccent: beatTimeRange?.previousAccent});
  if (beatTimeRange?.language === "en") return {...englishBeatContent(windowCaptions, index), textRole, role: textRole, accent};
  if (!local.length) {
    const fallback = localizedFallback(local, beatTimeRange);
    return {chapter: String(index + 1).padStart(2, "0") + " · 字幕待补充", ...fallback, textRole, role: textRole, accent, effectEn: "", source: "silence"};
  }
  try {
    const derived = deriveBeatText(local, index);
    if (!derived?.headline || !derived?.effectZh) throw new Error("BeatExtractionError: derivation returned incomplete copy");
    const separated = {...ensureCompleteVisualCopy(separateBeatText(derived, local), local), trusted: true};
    const card = extractVisualCard(local, separated);
    return {chapter: derived.chapter, ...card, textRole, role: textRole, accent, effectEn: derived.effectEn || "", source: "visual-card", prompt: VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT};
  } catch (error) {
    const context = {beatId, start: beatTimeRange?.start, end: beatTimeRange?.end, localCaptionCount: local.length, localExcerpt: local.map((caption) => caption.zh).join("。")};
    if (process.env.DEBUG_BEAT_EXTRACTION) console.warn("[beat-content-extraction] local derivation failed", context, error?.stack || error);
    const fallback = {...ensureCompleteVisualCopy(localizedFallback(local, beatTimeRange), local), trusted: true};
    let card;
    try { card = extractVisualCard(local, fallback); }
    catch { card = {...fallback, bodyText: local.map((caption) => caption.zh).join("。"), steps: local.map((caption) => caption.zh).filter(Boolean).slice(0, 4)}; }
    return {chapter: String(index + 1).padStart(2, "0") + " · 字幕待补充", ...card, textRole, role: textRole, accent, effectEn: "", source: "visual-card-fallback", prompt: VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT};
  }
}

const payloadPlaceholder = /^(?:识别关键机制|降低行动阻力|持续放大优势|核心信息|视觉节奏|行动结论|定义目标|组织信息|完成验证)$/;
const payloadClean = (value) => normalizeSimplifiedChinese(value).replace(/^(?:但是|而且|所以|然后|其实|这个|这|那|就是)[，,、\s]*/, '').trim();
const payloadSourceText = (captions) => (captions || []).map((caption) => payloadClean(caption?.zh ?? caption?.en)).filter(Boolean).join('。');
const payloadPhrases = (captions) => payloadSourceText(captions).split(/[。！？；，,]/).map(payloadClean).filter((value) => value.length >= 3 && !payloadPlaceholder.test(value));
const payloadNumbers = (captions) => [...payloadSourceText(captions).matchAll(/(?:^|[^\d])(\d+(?:\.\d+)?)(?=(?:\s|$|[%％万亿倍元件款年]))/g)].map((match) => Number(match[1])).filter(Number.isFinite);
const payloadUnit = (captions) => { const source = payloadSourceText(captions); return /[%％|百分之]/.test(source) ? '%' : /元/.test(source) ? '元' : /倍/.test(source) ? '倍' : ''; };

function editorPayloadKind(editorSchema = {}, family = '') {
  const kind = String(editorSchema.kind || '');
  if (['chips', 'steps', 'metrics', 'narrative'].includes(kind)) return kind;
  const keys = new Set((editorSchema.fields || []).map((field) => field.key));
  if (keys.has('value') || keys.has('progress') || keys.has('marketTo') || keys.has('engineeringTo')) return 'metrics';
  if (keys.has('items')) return 'chips';
  if (keys.has('steps')) return 'steps';
  if (family === 'metrics') return 'metrics';
  if (family === 'chips') return 'chips';
  if (family === 'steps') return 'steps';
  return 'narrative';
}

const LAYER_DIVERSITY_RULES = [
  [/(?:收银台|口香糖|充电线|纸巾|货架中央)/, {headline:"货架边缘触发顺手加购", effectZh:"低价配件缩短即时购买路径"}],
  [/(?:采购价格|物流成本|设备效率|溢价能力)/, {headline:"供应链规模拉开成本差", effectZh:"采购物流效率决定单位成本"}],
  [/(?:模具开好|设备买好|流程跑顺|固定成本)/, {headline:"固定成本随产量摊薄", effectZh:"产量越大单件成本越低"}],
  [/(?:五万元|查评测|看配置|研究好几天)/, {headline:"高价决策需要反复比较", effectZh:"高客单会拉长信息搜寻时间"}],
  [/(?:30元|口香糖|几秒钟|想吃.*结账)/, {headline:"低价入口缩短决策路径", effectZh:"小额购买几秒就能完成"}],
  [/(?:0[。.]96元|四分钱|一亿件|少一道工序|降低一点损耗)/, {headline:"微小优化放大规模利润", effectZh:"单件差异会被亿级产量放大"}],
  [/(?:供应链比你便宜|设备比你熟|报废率|一万个.*细节)/, {headline:"细节管理积累成本壁垒", effectZh:"损耗与良率决定长期差距"}],
  [/(?:追AI|新能源|垃圾袋|袜子|衣架|看不上)/, {headline:"冷门需求藏着长期机会", effectZh:"多数人嫌麻烦反而留下空间"}],
  [/(?:同一个品类.*十年|规格最好卖|材料最稳|回购最高)/, {headline:"长期深耕形成追赶壁垒", effectZh:"多年细节迭代拉开竞争距离"}],
  [/(?:会员|模板|低价工具|数位产品)/, {headline:"低价产品也能形成复购", effectZh:"小额入口同样适合长期经营"}],
  [/(?:风口|刷牙|买早餐|喝水|用纸巾|小动作)/, {headline:"日常需求撑起大市场", effectZh:"高频小动作本身就是规模市场"}],
];
function diversifyVisualCard(card, blockedHeadline, captions = []) {
  if (!blockedHeadline || normalizeComparable(card?.headline) !== normalizeComparable(blockedHeadline)) return card;
  const text = localText(captions);
  const alternative = LAYER_DIVERSITY_RULES.find(([pattern, copy]) => pattern.test(text) && normalizeComparable(copy.headline) !== normalizeComparable(blockedHeadline));
  if (!alternative) return card;
  const sourcePhrases = payloadPhrases(captions);
  const [_, copy] = alternative;
  return {...card, headline:copy.headline, effectZh:copy.effectZh, effectText:copy.effectZh, bodyText:sourcePhrases.find((value) => value.length >= 12 && value.length <= 80) || card.bodyText};
}

function extractComponentPayload({layout, editorSchema = {}, family = '', captions = [], copy = {}} = {}) {
  const phrases = payloadPhrases(captions);
  const semanticItems = (Array.isArray(copy.steps) ? copy.steps : []).map(payloadClean).filter((value) => value && !payloadPlaceholder.test(value));
  const values = (semanticItems.length ? semanticItems : phrases).filter((value, index, all) => all.indexOf(value) === index);
  const numbers = payloadNumbers(captions);
  const headline = payloadClean(copy.headline);
  const effectText = payloadClean(copy.effectZh ?? copy.effectText);
  const bodyText = payloadClean(copy.bodyText) || payloadSourceText(captions);
  const unit = payloadUnit(captions);
  const kind = editorPayloadKind(editorSchema, family);
  const list = values.length ? values : [effectText || headline].filter(Boolean);
  const contentPayload = kind === 'chips'
    ? {type: 'chips', items: list.slice(0, 4).map((title, index) => ({title, subtitle: index === 0 ? effectText : ''}))}
    : kind === 'metrics'
      ? {type: 'metrics', value: numbers[0] ?? '', unit, label: headline, bodyText, detailText: effectText}
      : kind === 'steps'
        ? {type: 'steps', steps: list.slice(0, 4).map((text, index) => ({stepNumber: index + 1, text})), bodyText}
        : {type: 'narrative', bodyText, highlightQuote: effectText};
  const fields = {};
  let textIndex = 0;
  let numberIndex = 0;
  for (const field of editorSchema.fields || []) {
    const key = field.key;
    if (key === 'marketLabel' || key === 'leftLabel') fields[key] = list[0] || headline;
    else if (key === 'engineeringLabel' || key === 'rightLabel') fields[key] = list[1] || effectText || headline;
    else if (key === 'marketTo') fields[key] = numbers[numberIndex++] ?? '';
    else if (key === 'engineeringTo') fields[key] = numbers[numberIndex++] ?? '';
    else if (key === 'leftValue') fields[key] = field.control === 'number' ? (numbers[numberIndex++] ?? '') : (list[1] || effectText || headline);
    else if (key === 'rightValue') fields[key] = field.control === 'number' ? (numbers[numberIndex++] ?? '') : (list[2] || effectText || headline);
    else if (key === 'marketSuffix' || key === 'engineeringSuffix' || key === 'unit') fields[key] = unit;
    else if (key === 'value' || key === 'progress') fields[key] = numbers[numberIndex++] ?? '';
    else if (key === 'label' || key === 'metricLabel') fields[key] = headline;
    else if (key === 'detailText') fields[key] = effectText;
    else if (key === 'bodyText' || key === 'body' || key === 'text') fields[key] = bodyText;
    else if (key === 'highlightQuote') fields[key] = effectText;
    else if (key === 'bearText') fields[key] = list[1] || effectText;
    else if (key !== 'items' && key !== 'steps') fields[key] = list[textIndex++] || effectText || headline;
  }
  return {layout, contentPayload, fields, sourcePhrases: phrases};
}

function enforceBeatTextSeparation(beats, captions, {onlyAuto = false} = {}) {
  const normalizedCaptions = (captions || []).map(normalizeCaption);
  return (beats || []).map((beat, index) => {
    if (onlyAuto && (beat.layoutLocked || beat.textSource === "manual" || beat.effectCopySource === "manual")) return beat;
    if (beat.visualCard?.bodyText) return beat;
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

module.exports = {diversifyVisualCard, editorPayloadKind, enforceBeatTextSeparation, enforceHeadlineDiversity, extractBeatContent, extractComponentPayload, matchWindowCaptions, normalizeCaption, separateBeatText, timeLabel, overlap};

