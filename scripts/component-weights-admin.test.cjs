"use strict";

const assert = require("node:assert/strict");
const {existsSync, readFileSync} = require("node:fs");
const test = require("node:test");

const read = (file) => existsSync(file) ? readFileSync(file, "utf8") : "";

test("super-admin exposes an editable component priority table backed by the weight API", () => {
  const page = read("scripts/component-weights-page.cjs");
  const client = read("src/design/component-weights-client.tsx");
  const host = read("scripts/project-editor-web.cjs");

  assert.match(page, /组件命中优先级/);
  assert.match(client, /\/api\/admin\/component-weights/);
  assert.match(client, /<table/);
  assert.match(host, /\/api\/admin\/component-weights/);
});
