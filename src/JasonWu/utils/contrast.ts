import type {CSSProperties} from "react";

const normalize = (color: string) => color.trim().toLowerCase();
const isWhite = (color: string) => ["#fff", "#ffffff", "white", "rgba(255,255,255,1)"].indexOf(normalize(color)) !== -1;
const isDark = (color: string) => ["#000", "#000000", "black", "#0b0f17", "#111827"].indexOf(normalize(color)) !== -1;

export const getContrastStyle = (color: string, enabled = true): CSSProperties => {
  if (!enabled) return {};
  if (isWhite(color)) return {WebkitTextStroke: "2px rgba(0,0,0,0.88)", textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 3px #000"};
  if (isDark(color)) return {WebkitTextStroke: "1px rgba(255,255,255,0.85)", textShadow: "0 2px 6px rgba(255,255,255,0.4)"};
  return {};
};
