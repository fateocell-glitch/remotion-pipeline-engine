"use strict";

const compactEffectCopy = (value) => String(value ?? "").replace(/[.…]+/g, "").replace(/\s+/g, " ").trim();

function conciseEffectCopy(value) {
  const text = compactEffectCopy(value);
  if (!text) return "";
  return text.split(/[。！？；.!?;]+/).map((part) => part.trim()).find(Boolean) || text;
}

module.exports = {compactEffectCopy, conciseEffectCopy};
