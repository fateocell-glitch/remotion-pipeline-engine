"use strict";

const DEFAULT_GLOBAL_SETTINGS = {
  background: {dimOpacity: 0, blurRadius: 0, vignette: false},
  theme: {primaryAccent: "#00F2FE", cardStyle: "glass", autoContrastStroke: true},
  subtitles: {bottomOffset: 120, fontSizeZh: 46, fontSizeEn: 22, highlightColor: "#F59E0B"},
  motion: {preset: "tech-snappy"},
};
const clamp = (value, min, max, fallback) => {const numeric = typeof value === "number" && Number.isFinite(value) ? value : fallback; return Math.min(max, Math.max(min, numeric));};
function mergeGlobalSettings(input) {
  return {
    background: {dimOpacity: clamp(input?.background?.dimOpacity, 0, 0.9, 0), blurRadius: clamp(input?.background?.blurRadius, 0, 20, 0), vignette: typeof input?.background?.vignette === "boolean" ? input.background.vignette : false},
    theme: {primaryAccent: typeof input?.theme?.primaryAccent === "string" && /^#[0-9a-f]{6}$/i.test(input.theme.primaryAccent) ? input.theme.primaryAccent : "#00F2FE", cardStyle: input?.theme?.cardStyle === "opaque" ? "opaque" : "glass", autoContrastStroke: typeof input?.theme?.autoContrastStroke === "boolean" ? input.theme.autoContrastStroke : true},
    subtitles: {bottomOffset: clamp(input?.subtitles?.bottomOffset, 60, 200, 120), fontSizeZh: clamp(input?.subtitles?.fontSizeZh, 36, 60, 46), fontSizeEn: clamp(input?.subtitles?.fontSizeEn, 18, 32, 22), highlightColor: typeof input?.subtitles?.highlightColor === "string" && /^#[0-9a-f]{6}$/i.test(input.subtitles.highlightColor) ? input.subtitles.highlightColor : "#F59E0B"},
    motion: {preset: typeof input?.motion?.preset === "string" && input.motion.preset ? input.motion.preset : "tech-snappy"},
  };
}
module.exports = {DEFAULT_GLOBAL_SETTINGS, mergeGlobalSettings};
