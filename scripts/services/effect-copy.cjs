"use strict";

const compactEffectCopy = (value) => String(value ?? "").replace(/[.…]+/g, "").replace(/\s+/g, " ").trim();

function conciseEffectCopy(value, maxLength) {
  const text = compactEffectCopy(value);
  if (!text || text.length <= maxLength) return text;
  const firstSentence = text.split(/[。！？；.!?;]+/).map((part) => part.trim()).find(Boolean) ?? text;
  const candidate = firstSentence.length <= maxLength ? firstSentence : text.slice(0, maxLength);
  if (/^[\x00-\x7F]+$/.test(candidate)) {
    const wordBoundary = candidate.lastIndexOf(" ");
    return compactEffectCopy(wordBoundary >= Math.floor(maxLength * 0.55) ? candidate.slice(0, wordBoundary) : candidate);
  }
  return compactEffectCopy(candidate);
}

module.exports = {compactEffectCopy, conciseEffectCopy};
