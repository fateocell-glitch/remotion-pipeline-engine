"use strict";

const {normalizeSimplifiedChinese} = require("./text-analysis.cjs");

// Corrections stay deliberately conservative: normalize stable ASR variants
// without inventing names, figures, or claims that were not transcribed.
const TERM_ALIASES = [
  [/\bDipsick\b/gi, "DeepSeek"],
  [/\bDeep\s*Seek\b/gi, "DeepSeek"],
  [/\bA\s*I\b/gi, "AI"],
  [/\bC\s*E\s*O\b/gi, "CEO"],
  [/\bG\s*P\s*U\b/gi, "GPU"],
  [/\bL\s*L\s*M\b/gi, "LLM"],
  [/\bS\s*E\s*O\b/gi, "SEO"],
  [/\bi\s*Pad\b/gi, "iPad"],
  [/\bi\s*Phone\b/gi, "iPhone"],
  [/\bChat\s*G\s*P\s*T\b/gi, "ChatGPT"],
];

const trailingFillers = /(?:嗯+|呃+|啊+|那个|就是|然后)(?=[，。！？、\s]|$)/g;

const FOLDABLE_IPHONE_ALIASES = [
  [/(?:太坚守|太金属)(?:的)?版/g, "钛金属基板"],
  [/(?:iPhone)(?:丢|吊|2)(?![A-Za-z0-9])/gi, "iPhone Duo"],
  [/(?:纳米瘟里|纳米纹里)/g, "纳米纹理"],
  [/(?:MacSafe)/gi, "MagSafe"],
  [/(?:iP)(?:68|48)/gi, (value) => value.toUpperCase()],
  [/(?:AR20|A\s*R\s*20)\s*Pro/gi, "A20 Pro"],
  [/(?:折地机|折穴)/g, "折叠机"],
];

function isFoldableIphoneReview(rows) {
  const text = (rows || []).map((row) => normalizeSimplifiedChinese(row?.text)).join(" ");
  const appleSignal = /(苹果|iPhone|Apple)/i.test(text);
  const foldableSignal = /(折痕|折叠|折地机|折穴|纳米瘟里|Apple Pencil|MacSafe|iP68|AR20)/i.test(text);
  return appleSignal && foldableSignal;
}

function applyFoldableIphoneAliases(text) {
  return FOLDABLE_IPHONE_ALIASES.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text);
}


function cleanCaptionText(value) {
  let text = normalizeSimplifiedChinese(value)
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of TERM_ALIASES) {
    text = text.replace(pattern, replacement);
  }

  // Whisper can repeat an exact phrase when adjacent audio chunks are merged.
  text = text
    .replace(/([\u4e00-\u9fff]{2,8})\1(?=[，。！？、\s]|$)/g, "$1")
    .replace(trailingFillers, "")
    .replace(/\b(DeepSeek|ChatGPT|iPad|iPhone)\s+\1(?=[，。！？、\s]|$)/gi, "$1")
    .replace(/[，,]{2,}/g, "，")
    .replace(/[。.!！?？]{2,}/g, (marks) => /[!?？！]/.test(marks) ? "？" : "。");

  if (/[\u3400-\u9fff]/.test(text)) {
    text = text
      .replace(/,/g, "，")
      .replace(/(?<!\d)\.(?!\d)/g, "。")
      .replace(/!/g, "！")
      .replace(/\?/g, "？");
  }

  return text.replace(/\s+([，。！？；：])/g, "$1").trim();
}

function cleanWhisperTranscript(transcript, {now = new Date()} = {}) {
  const source = transcript && typeof transcript === "object" ? transcript : {};
  const rows = Array.isArray(source.transcription) ? source.transcription : [];
  const foldableIphoneReview = isFoldableIphoneReview(rows);
  const transcription = rows.map((row) => {
    const cleaned = cleanCaptionText(row?.text);
    return {...row, text: foldableIphoneReview ? applyFoldableIphoneAliases(cleaned) : cleaned};
  });
  const changedCount = transcription.reduce(
    (count, row, index) => count + (String(row.text ?? "") !== String(rows[index]?.text ?? "") ? 1 : 0),
    0,
  );

  return {
    ...source,
    transcription,
    cleaning: {
      mode: "context-aware-local",
      status: "completed",
      cleanedAt: now.toISOString(),
      changedCount,
      source: "captions.json",
      context: foldableIphoneReview ? "foldable-iphone-review" : "generic",
    },
  };
}

module.exports = {cleanCaptionText, cleanWhisperTranscript};
