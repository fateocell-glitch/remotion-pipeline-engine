export type SemanticAccent = "blue" | "green" | "yellow" | "red";

export type AccentTheme = {
  primary: string;
  bg: string;
  glow: string;
  deep: string;
};

const ACCENT_THEMES: Record<SemanticAccent, AccentTheme> = {
  blue: {primary: "#38BDF8", bg: "rgba(56,189,248,.14)", glow: "rgba(37,99,235,.58)", deep: "#2563EB"},
  green: {primary: "#34D399", bg: "rgba(52,211,153,.14)", glow: "rgba(5,150,105,.58)", deep: "#059669"},
  yellow: {primary: "#FBBF24", bg: "rgba(251,191,36,.14)", glow: "rgba(217,119,6,.58)", deep: "#D97706"},
  red: {primary: "#F87171", bg: "rgba(248,113,113,.14)", glow: "rgba(220,38,38,.58)", deep: "#DC2626"},
};

export const getAccentTheme = (accent: SemanticAccent = "blue"): AccentTheme => ACCENT_THEMES[accent] ?? ACCENT_THEMES.blue;