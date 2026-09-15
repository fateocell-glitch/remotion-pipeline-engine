"use strict";

const assert = require("node:assert/strict");
const {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} = require("node:fs");
const {join} = require("node:path");
const {mkdtempSync} = require("node:fs");
const {tmpdir} = require("node:os");
const {spawnSync} = require("node:child_process");

const root = process.cwd();
const registry = JSON.parse(readFileSync(join(root, "src", "design", "components.registry.json"), "utf8"));
const weights = JSON.parse(readFileSync(join(root, "src", "design", "component-weights.json"), "utf8"));
const jcDirectory = join(root, "src", "JasonWu", "components", "jc");
const jcRegistryPath = join(root, "src", "JasonWu", "jcLayoutRegistry.tsx");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const allowedIntents = new Set(["narrative", "metrics", "process", "contrast", "system"]);
const excludedSourceNames = new Set(["DesignDemo", "FontGuard", "QcProbe"]);
const payloadTypes = new Set(["narrative", "chips", "metrics", "steps"]);

const sourceFiles = existsSync(jcDirectory)
  ? readdirSync(jcDirectory).filter((file) => file.endsWith(".tsx") && !file.startsWith("jc-"))
  : [];
const jcComponents = registry.components.filter((component) => component.id.startsWith("jc-"));
const ids = registry.components.map((component) => component.id);


assert.equal(registry.components.length, 87, "registry must contain 47 existing + 2 backfilled + 38 JC visual assets");
assert.equal(new Set(ids).size, ids.length, "registry IDs must be globally unique");
assert.equal(registry.components.some((component) => component.id === "avatar-handoff"), true, "avatar-handoff must be backfilled into the registry");
assert.equal(registry.components.some((component) => component.id === "data-flow"), true, "data-flow must be backfilled into the registry");
assert.equal(jcComponents.length, 38, "registry must contain exactly 38 standalone JC visual assets");
assert.equal(sourceFiles.length, 38, "src/JasonWu/components/jc must contain exactly 38 standalone JC component source files");
assert.equal(existsSync(jcRegistryPath), true, "JC runtime layout registry must exist");
assert.ok(Array.isArray(packageJson.sideEffects) && packageJson.sideEffects.includes("src/JasonWu/components/jc/fonts.ts"), "JC font entry must be retained by the admin bundle");

for (const component of jcComponents) {
  assert.match(component.id, /^jc-(narrative|metrics|process|contrast|system)-[a-z0-9-]+$/, component.id + " must use the jc-{intent}-{name} namespace");
  assert.match(component.name, /^\[JC\]\s/, component.id + " must be labeled as an imported JC component");
  assert.ok(allowedIntents.has(component.manifest?.intent), component.id + " must declare one commercial intent");
  assert.ok(component.editorSchema && Array.isArray(component.editorSchema.fields) && component.editorSchema.fields.length > 0, component.id + " must expose a shared editor schema");
  assert.ok(component.mockData && payloadTypes.has(component.mockData.contentPayload?.type), component.id + " must expose a valid default content payload");
  assert.equal(weights[component.id], 50, component.id + " must start at the baseline recommendation weight 50");
  assert.ok(component.runtime && typeof component.runtime.exportName === "string" && component.runtime.exportName.length > 0, component.id + " must declare a runtime export");
  assert.equal(excludedSourceNames.has(component.runtime.exportName), false, component.id + " must not register a demo or infrastructure export");
}

const runtimeSource = readFileSync(jcRegistryPath, "utf8");
assert.match(runtimeSource, /SemanticAccent/);
assert.match(runtimeSource, /accent/);
assert.match(runtimeSource, /MotionWrapper/);
assert.match(runtimeSource, /jcLayoutDefinitions/);

const nativeRecipePath = join(root, "src", "JasonWu", "JcNativeRecipes.tsx");
assert.equal(existsSync(nativeRecipePath), true, "JC native recipes must preserve the original gallery composition");
const nativeRecipeSource = readFileSync(nativeRecipePath, "utf8");
assert.match(nativeRecipeSource, /JcNativeStageBackdrop/,
  "JC native recipes must provide the reference gallery StageBackdrop");
assert.match(nativeRecipeSource, /renderJcNativeRecipe/,
  "JC native recipes must render authored, per-component compositions");
