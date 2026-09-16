"use strict";

const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");

const root = process.cwd();
const registry = JSON.parse(readFileSync(join(root, "src", "design", "components.registry.json"), "utf8"));
const {normalizeBeatLayers} = require("./services/effect-layer-schema.cjs");

assert.equal(registry.components.length, 88, "the visual registry must contain exactly 88 assets");
assert.equal(new Set(registry.components.map((component) => component.id)).size, 88, "component IDs must be unique");

for (const component of registry.components) {
  assert.ok(component.editorSchema && Array.isArray(component.editorSchema.fields), component.id + " must define editorSchema.fields");
  assert.ok(component.mockData && typeof component.mockData === "object", component.id + " must define mockData");
  assert.ok(component.defaultPayload || component.mockData.contentPayload, component.id + " must define a default payload contract");
  const fieldKeys = new Set();
  for (const field of component.editorSchema.fields) {
    assert.equal(fieldKeys.has(field.key), false, component.id + " must not duplicate editor field " + field.key);
    fieldKeys.add(field.key);
    assert.ok(typeof field.label === "string" && field.label.length > 0, component.id + " field labels must be present");
    assert.ok(["text", "number", "textarea", "select", "string-list", "key-value-list", "chip-list", "string_array", "image"].includes(field.type || field.control), component.id + " has an unsupported editor field type");
  }
}


const iconSource = readFileSync(join(root, "src", "JasonWu", "components", "common", "IcoFontPathIcon.tsx"), "utf8");
assert.match(iconSource, /ICOFONT_GLYPHS/, "shared IcoFont SVG path pool must exist");
assert.match(iconSource, /stableIconIndex/, "shared IcoFont icon selection must be stable");
assert.match(iconSource, /usedNames/, "shared IcoFont icon selection must support per-component de-duplication");
assert.match(iconSource, /fallbackIndex/, "shared IcoFont icon selection must keep a deterministic fallback");

const textSlotSource = readFileSync(join(root, "src", "JasonWu", "components", "common", "EditableTextSlots.ts"), "utf8");
assert.match(textSlotSource, /readTextSlot/, "shared editable text slot reader must exist");
assert.match(textSlotSource, /defaultPayload/, "text slot reader must explicitly support defaultPayload fallbacks");
assert.match(textSlotSource, /value !== undefined && value !== null/, "text slot reader must not treat empty strings as missing data");
const hud = registry.components.find((component) => component.id === "hud-glow-stack");
assert.ok(hud, "hud-glow-stack must be registered");
const hudTags = hud.editorSchema.fields.find((field) => field.key === "tags");
assert.deepEqual(
  {type: hudTags?.type, control: hudTags?.control},
  {type: "string_array", control: "chip-list"},
  "HUD must expose its editable labels through the string-array contract",
);
assert.ok(Array.isArray(hud.mockData.tags), "HUD mock data must mirror chip titles into tags");
assert.ok(Array.isArray(hud.defaultPayload?.tags), "HUD default payload must expose tags");
assert.deepEqual(
  hud.mockData.tags,
  hud.mockData.contentPayload.items.map((item) => item.title),
  "HUD tag mirror must stay aligned with its rich chip payload",
);

const contentAdapter = readFileSync(join(root, "src", "design", "component-content.ts"), "utf8");
assert.match(contentAdapter, /tags:\s*values/, "renderer props must expose the canonical tags mirror");
assert.match(contentAdapter, /hydratePayload/, "renderer content adapter must defensively hydrate contentPayload from defaultPayload");
assert.match(contentAdapter, /Array\.isArray\(payload\.steps\)/, "renderer content adapter must guard step arrays before mapping");
assert.match(contentAdapter, /Array\.isArray\(payload\.items\)/, "renderer content adapter must guard chip arrays before mapping");

const studio = readFileSync(join(root, "scripts", "project-studio-page.cjs"), "utf8");
assert.match(studio, /type==="string_array"/, "Studio must render string_array fields");
assert.match(studio, /layoutProps/, "Studio must persist the canonical layoutProps contract");
assert.doesNotMatch(studio, /id="layer-position"/, "Studio must not render the retired mount-position field");

