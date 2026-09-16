"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");

const {inferCommercialTextRole, inferSemanticAccent, assignSemanticAccent} = require("./services/commercial-analysis-preset.cjs");
const {extractBeatContent} = require("./services/beat-content-extraction.cjs");
const {autoMatchProject} = require("./layout-matcher.cjs");

const readSource = (relative) => readFileSync(join(process.cwd(), relative), "utf8");

test("maps commercial roles and emotion words into semantic accent colors", () => {
  assert.equal(inferSemanticAccent({role: "risk", text: "供应链失控会带来亏损和库存风险"}), "red");
  assert.equal(inferSemanticAccent({role: "metric", text: "复购增长让利润持续生效"}), "green");
  assert.equal(inferSemanticAccent({role: "hook", text: "真正反直觉的机会点在这里"}), "yellow");
  assert.equal(inferSemanticAccent({role: "chain", text: "低价入口到试用再到自动复购"}), "blue");
});

test("alternates soft blue and yellow accents to avoid adjacent color collision", () => {
  assert.equal(assignSemanticAccent({role: "chain", text: "商业链路继续推进", previousAccent: "blue"}), "yellow");
  assert.equal(assignSemanticAccent({role: "hook", text: "新的机会点继续出现", previousAccent: "yellow"}), "blue");
  assert.equal(assignSemanticAccent({role: "risk", text: "亏损风险继续扩大", previousAccent: "red"}), "red");
  assert.equal(assignSemanticAccent({role: "metric", text: "利润增长继续扩大", previousAccent: "green"}), "green");
});

test("beat extraction returns role and accent alongside the legacy textRole", () => {
  const metric = extractBeatContent("beat-metric-accent", [
    {start: 0, end: 8, zh: "复购率提升到78%，利润增长已经开始生效。"},
  ], {start: 0, end: 8, layerIndex: 0, layerCount: 1}, 0);
  assert.equal(metric.role, "metric");
  assert.equal(metric.textRole, "metric");
  assert.equal(metric.accent, "green");
});

test("auto matched project persists role and accent on every layer", () => {
  const project = {
    projectId: "qa-semantic-accent",
    fps: 30,
    captions: [
      {start: 0, end: 8, zh: "第一阶段先用低价入口让用户试用。"},
      {start: 8, end: 16, zh: "复购率提升到78%，利润增长开始生效。"},
      {start: 16, end: 24, zh: "但是供给失控会导致库存和现金流风险。"},
    ],
    beats: [
      {id: "beat-1", start: 0, end: 8, subtitle: "低价入口", zh: "先让用户试用", layout: "hud-glow-stack", effectProps: {}},
      {id: "beat-2", start: 8, end: 16, subtitle: "复购增长", zh: "利润增长", layout: "capital-dashboard", effectProps: {}},
      {id: "beat-3", start: 16, end: 24, subtitle: "风险提示", zh: "库存风险", layout: "tradeoff-reject-round", effectProps: {}},
    ],
  };
  const next = autoMatchProject(project, {force: true, effectsPerBeat: 1});
  for (const beat of next.beats) {
    for (const layer of beat.layers) {
      assert.ok(["hook", "chain", "metric", "risk", "verdict"].includes(layer.role), layer.layerId + " must persist role");
      assert.ok(["blue", "green", "yellow", "red"].includes(layer.accent), layer.layerId + " must persist accent");
      assert.equal(layer.payload.role, layer.role);
      assert.equal(layer.payload.accent, layer.accent);
    }
  }
});

