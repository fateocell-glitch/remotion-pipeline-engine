"use strict";

const assert = require("node:assert/strict");
const {buildPage} = require("./project-studio-page.cjs");
const {getComponentRegistrySync} = require("./services/component-registry-store.cjs");

const registry = getComponentRegistrySync(process.cwd());
const layoutMetadata = registry.components.map((component) => ({
  key: component.id,
  label: component.name,
  category: component.family === "metrics" ? "data" : component.family === "narrative" ? "story" : "interactive",
  family: component.family,
  fields: [],
  defaults: component.mockData || {},
  editorSchema: component.editorSchema || null,
}));
const html = buildPage(layoutMetadata);
const encoded = (value) => String(value ?? "").replace(/[^\x20-\x7e]/g, (char) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0"));
const schemaFields = (id) => registry.components.find((component) => component.id === id)?.editorSchema?.fields?.map((field) => field.label) || [];

assert.ok(html.includes("当前效果类型： "), "Studio inspector must show the selected layout as the compact panel title");
assert.equal(html.includes("头信息模块"), false, "Studio inspector must not show redundant header-module copy");
assert.equal(html.includes("专属内容模块 / 沙盒示例"), false, "Studio inspector must not show redundant schema-module copy");
assert.ok(html.includes("data-schema-field"), "Studio content fields must be bound by editorSchema field keys");
assert.ok(html.includes("data-schema-list"), "Studio list fields must be bound by editorSchema list keys");
assert.ok(html.includes("renderEditorSchemaFields(layer,layout.editorSchema)+\"</div>"), "Studio must not append legacy generic prop fields after schema fields");
assert.equal(html.includes("renderEditorSchemaFields(layer,layout.editorSchema)+propFields(layer)"), false, "Studio schema mirror must not mix in the old generic prop form");

assert.ok(html.includes('fields.map((field)=>schemaFieldMarkup(field,schemaFieldValue(layer,field,payload))).join("")'), "Studio must render content fields in the exact editorSchema order");
assert.ok(html.includes('document.querySelectorAll(\"[data-schema-field]\")'), "Studio save path must read schema scalar fields back into layer payload");
assert.ok(html.includes('document.querySelectorAll(\"[data-schema-list]\")'), "Studio save path must read schema list fields back into layer payload");
assert.ok(html.includes("applySchemaPayload(layer,schema)"), "Studio save path must hydrate shared content payload after schema edits");

for (const label of schemaFields("capital-dashboard")) {
  assert.ok(html.includes(encoded(label)), "Studio page payload must include capital-dashboard schema label: " + label);
}
for (const label of schemaFields("ordered-sequence")) {
  assert.ok(html.includes(encoded(label)), "Studio page payload must include ordered-sequence schema label: " + label);
}
for (const label of schemaFields("hud-glow-stack")) {
  assert.ok(html.includes(encoded(label)), "Studio page payload must include HUD schema label: " + label);
}

console.log("Studio schema mirror form regression passed.");
const studioSource = require("node:fs").readFileSync("scripts/project-studio-page.cjs", "utf8");
assert.ok(studioSource.includes('if(state.state==="idle"||state.state==="failed"){'), "single-beat polling must reconcile a missing transient job before showing a failure");
assert.ok(studioSource.includes('const recoveredProject=await api("/api/projects/"+encodeURIComponent(APP.projectId));'), "single-beat polling must verify persisted render state after a transient job lookup");
