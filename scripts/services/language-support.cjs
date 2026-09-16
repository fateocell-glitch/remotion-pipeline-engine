"use strict";

const englishStopWords = new Set("the a an and or but for with from into onto over under that which because while when where what how why is are was were be been being to of in on at by as it this these those we you they he she i our your their will would should could can may might has have had do does did there multiple opportunity opportunities including".split(" "));
const titleCase = (value) => String(value || "").split(/\s+/).filter(Boolean).map((word) => /^(AI|API|GPU|CPU|ROI|R&D|LLM)$/i.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
const words = (value) => String(value || "").replace(/[^A-Za-z0-9%+&/-]+/g, " ").trim().split(/\s+/).filter(Boolean);

function detectLanguage(transcript) {
  const declared = String(transcript?.language || transcript?.result?.language || "").toLowerCase();
  if (/^en(?:-|$)/.test(declared)) return "en";
  if (/^(zh|cn)(?:-|$)/.test(declared)) return "zh";
  const text = (transcript?.transcription || []).map((row) => row?.text || "").join(" ");
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return latin > cjk * 2 ? "en" : "zh";
}

const ENGLISH_BUSINESS_RULES = [
  {
    pattern: /\b(violent crime|crime rate|fbi data)\b/i,
    category: "RISK SIGNAL",
    headline: "Crime Decline Signal",
    effectText: "Recent data shows violence has eased across the city.",
  },
  {
    pattern: /\b(higher education|universit(?:y|ies)|college|colleges)\b/i,
    category: "EDUCATION",
    headline: "Higher Education Hub",
    bodyText: "Higher education anchors a steady local pipeline of graduates and specialized skills.",
    effectText: "Universities expand the region's skilled talent pipeline.",
  },
  {
    pattern: /\b(infrastructure|interstate|highway|transit|port|airport)\b/i,
    category: "INFRASTRUCTURE",
    headline: "Regional Access Network",
    bodyText: "Transport infrastructure connects local activity with a broader regional economic catchment.",
    effectText: "Transport links broaden access across the regional market.",
  },
  {
    pattern: /\b(talent|workforce|graduates?|skills?)\b/i,
    category: "TALENT POOL",
    headline: "Talent Pipeline Expansion",
    bodyText: "A deeper workforce base gives employers more capacity to support durable expansion.",
    effectText: "Skilled workers support durable regional business growth.",
  },
  {
    pattern: /\b(obstacle courses?|golf(?:ers| courses?)?|outdoor attractions?)\b/i,
    category: "LIFESTYLE ECONOMY",
    headline: "Outdoor Leisure Mix",
    bodyText: "Outdoor attractions create a broader recreation mix for local residents.",
    effectText: "Golf courses add premium variety beside adventure activities.",
  },
  {
    pattern: /\b(hilltop|town center|retail space|boutiques|shopping)\b/i,
    category: "RETAIL ACCESS",
    headline: "Retail Access Network",
    bodyText: "Retail districts give residents convenient access to a broader everyday commerce mix.",
    effectText: "Hilltop and Town Center widen nearby shopping choice.",
  },
];
const englishBusinessRule = (source) => ENGLISH_BUSINESS_RULES.find((rule) => rule.pattern.test(String(source || ""))) || null;
const uniqueEnglish = (values) => {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = String(value || "").trim().toLocaleLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};
const englishNamedEntities = (source) => {
  const match = String(source || "").match(/\b(?:including|such as|like)\s+(.+?)(?:[.!?]|$)/i);
  if (!match) return [];
  return uniqueEnglish(match[1].split(/\s*(?:,|\band\b|&)\s*/i)
    .map((value) => value.replace(/\b(?:the|a|an)\b/gi, "").replace(/[^A-Za-z0-9&' -]/g, "").replace(/\s+/g, " ").trim())
    .filter((value) => words(value).length >= 2 && words(value).length <= 4)
    .map(titleCase));
};
function englishCategoryFor(source) {
  const text = String(source || "");
  const businessRule = englishBusinessRule(text);
  if (businessRule) return businessRule.category;
  if (/\b(risk|riskier|downside|pressure|margin compression|constraint)\b/i.test(text)) return "RISK SIGNAL";
  if (/\b(\d+(?:\.\d+)?%?|revenue|margin|cost|growth|conversion|profit|metric)\b/i.test(text)) return "KEY METRIC";
  if (/\b(acquisition|retention|demand|workflow|roadmap|driver|scale|economics)\b/i.test(text)) return "CORE DRIVER";
  if (/\b(verdict|therefore|bottom line|discipline)\b/i.test(text)) return "CORE TAKEAWAY";
  return "CORE TAKEAWAY";
}

function englishBeatContent(captions, index = 0) {
  const source = (captions || []).map((caption) => caption?.en || caption?.zh || caption?.text || "").join(" ").replace(/\s+/g, " ").trim();
  const sentences = source.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const primary = sentences.find((sentence) => words(sentence).length >= 7) || source;
  const businessRule = englishBusinessRule(source);
  const keywordWords = uniqueEnglish(words(primary).filter((word) => !englishStopWords.has(word.toLowerCase()) && word.length > 2));
  const fallbackWords = keywordWords.length >= 3 ? keywordWords.slice(0, 6) : words(primary).filter((word) => !/^(?:there|is|are)$/i.test(word)).slice(0, 6);
  const headline = businessRule?.headline || titleCase(fallbackWords.join(" ")) || "Business Growth Driver";
  const bodyTerms = fallbackWords.slice(0, 4).map((word) => word.toLowerCase()).join(" ") || "local activity";
  const detailTerms = fallbackWords.slice(0, 3).map((word) => word.toLowerCase()).join(" ") || "local demand";
  const bodyText = businessRule?.bodyText || ("The local offer expands through " + bodyTerms + " to serve everyday demand.");
  const effectText = businessRule?.effectText || ("This mix broadens options around " + detailTerms + " for residents.");
  const entities = englishNamedEntities(source);
  const steps = entities.length ? entities : uniqueEnglish(keywordWords.slice(0, 3).map(titleCase));
  const tags = uniqueEnglish([englishCategoryFor(source), ...entities, ...keywordWords.slice(0, 3).map(titleCase)]).slice(0, 4);
  return {chapter: englishCategoryFor(source), headline, bodyText, effectText, effectZh: effectText, effectEn: effectText, highlightQuote: effectText, tags, steps, source: "english-derived"};
}

module.exports = {detectLanguage, englishBeatContent, englishCategoryFor, titleCase};