test("semantic accent source hooks are scoped to the shared header and Studio controls", () => {
  const tokens = readSource("src/design/tokens.ts");
  const wrapper = readSource("src/JasonWu/components/common/MotionWrapper.tsx");
  const header = readSource("src/JasonWu/DemoEffectAdditions.tsx");
  const studio = readSource("scripts/project-studio-page.cjs");

  assert.match(tokens, /getAccentTheme/);
  assert.match(tokens, /#38BDF8/);
  assert.match(tokens, /#34D399/);
  assert.match(tokens, /#FBBF24/);
  assert.match(tokens, /#F87171/);
  assert.match(header, /getAccentTheme\(accent\)/);
  assert.match(header, /accent\?: SemanticAccent/);
  assert.doesNotMatch(wrapper, /getAccentTheme|--accent-primary|--accent-bg|--accent-glow/);
  assert.match(studio, /语义主题色/);
  assert.match(studio, /data-accent-option/);
  assert.match(studio, /setLayerAccent/);
});
test("selected semantic accent reaches Studio preview and native JC runtime", () => {
  const studio = readSource("scripts/project-studio-page.cjs");
  const preview = readSource("src/JasonWu/StudioLivePreview.tsx");
  const layers = readSource("src/JasonWu/effectLayers.ts");

  assert.match(studio, /accent:layer\.accent\|\|"blue"/);
  assert.match(preview, /__jcUseLayerAccent:true/);
  assert.match(layers, /const isNativeJc=String\(layer\.layout\)\.startsWith\("jc-"\)/);
  assert.match(layers, /__jcUseLayerAccent:true/);
});
test("multi-item recovered components keep private color palettes instead of semantic accent pollution", () => {
  const recovered = readSource("src/JasonWu/RecoveredEffectComponents.tsx");
  const component = recovered.slice(recovered.indexOf("export const FlyingPaperStack"), recovered.indexOf("export const ChecklistEditorial"));
  assert.match(component, /const cards: Array<\[number, number, string\]>=\[\[-90,-45,GOLD\],\[0,0,GOLD\],\[90,45,GOLD\]\]/);
  assert.doesNotMatch(component, /\[\[-90,-45,BLUE\],\[0,0,BLUE\],\[90,45,RED\]\]/);
});


test("JC clone cascade keeps source multicolor while warning chip follows layer accent", () => {
  const cloneCascade = readSource("src/JasonWu/components/jc/CloneCascade.tsx");
  const recipe = readSource("src/JasonWu/JcNativeRecipes.tsx");

  assert.match(cloneCascade, /SOURCE_PALETTE = \['#4D9EFF', '#FFC53D', '#3DDC84', '#B26BFF'\]/);
  assert.match(cloneCascade, /linear-gradient\(135deg, \$\{blue\}, \$\{gold\}, \$\{green\}, \$\{purple\}\) border-box/);
  assert.match(cloneCascade, /drop-shadow\(0 0 10px \$\{blue\}AA\).*drop-shadow\(0 0 24px \$\{purple\}44\)/s);
  assert.match(recipe, /case "CloneCascade":[\s\S]*<jc\.CloneCascade[\s\S]*accent=\{color\("red"\)\}/);
});


test("JC compare card logo tiles use private multicolor glow palette", () => {
  const compareCard = readSource("src/JasonWu/components/jc/CompareCard.tsx");

  assert.match(compareCard, /LOGO_PALETTE = \['#4D9EFF', '#FFC53D', '#3DDC84', '#B26BFF'\]/);
  assert.match(compareCard, /logoColor = LOGO_PALETTE\[index % LOGO_PALETTE\.length\]/);
  assert.match(compareCard, /linear-gradient\(135deg, \$\{logoColor\}, \$\{logoGlow\}, rgba\(255,255,255,0\.86\)\) border-box/);
  assert.match(compareCard, /drop-shadow\(0 0 9px \$\{logoColor\}AA\).*drop-shadow\(0 0 18px \$\{logoGlow\}66\)/s);
});test("subtitle plate masks burned-in captions without a heavy double outline", () => {
  const composition = readSource("src/JasonWu/JasonWuComposition.tsx");
  assert.match(composition, /background: "rgba\(0, 0, 0, 0\.88\)"/);
  assert.match(composition, /WebkitTextStroke: subtitleSettings\.theme\.autoContrastStroke \? "1px rgba\(0,0,0,0\.85\)" : "none"/);
  assert.match(composition, /paintOrder: "stroke fill"/);
});
test("classifies final business judgment as verdict before weak risk wording", () => {
  const {inferCommercialTextRole} = require("./services/commercial-analysis-preset.cjs");
  const role = inferCommercialTextRole({text: "最终判断好生意，只看复购能不能覆盖获客。"});
  assert.equal(role, "verdict");
  assert.equal(inferSemanticAccent({role, text: "最终判断好生意，只看复购能不能覆盖获客。"}), "green");
});
