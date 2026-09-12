"use strict";

const englishStopWords = new Set("the a an and or but for with from into onto over under that which because while when where what how why is are was were be been being to of in on at by as it this these those we you they he she i our your their will would should could can may might has have had do does did".split(" "));
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

function englishBeatContent(captions, index = 0) {
  const source = (captions || []).map((caption) => caption?.en || caption?.zh || caption?.text || "").join(" ").replace(/\s+/g, " ").trim();
  const sentences = source.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const primary = sentences.find((sentence) => words(sentence).length >= 7) || source;
  const keywordWords = words(primary).filter((word) => !englishStopWords.has(word.toLowerCase()) && word.length > 2).slice(0, 6);
  const headlineWords = (keywordWords.length >= 3 ? keywordWords : words(primary).slice(0, 6)).slice(0, 6);
  const headline = titleCase(headlineWords.join(" ")) || "Key Technology Shift";
  const effectWords = words(sentences.find((sentence) => words(sentence).length >= 7 && sentence !== primary) || primary).slice(0, 14);
  while (effectWords.length < 7 && words(source).length > effectWords.length) effectWords.push(words(source)[effectWords.length]);
  const effectText = effectWords.slice(0, 14).join(" ").replace(/[,.!?]+$/, "") + ".";
  return {chapter: "CHAPTER " + String(index + 1).padStart(2, "0"), headline, effectText, effectZh: effectText, effectEn: effectText, steps: sentences.map((sentence) => sentence.replace(/[.!?]+$/, "")).filter(Boolean).slice(0, 4), source: "english-derived"};
}

module.exports = {detectLanguage, englishBeatContent, titleCase};
