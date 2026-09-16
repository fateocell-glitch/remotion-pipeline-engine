"use strict";

const SOURCE_LANGUAGES = new Set(["auto", "en", "zh"]);
const TARGET_LANGUAGES = new Set(["same", "en", "zh"]);
const DETECTED_LANGUAGES = new Set(["en", "zh"]);

function normalizeSourceLanguage(value) {
  const language = String(value || "").trim().toLowerCase();
  return SOURCE_LANGUAGES.has(language) ? language : "auto";
}

function normalizeTargetLanguage(value) {
  const language = String(value || "").trim().toLowerCase();
  return TARGET_LANGUAGES.has(language) ? language : "same";
}

function normalizeDetectedLanguage(value) {
  const language = String(value || "").trim().toLowerCase();
  if (/^en(?:[-_]|$)/.test(language)) return "en";
  if (/^(?:zh|cn)(?:[-_]|$)/.test(language)) return "zh";
  return "";
}

function resolveLanguageRoute({sourceLanguage, targetLanguage, detectedSourceLanguage} = {}) {
  const source = normalizeSourceLanguage(sourceLanguage);
  const target = normalizeTargetLanguage(targetLanguage);
  const detected = normalizeDetectedLanguage(detectedSourceLanguage) || (source === "auto" ? "" : source);
  const sourceForGeneration = detected || "zh";

  return {
    sourceLanguage: source,
    targetLanguage: target,
    detectedSourceLanguage: detected || sourceForGeneration,
    finalLanguage: target === "same" ? sourceForGeneration : target,
  };
}

module.exports = {
  DETECTED_LANGUAGES,
  SOURCE_LANGUAGES,
  TARGET_LANGUAGES,
  normalizeDetectedLanguage,
  normalizeSourceLanguage,
  normalizeTargetLanguage,
  resolveLanguageRoute,
};