assert.match(nativeRecipeSource, /radial-gradient\(100% 90% at 24% 18%, #18243a 0%, #0b0e14 48%, #07090d 100%\)/,
  "JC native stage must retain the exact reference gallery backdrop colors");
for (const component of jcComponents) {
  assert.match(nativeRecipeSource, new RegExp(`case "${component.runtime.exportName}"`),
    component.id + " must retain an authored native recipe instead of a generic fallback");
}

assert.match(runtimeSource, /JcNativeStageBackdrop/,
  "JC runtime must use the reference gallery stage backdrop");
assert.match(runtimeSource, /renderJcNativeRecipe/,
  "JC runtime must use authored native recipes instead of generic prop fabrication");
assert.doesNotMatch(runtimeSource, /PhoneConversation|WindowTranscript|ShotTranscript|BreatheComposition/,
  "JC runtime must not substitute author compositions with handcrafted lookalikes");
assert.doesNotMatch(runtimeSource, /const propsFor\s*=/,
  "JC runtime must not force generic colors or fabricated prop presets");
assert.doesNotMatch(runtimeSource, /const stageStyleFor\s*=/,
  "JC runtime must not override authored native recipe positioning");

const adminClientSource = readFileSync(join(root, "src", "design", "admin-components-client.tsx"), "utf8");
const adminSandboxSource = readFileSync(join(root, "src", "design", "AdminComponentSandbox.tsx"), "utf8");
assert.match(adminSandboxSource, /JcNativeStageBackdrop/,
  "JC sandbox must use the reference gallery StageBackdrop instead of a local background");
const catalogSource = readFileSync(join(root, "src", "JasonWu", "JasonWuComponentCatalog.tsx"), "utf8");
assert.match(catalogSource, /isNativeJc/,
  "JC catalog previews must not add the local catalog header over the reference gallery stage");
assert.match(adminClientSource, /editorSchema/);
assert.match(adminClientSource, /jcContentEditor/);
assert.match(adminSandboxSource, /usesInternalMotionWrapper/);
assert.match(adminSandboxSource, /resolveSandboxAccent/);
assert.match(adminClientSource, /const contentEditor = jcContentEditor \?\? \(isPersonRank \?/);
assert.doesNotMatch(runtimeSource, /const Body =/,
  "JC adapters must not substitute a generic body card for original component visuals");
assert.doesNotMatch(runtimeSource, /JcPayloadCaption/,
  "JC adapters must not overlay a synthetic payload caption on original component visuals");
assert.match(adminSandboxSource, /<LayoutEffectHeader cue=\{cue\} \/>/,
  "JC sandboxes must render the shared StandardComponentHeader so header template fields map into the preview");
assert.match(adminSandboxSource, /<JcNativeStageBackdrop>\{scene\}<\/JcNativeStageBackdrop>/,
  "JC sandboxes must keep the shared header outside the native recipe stage");
assert.match(runtimeSource, /preserveNativeMotion/,
  "JC adapters must preserve the original entrance animation while applying only safe positioning");
const motionWrapperSource = readFileSync(join(root, "src", "JasonWu", "components", "common", "MotionWrapper.tsx"), "utf8");
assert.doesNotMatch(motionWrapperSource, /contrastCss|autoContrastStroke/,
  "MotionWrapper must not inject legacy contrast CSS that resets native JC text shadows");
assert.doesNotMatch(readFileSync(__filename, "utf8"), /skipped:\s*true/);

const buildRoot = mkdtempSync(join(tmpdir(), "jc-registry-build-"));
const buildDesignDirectory = join(buildRoot, "src", "design");
mkdirSync(buildDesignDirectory, {recursive: true});
copyFileSync(join(root, "src", "design", "components.registry.json"), join(buildDesignDirectory, "components.registry.json"));
copyFileSync(join(root, "src", "design", "component-weights.json"), join(buildDesignDirectory, "component-weights.json"));
const buildRegistryPath = join(buildDesignDirectory, "components.registry.json");
const buildRegistry = JSON.parse(readFileSync(buildRegistryPath, "utf8"));
const savedJc = buildRegistry.components.find((component) => component.id === "jc-metrics-bar-chart");
savedJc.name = "[JC] 已保存的管理员名称";
savedJc.tokens.padding = 91;
savedJc.mockData.contentPayload = {type: "metrics", value: 93, unit: "%", label: "已保存指标", detailText: "管理员已保存的模板内容。"};
savedJc.version = 9;
writeFileSync(buildRegistryPath, JSON.stringify(buildRegistry, null, 2));
const build = spawnSync(process.execPath, [join(root, "scripts", "build-jc-registry.cjs")], {cwd: buildRoot, encoding: "utf8"});
assert.equal(build.status, 0, build.stderr || build.stdout);
const rebuilt = JSON.parse(readFileSync(buildRegistryPath, "utf8")).components.find((component) => component.id === "jc-metrics-bar-chart");
assert.equal(rebuilt.name, "[JC] 已保存的管理员名称");
assert.equal(rebuilt.tokens.padding, 91);
assert.equal(rebuilt.mockData.contentPayload.label, "已保存指标");
assert.equal(rebuilt.version, 9);

console.log(JSON.stringify({
  jcAssets: jcComponents.length,
  totalAssets: registry.components.length,
  sourceFiles: sourceFiles.length,
  idsUnique: true,
  accentBridge: true,
}, null, 2));
