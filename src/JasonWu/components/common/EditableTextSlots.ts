type TextRecord = Record<string, unknown> | undefined | null;

const presentText = (value: unknown): string | undefined => {
  if (value !== undefined && value !== null) return typeof value === "string" ? value : String(value);
  return undefined;
};

export const readTextSlot = (
  props: TextRecord,
  key: string,
  defaultPayload?: TextRecord,
  fallback = "",
) => {
  const value = presentText(props?.[key]);
  if (value !== undefined) return value;
  const defaultValue = presentText(defaultPayload?.[key]);
  if (defaultValue !== undefined) return defaultValue;
  return fallback;
};

export const readTextSlots = (
  props: TextRecord,
  keys: string[],
  defaultPayload?: TextRecord,
  fallbacks: string[] = [],
) => keys.map((key, index) => readTextSlot(props, key, defaultPayload, fallbacks[index] ?? ""));
