const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync, existsSync} = require("node:fs");
const {join} = require("node:path");

const root = process.cwd();
const registry = JSON.parse(readFileSync(join(root, "src", "design", "components.registry.json"), "utf8"));

test("speaker-growth-dashboard is registered with editable growth dashboard fields", () => {
  const component = registry.components.find((item) => item.id === "speaker-growth-dashboard");
  assert.ok(component, "component registry should include speaker-growth-dashboard");
  assert.equal(component.family, "metrics");
  assert.equal(component.manifest.intent, "metrics");

  const fieldKeys = component.editorSchema.fields.map((field) => field.key);
  assert.deepEqual(fieldKeys, [
    "eyebrow",
    "subline",
    "skillLabel",
    "feature1Title",
    "feature1Sub",
    "feature2Title",
    "feature2Sub",
    "metricTitle",
    "metricValue",
    "metricUnit",
    "metricSub",
    "footer",
  ]);

  for (const key of fieldKeys) {
    assert.ok(Object.prototype.hasOwnProperty.call(component.mockData, key), `mockData should include ${key}`);
  }
});

test("speaker-growth-dashboard runtime component and studio labels are wired", () => {
  const layoutRegistry = readFileSync(join(root, "src", "JasonWu", "layoutRegistry.ts"), "utf8");
  const timeline = readFileSync(join(root, "src", "JasonWu", "timeline.ts"), "utf8");
  const componentPath = join(root, "src", "JasonWu", "SpeakerGrowthDashboard.tsx");

  assert.ok(existsSync(componentPath), "runtime component file should exist");
  assert.match(layoutRegistry, /SpeakerGrowthDashboard/);
  assert.match(layoutRegistry, /speaker-growth-dashboard/);
  assert.match(layoutRegistry, /口播增长仪表盘/);
  assert.match(timeline, /"speaker-growth-dashboard"/);

  const componentSource = readFileSync(componentPath, "utf8");
  const component = registry.components.find((item) => item.id === "speaker-growth-dashboard");
  assert.equal(component.mockData.eyebrow, "LIVE · AI AGENT");
  assert.match(componentSource, /GROWTH ENGINE/);
  assert.match(componentSource, /165/);
});

test("speaker-growth-dashboard layout offsets keep standard header independent", () => {
  const componentSource = readFileSync(join(root, "src", "JasonWu", "SpeakerGrowthDashboard.tsx"), "utf8");
  assert.match(componentSource, /top: 0/);
  assert.match(componentSource, /translate\(\$\{enterX\}px, 150px\)/);
  assert.match(componentSource, /bottom: 86/);
  assert.doesNotMatch(componentSource, /background: "linear-gradient\(90deg, rgba\(3,8,18/);
  assert.doesNotMatch(componentSource, /boxShadow: "36px 0 80px/);
});
test("speaker-growth-dashboard avoids duplicating the standard header inside animated content", () => {
  const componentSource = readFileSync(join(root, "src", "JasonWu", "SpeakerGrowthDashboard.tsx"), "utf8");
  assert.doesNotMatch(componentSource, /textProp\(props, "eyebrow"/);
  assert.doesNotMatch(componentSource, /textProp\(props, "subline"/);
  assert.match(componentSource, /FeatureIcon/);
  assert.match(componentSource, /ICOFONT_GLYPHS/);
  assert.match(componentSource, /stableIconIndex/);
  assert.match(componentSource, /data-icofont-name/);
});
test("speaker-growth-dashboard keeps the large brand title inside animated content", () => {
  const componentSource = readFileSync(join(root, "src", "JasonWu", "SpeakerGrowthDashboard.tsx"), "utf8");
  assert.match(componentSource, /textProp\(props, "headline", "Hermes"\)/);
  assert.match(componentSource, /textProp\(props, "skillLabel", "自媒体运营 SKILL"\)/);
});
test("speaker-growth-dashboard pins the large brand block near the lower content slot", () => {
  const componentSource = readFileSync(join(root, "src", "JasonWu", "SpeakerGrowthDashboard.tsx"), "utf8");
  assert.match(componentSource, /const BrandBlock/);
  assert.match(componentSource, /bottom: 185/);
  assert.match(componentSource, /height: 179/);
});
test("speaker-growth-dashboard admin content panel exposes every visible text slot", () => {
  const adminSource = readFileSync(join(root, "src", "design", "admin-components-client.tsx"), "utf8");
  assert.match(adminSource, /isSpeakerGrowthDashboard/);
  assert.match(adminSource, /默认内容模板 \/ 沙盒示例 · 指标/);
  for (const label of ["功能1【正文内容】", "功能1【副文内容】", "功能2【正文内容】", "功能2【副文内容】", "增长指标标题", "增长数字", "数字单位", "指标副文", "品牌大标题", "能力标签", "底部说明"]) {
    assert.match(adminSource, new RegExp(label));
  }
  for (const key of ["feature1Title", "feature1Sub", "feature2Title", "feature2Sub", "metricTitle", "metricValue", "metricUnit", "metricSub", "headline", "skillLabel", "footer"]) {
    assert.match(adminSource, new RegExp("textarea rows=\\{2\\} value=\\{toStringValue\\(draft\\.mockData\\." + key));
  }
});

test("speaker-growth-dashboard uses extracted IcoFont SVG paths with stable random selection", () => {
  const componentSource = readFileSync(join(root, "src", "JasonWu", "SpeakerGrowthDashboard.tsx"), "utf8");
  for (const icon of ["chat", "comment", "reply", "send-mail", "signal", "share", "paper-plane", "plus-circle"]) {
    assert.match(componentSource, new RegExp('name: "' + icon + '"'));
  }
  assert.match(componentSource, /<g transform="translate\(0 850\) scale\(1 -1\)">/);
  assert.match(componentSource, /<FeatureIcon seed=\{`\$\{title\}\|\$\{sub\}\|\$\{index\}`\} \/>/);
  assert.match(componentSource, /<IcoFontPathIcon seed=\{textProp\(props, "metricTitle", "入群率 猛增"\)\} color=\{GREEN\} \/>/);
  assert.doesNotMatch(componentSource, /kind: "reply" \| "user"/);
});
