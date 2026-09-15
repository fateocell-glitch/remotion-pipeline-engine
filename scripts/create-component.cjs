"use strict";

const {existsSync, mkdirSync, readFileSync, writeFileSync} = require("node:fs");
const {join} = require("node:path");

const VALID_INTENTS = new Set(["process", "metrics", "narrative", "contrast", "system"]);
const VALID_KINDS = new Set(["metrics", "steps", "chips", "narrative"]);
const FAMILY_BY_KIND = {
  metrics: "metrics",
  steps: "steps",
  chips: "chips",
  narrative: "narrative",
};
const LAYOUT_CATEGORY_BY_KIND = {
  metrics: "data",
  steps: "story",
  chips: "interactive",
  narrative: "typography",
};
const FIELD_PRESETS = {
  metrics: [
    {key: "label", label: "正文内容", type: "text"},
    {key: "value", label: "指标数值", type: "number"},
    {key: "unit", label: "数字单位", type: "text"},
    {key: "bodyText", label: "正文内容", type: "textarea"},
  ],
  steps: [
    {key: "items", label: "步骤列表", type: "string-list", description: "每项对应一个步骤节点"},
    {key: "bodyText", label: "正文内容", type: "textarea"},
  ],
  chips: [
    {key: "items", label: "标签内容", type: "string-list", description: "每项对应一个标签"},
    {key: "bodyText", label: "正文内容", type: "textarea"},
  ],
  narrative: [
    {key: "bodyText", label: "正文内容", type: "textarea"},
    {key: "highlightQuote", label: "副文内容", type: "textarea"},
  ],
};
const MOCK_BY_KIND = {
  metrics: {label: "核心信息", value: 76, unit: "%", bodyText: "展示可编辑的真实组件预设"},
  steps: {items: ["第一步", "第二步", "第三步"], bodyText: "展示可编辑的真实组件预设"},
  chips: {items: ["核心信息", "视觉节奏", "行动结论"], bodyText: "展示可编辑的真实组件预设"},
  narrative: {bodyText: "展示可编辑的真实组件预设", highlightQuote: "真实组件预设说明"},
};

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) args[key] = true;
    else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function pascalCase(id) {
  return id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}

function assertInput(args) {
  if (!args.id || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(args.id)) throw new Error("--id must be kebab-case, for example market-funnel");
  if (!args.name) throw new Error("--name is required");
  if (!VALID_INTENTS.has(args.intent)) throw new Error("--intent must be one of " + Array.from(VALID_INTENTS).join(", "));
  if (!VALID_KINDS.has(args.kind)) throw new Error("--kind must be one of " + Array.from(VALID_KINDS).join(", "));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function buildComponentSource(componentName, displayName, fields) {
  const accessors = fields.map((field) => {
    if (field.type === "number") return `  const ${field.key} = Number(props?.${field.key} ?? 0);`;
    if (field.type === "string-list") return `  const ${field.key} = Array.isArray(props?.${field.key}) ? props.${field.key} : [];`;
    return `  const ${field.key} = String(props?.${field.key} ?? "");`;
  });
  return [
    `import type {LayoutEffectProps} from "../DemoEffectComponents";`,
    ``,
    `export function ${componentName}({props}: LayoutEffectProps) {`,
    ...accessors,
    `  return (`,
    `    <div style={{position: "relative", width: "100%", minHeight: 220, color: "white"}}>`,
    `      <div style={{fontSize: 18, opacity: 0.72}}>{props?.category ?? "${displayName}"}</div>`,
    `      <div style={{fontSize: 34, fontWeight: 800, marginTop: 8}}>{props?.headline ?? "${displayName}"}</div>`,
    `      <div style={{marginTop: 22, display: "grid", gap: 10}}>` ,
    ...fields.map((field) => field.type === "string-list"
      ? `        {${field.key}.map((item, index) => <div key={index} style={{fontSize: 22, fontWeight: 700}}>{String(item)}</div>)}`
      : `        <div style={{fontSize: 22, fontWeight: 700}}>{${field.key}}${field.key === "value" ? " {unit}" : ""}</div>`),
    `      </div>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
  ].join("\n");
}

function insertBefore(source, marker, text) {
  if (source.includes(text.trim())) return source;
  const index = source.indexOf(marker);
  if (index === -1) throw new Error("Could not find marker: " + marker);
  return source.slice(0, index) + text + source.slice(index);
}

function upsertRegistry(root, args, fields) {
  const registryPath = join(root, "src", "design", "components.registry.json");
  const registry = readJson(registryPath);
  if (registry.components.some((component) => component.id === args.id)) throw new Error("Component already exists in registry: " + args.id);
  const mock = {
    headline: args.name,
    category: args.intent.toUpperCase(),
    ...MOCK_BY_KIND[args.kind],
    contentPayload: {type: args.kind, ...MOCK_BY_KIND[args.kind]},
  };
  registry.components.push({
    id: args.id,
    name: args.name,
    family: FAMILY_BY_KIND[args.kind],
    description: args.description || `${args.intent} · generated component`,
    tags: [args.intent, args.kind],
    data: args.kind === "metrics" ? ["number", "text"] : args.kind === "narrative" ? ["text"] : ["list", "text"],
    version: 1,
    tokens: {
      mountMode: "top-left",
      mountX: 0,
      mountY: 0,
      boundsX: 120,
      boundsY: 300,
      boundsWidth: 520,
      boundsHeight: 260,
      padding: 48,
      gap: 16,
      position: "center",
      scale: 0.85,
      spring: "spring-up",
      sfx: "none",
      accentColor: "#00F2FE",
      defaultItemCount: args.kind === "metrics" || args.kind === "narrative" ? 1 : 3,
      staggerFrames: 12,
      headerScale: 1,
      contentScale: 1,
    },
    sfx: {enter: "none", exit: "none", volume: 0.65},
    mockData: mock,
    editorSchema: {fields},
    manifest: {
      id: args.id,
      intent: args.intent,
      capacity: {minItems: args.kind === "metrics" || args.kind === "narrative" ? 1 : 2, maxItems: args.kind === "metrics" || args.kind === "narrative" ? 1 : 5},
      keywords: [args.name, args.intent, args.kind],
      visualWeight: "medium",
    },
    displayIntent: args.intent,
  });
  writeJson(registryPath, registry);
}

function updateTimeline(root, id) {
  const path = join(root, "src", "JasonWu", "timeline.ts");
  let source = readFileSync(path, "utf8");
  if (!source.includes(`| "${id}"`)) {
    const jcFallback = /\n\s+\| `jc-\$\{string\}`;/;
    if (jcFallback.test(source)) {
      source = source.replace(jcFallback, `\n    | "${id}"\n    | \`jc-\${string}\`;`);
    } else {
      source = source.replace(/(\s+layout:[\s\S]*?)(;\n\s+people\?:)/, `$1\n    | "${id}"$2`);
    }
  }
  writeFileSync(path, source);
}