const normalized = normalizeBeatLayers({
  layout: "hud-glow-stack",
  layers: [{
    layerId: "layer-1",
    layout: "hud-glow-stack",
    commonProps: {position: "bottom-right", sceneModeOverride: "speaker_mode", alignOverride: "left"},
  }],
})[0];
assert.deepEqual(
  normalized.layoutProps,
  {sceneMode: "speaker", align: "left"},
  "legacy layout overrides must migrate to canonical layoutProps",
);
assert.equal(normalized.commonProps.position, undefined, "legacy mount position must not remain a user layout authority");
assert.equal(normalized.commonProps.sceneModeOverride, undefined, "legacy scene override must not remain after migration");
assert.equal(normalized.commonProps.alignOverride, undefined, "legacy alignment override must not remain after migration");

const motionWrapper = readFileSync(join(root, "src", "JasonWu", "components", "common", "MotionWrapper.tsx"), "utf8");
assert.match(motionWrapper, /layoutProps/, "MotionWrapper must consume the canonical layout props");
assert.doesNotMatch(motionWrapper, /anchors\[props\.position\]/, "MotionWrapper must not anchor using retired commonProps.position");
assert.doesNotMatch(motionWrapper, /--accent-primary/, "MotionWrapper must not leak semantic accent into component bodies");
assert.match(motionWrapper, /hyphens:\s*"auto"/, "English text must enable hyphenation");
assert.match(motionWrapper, /0\.85/, "English text must apply the required scale");
assert.match(motionWrapper, /1\.38/, "English text must apply the required line height");

const additions = readFileSync(join(root, "src", "JasonWu", "DemoEffectAdditions.tsx"), "utf8");
assert.match(additions, /language\?:\s*"zh"\s*\|\s*"en"/, "the standard header must receive project language");
assert.doesNotMatch(additions, /\["--component-accent" as string\]:\s*tokens\.accentColor/, "semantic accent must not be applied to the component body root");

const hudSource = readFileSync(join(root, "src", "JasonWu", "RecoveredEffectComponents.tsx"), "utf8");
assert.match(hudSource, /IcoFontPathIcon/, "HUD must use shared IcoFont SVG path icons");
assert.match(hudSource, /usedIconNames/, "HUD must avoid repeated icons inside one stack");
assert.match(hudSource, /readTextSlot/, "HUD must consume editable text through defensive text slots");

const effectLayersSource = readFileSync(join(root, "src", "JasonWu", "effectLayers.ts"), "utf8");
assert.match(effectLayersSource, /contentPayload\?: Record<string, unknown>/, "render layer type must expose layer-level contentPayload");
assert.match(effectLayersSource, /record\(layer\.contentPayload\)/, "render layer normalization must read layer-level contentPayload");
assert.match(effectLayersSource, /contentPayload=Object\.keys\(layerContentPayload\)\.length\?layerContentPayload:record\(rawPayload\.contentPayload\)/, "headless render dispatch must prefer layer-level contentPayload over stale payload mirrors");
assert.match(effectLayersSource, /effectProps:\{\.\.\.payload/, "headless render dispatch must pass normalized payload into component props");
assert.match(effectLayersSource, /contentPayload/, "headless render dispatch must preserve editable text payloads");
assert.match(effectLayersSource, /contentPayload\?: Record<string, unknown>/, "effect layer contract must expose top-level contentPayload");
assert.match(studio, /layer\.contentPayload=payload/, "Studio text slot edits must write through to layer.contentPayload");
assert.match(studio, /layer\.payload\.contentPayload=payload/, "Studio text slot edits must mirror into layer.payload.contentPayload");
assert.match(studio, /contentPayload=layer\.contentPayload\|\|\(layer\.payload\|\|\{\}\)\.contentPayload/, "Studio live preview must use the same contentPayload contract as render");

const jcCompareSource = readFileSync(join(root, "src", "JasonWu", "components", "jc", "CompareCard.tsx"), "utf8");
assert.match(jcCompareSource, /readTextSlot/, "JC compare card must use defensive text slots");
assert.match(jcCompareSource, /defaultPayload/, "JC compare card must preserve fallback payload defaults");
assert.match(jcCompareSource, /IcoFontPathIcon/, "JC compare card must use shared IcoFont SVG path icons");
console.log("qa-contract-check: 88 assets, shared editable slots, IcoFont icons, schema mirrors, layout authority, accent isolation, and English typography verified");



