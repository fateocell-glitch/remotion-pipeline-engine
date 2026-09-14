"use strict";

const isCjk = (value) => /[\u3400-\u9fff]/.test(value);
const splitText = (value) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const limit = isCjk(text) ? 29 : 72;
  const chunks = [];
  let current = "";
  for (const character of text) {
    current += character;
    if (/[，。！？；,;.!?]/.test(character) || current.length >= limit) {
      if (current.trim()) chunks.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

function splitCaptionCues(captions) {
  return (captions ?? []).flatMap((caption, captionIndex) => {
    const start = Number(caption.start);
    const end = Number(caption.end);
    const chunks = splitText(caption.zh);
    if (!chunks.length || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    const weights = chunks.map((chunk) => Math.max(1, chunk.replace(/[，。！？；,;.!?]/g, "").length));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const words = String(caption.en ?? "").trim().split(/\s+/).filter(Boolean);
    const baseId = String(caption.id || "subtitle-" + String(captionIndex + 1).padStart(3, "0"));
    let cursor = start;
    let wordOffset = 0;
    return chunks.map((zh, index) => {
      const next = index === chunks.length - 1 ? end : Number((cursor + (end - start) * weights[index] / totalWeight).toFixed(2));
      const remaining = words.length - wordOffset;
      const count = index === chunks.length - 1 ? remaining : Math.max(0, Math.round(words.length * weights[index] / totalWeight));
      const en = words.slice(wordOffset, wordOffset + Math.min(remaining, count)).join(" ");
      wordOffset += Math.min(remaining, count);
      const item = {id: chunks.length === 1 ? baseId : baseId + "-" + String(index + 1).padStart(2, "0"), start: cursor, end: next, zh, en};
      cursor = next;
      return item;
    });
  });
}

module.exports = {splitCaptionCues};