function updateLayoutRegistry(root, args, componentName, fields) {
  const path = join(root, "src", "JasonWu", "layoutRegistry.ts");
  let source = readFileSync(path, "utf8");
  const importLine = `import {${componentName}} from "./generated/${componentName}";\n`;
  source = insertBefore(source, `import type {JasonWuCue}`, importLine);
  const fieldExpression = "[" + fields.map((field) => {
    if (field.type === "text") return `text("${field.key}", "${field.label}")`;
    if (field.type === "textarea") return `prose("${field.key}", "${field.label}")`;
    if (field.type === "string-list") return `list("${field.key}", "${field.label}"${field.description ? `, "${field.description}"` : ""})`;
    return `{key:"${field.key}",label:"${field.label}",type:"number"}`;
  }).join(", ") + "]";
  source = insertBefore(source, `};\nexport const LAYOUT_MANIFEST`, `  "${args.id}": ${fieldExpression},\n`);
  const manifestEntry = [
    `  "${args.id}": {`,
    `    "id": "${args.id}",`,
    `    "intent": "${args.intent}",`,
    `    "capacity": {"minItems": ${args.kind === "metrics" || args.kind === "narrative" ? 1 : 2}, "maxItems": ${args.kind === "metrics" || args.kind === "narrative" ? 1 : 5}},`,
    `    "keywords": ["${args.name}", "${args.intent}", "${args.kind}"],`,
    `    "visualWeight": "medium"`,
    `  },`,
  ].join("\n") + "\n";
  source = insertBefore(source, `};\nconst mergeFields`, manifestEntry);
  const layoutItem = `  item("${args.id}", ${componentName}, "${args.name}", "${args.description || `${args.intent} · generated component`}", "${LAYOUT_CATEGORY_BY_KIND[args.kind]}", "primary", [], {}),\n`;
  source = insertBefore(source, `];\n\nexport const LAYOUT_BY_KEY`, layoutItem);
  writeFileSync(path, source);
}

function updateRecommender(root, args) {
  const path = join(root, "scripts", "services", "component-recommender.cjs");
  let source = readFileSync(path, "utf8");
  const family = args.kind === "steps" ? "F2_TIMELINE_PROCESS" : args.kind === "metrics" ? "F1_QUANTITATIVE" : args.kind === "chips" ? "F5_SPECS_MULTIDIM" : "F3_ARGUMENT_CONFLICT";
  const data = args.kind === "metrics" ? `["number","text"]` : args.kind === "narrative" ? `["text"]` : `["list","text"]`;
  const entry = `  "${args.id}": {intent:"${args.intent}", capacity:{minItems:${args.kind === "metrics" || args.kind === "narrative" ? 1 : 2},maxItems:${args.kind === "metrics" || args.kind === "narrative" ? 1 : 5}}, keywords:["${args.name}","${args.intent}","${args.kind}"], visualWeight:"medium", family:"${family}", tags:["${args.intent}","${args.kind}"], data:${data}},\n`;
  const marker = /};\r?\n\r?\nconst registeredJcAssets =/;
  if (!marker.test(source)) throw new Error("Could not find componentManifest insertion point");
  source = source.replace(marker, `  ${entry}};\n\nconst registeredJcAssets =`);
  writeFileSync(path, source);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  assertInput(args);
  const root = args.root || process.cwd();
  const fields = FIELD_PRESETS[args.kind];
  const componentName = pascalCase(args.id);
  const componentDir = join(root, "src", "JasonWu", "generated");
  mkdirSync(componentDir, {recursive: true});
  const componentPath = join(componentDir, `${componentName}.tsx`);
  if (existsSync(componentPath)) throw new Error("Component file already exists: " + componentPath);
  writeFileSync(componentPath, buildComponentSource(componentName, args.name, fields));
  upsertRegistry(root, args, fields);
  updateTimeline(root, args.id);
  updateLayoutRegistry(root, args, componentName, fields);
  updateRecommender(root, args);
  console.log(`Created component ${args.id} (${args.name})`);
}

main();
