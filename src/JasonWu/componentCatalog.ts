import {LAYOUT_DEFINITIONS} from "./layoutRegistry";
import type {JasonWuCue} from "./timeline";

export const COMPONENT_CATALOG_SECONDS = 5;

export type ComponentCatalogItem = {
  layout: JasonWuCue["layout"];
  zh: string;
  en: string;
  category: string;
  seconds: number;
};

export const componentCatalog: ComponentCatalogItem[] = LAYOUT_DEFINITIONS.map((definition) => ({
  layout: definition.key,
  zh: definition.meta.label,
  en: definition.key,
  category: definition.meta.category,
  seconds: COMPONENT_CATALOG_SECONDS,
}));

export const componentCatalogDurationInFrames = (fps: number) =>
  componentCatalog.length * COMPONENT_CATALOG_SECONDS * fps;
