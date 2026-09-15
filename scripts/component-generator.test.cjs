"use strict";

const assert = require("node:assert/strict");
const {execFileSync} = require("node:child_process");
const {cpSync, existsSync, mkdirSync, readFileSync, rmSync} = require("node:fs");
const {join} = require("node:path");
const {tmpdir} = require("node:os");

const root = join(tmpdir(), "component-generator-" + process.pid + "-" + Date.now());
const copy = (relative) => {
  const target = join(root, relative);
  mkdirSync(join(target, ".."), {recursive: true});
  cpSync(relative, target, {recursive: true});
};

try {
  for (const relative of ["src", "scripts"]) copy(relative);
  execFileSync(process.execPath, ["scripts/create-component.cjs", "--root", root, "--id", "market-funnel", "--name", "漏斗转化卡", "--intent", "metrics", "--kind", "metrics"], {cwd: process.cwd(), stdio: "pipe"});

  const componentFile = join(root, "src", "JasonWu", "generated", "MarketFunnel.tsx");
  assert.equal(existsSync(componentFile), true, "generator must create a typed React component file");
  const componentSource = readFileSync(componentFile, "utf8");
  assert.match(componentSource, /LayoutEffectProps/);
  assert.match(componentSource, /props\?\.label/);
  assert.match(componentSource, /props\?\.value/);
  assert.match(componentSource, /props\?\.unit/);

  const registry = JSON.parse(readFileSync(join(root, "src", "design", "components.registry.json"), "utf8"));
  const entry = registry.components.find((component) => component.id === "market-funnel");
  assert.ok(entry, "generator must register the component asset");
  assert.equal(entry.name, "漏斗转化卡");
  assert.equal(entry.family, "metrics");
  assert.equal(entry.manifest.intent, "metrics");
  assert.equal(entry.manifest.id, "market-funnel");
  assert.deepEqual(entry.editorSchema.fields.map((field) => [field.key, field.label, field.type]), [["label", "正文内容", "text"], ["value", "指标数值", "number"], ["unit", "数字单位", "text"], ["bodyText", "正文内容", "textarea"]]);
  for (const field of entry.editorSchema.fields) assert.ok(Object.prototype.hasOwnProperty.call(entry.mockData, field.key), "mockData must contain schema field " + field.key);
  assert.equal(entry.mockData.contentPayload.type, "metrics");

  const timeline = readFileSync(join(root, "src", "JasonWu", "timeline.ts"), "utf8");
  assert.match(timeline, /\| "market-funnel"/);
  const layoutRegistry = readFileSync(join(root, "src", "JasonWu", "layoutRegistry.ts"), "utf8");
  assert.match(layoutRegistry, /MarketFunnel/);
  assert.match(layoutRegistry, /"market-funnel": \[text\("label", "正文内容"\)/);
  assert.match(layoutRegistry, /item\("market-funnel", MarketFunnel, "漏斗转化卡"/);
  assert.match(layoutRegistry, /"market-funnel": \{[\s\S]*"intent": "metrics"/);

  const recommender = readFileSync(join(root, "scripts", "services", "component-recommender.cjs"), "utf8");
  assert.match(recommender, /"market-funnel": \{intent:"metrics"/);
} finally {
  rmSync(root, {recursive: true, force: true});
}
