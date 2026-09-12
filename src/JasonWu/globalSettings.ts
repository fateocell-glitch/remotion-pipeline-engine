import type {CSSProperties} from "react";

export type CardStyle = "glass" | "opaque";

export type GlobalVideoSettings = {
  background: {dimOpacity: number; blurRadius: number; vignette: boolean};
  theme: {primaryAccent: string; cardStyle: CardStyle; autoContrastStroke: boolean};
  subtitles: {bottomOffset: number; fontSizeZh: number; fontSizeEn: number; highlightColor: string};
  motion: {preset: string};
};

export const DEFAULT_GLOBAL_SETTINGS: GlobalVideoSettings = {
  background: {dimOpacity: 0, blurRadius: 0, vignette: false},
  theme: {primaryAccent: "#00F2FE", cardStyle: "glass", autoContrastStroke: true},
  subtitles: {bottomOffset: 120, fontSizeZh: 46, fontSizeEn: 22, highlightColor: "#F59E0B"},
  motion: {preset: "tech-snappy"},
};

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, numeric));
};

export const mergeGlobalSettings = (input?: Partial<GlobalVideoSettings>): GlobalVideoSettings => ({
  background: {
    dimOpacity: clamp(input?.background?.dimOpacity, 0, 0.9, DEFAULT_GLOBAL_SETTINGS.background.dimOpacity),
    blurRadius: clamp(input?.background?.blurRadius, 0, 20, DEFAULT_GLOBAL_SETTINGS.background.blurRadius),
    vignette: typeof input?.background?.vignette === "boolean" ? input.background.vignette : DEFAULT_GLOBAL_SETTINGS.background.vignette,
  },
  theme: {
    primaryAccent: typeof input?.theme?.primaryAccent === "string" && /^#[0-9a-f]{6}$/i.test(input.theme.primaryAccent) ? input.theme.primaryAccent : DEFAULT_GLOBAL_SETTINGS.theme.primaryAccent,
    cardStyle: input?.theme?.cardStyle === "opaque" ? "opaque" : "glass",
    autoContrastStroke: typeof input?.theme?.autoContrastStroke === "boolean" ? input.theme.autoContrastStroke : true,
  },
  subtitles: {
    bottomOffset: clamp(input?.subtitles?.bottomOffset, 60, 200, DEFAULT_GLOBAL_SETTINGS.subtitles.bottomOffset),
    fontSizeZh: clamp(input?.subtitles?.fontSizeZh, 36, 60, DEFAULT_GLOBAL_SETTINGS.subtitles.fontSizeZh),
    fontSizeEn: clamp(input?.subtitles?.fontSizeEn, 18, 32, DEFAULT_GLOBAL_SETTINGS.subtitles.fontSizeEn),
    highlightColor: typeof input?.subtitles?.highlightColor === "string" && /^#[0-9a-f]{6}$/i.test(input.subtitles.highlightColor) ? input.subtitles.highlightColor : DEFAULT_GLOBAL_SETTINGS.subtitles.highlightColor,
  },
  motion: {preset: typeof input?.motion?.preset === "string" && input.motion.preset ? input.motion.preset : DEFAULT_GLOBAL_SETTINGS.motion.preset},
});

export const globalSettingsStyle = (settings: GlobalVideoSettings): CSSProperties => ({
  ["--primary-accent" as string]: settings.theme.primaryAccent,
});
