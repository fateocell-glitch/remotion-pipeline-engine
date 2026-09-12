import {componentCatalog, COMPONENT_CATALOG_SECONDS} from "./componentCatalog";
import {LAYOUT_DEFINITIONS} from "./layoutRegistry";

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

assert(
  componentCatalog.length === LAYOUT_DEFINITIONS.length,
  "The component catalog must include every registered layout.",
);

assert(
  componentCatalog.every((item) => item.seconds === COMPONENT_CATALOG_SECONDS),
  "Each catalog item must play for the configured five-second duration.",
);
