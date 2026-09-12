import {mergeGlobalSettings} from "./globalSettings";
const result = mergeGlobalSettings({background: {dimOpacity: 2, blurRadius: 4, vignette: false}, theme: {primaryAccent: "#2563EB", cardStyle: "opaque", autoContrastStroke: false}, subtitles: {bottomOffset: 180, fontSizeZh: 52, fontSizeEn: 28, highlightColor: "#00F2FE"}, motion: {preset: "cinematic"}});
if (result.background.dimOpacity !== 0.9 || result.background.blurRadius !== 4 || result.theme.cardStyle !== "opaque" || result.theme.autoContrastStroke !== false || result.subtitles.bottomOffset !== 180 || result.motion.preset !== "cinematic") throw new Error("global settings merge failed");
const defaults = mergeGlobalSettings();
if (defaults.background.dimOpacity !== 0.5 || defaults.theme.primaryAccent !== "#00F2FE" || defaults.theme.autoContrastStroke !== true || defaults.subtitles.fontSizeZh !== 46) throw new Error("global defaults failed");
