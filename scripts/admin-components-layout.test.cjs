const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync} = require("node:fs");

const page = readFileSync("scripts/admin-components-page.cjs", "utf8");
const client = readFileSync("src/design/admin-components-client.tsx", "utf8");

test("admin component studio pins the live stage and stages family moves before confirmation", () => {
  assert.match(page, /\.admin-shell\{[\s\S]*height:100vh;overflow:hidden/);
  assert.match(page, /\.admin-tree,.admin-inspector,.admin-preview\{min-width:0;height:100vh\}/);
  assert.match(page, /\.tree-scroll\{min-height:0;flex:1;overflow-y:auto/);
  assert.match(page, /\.admin-preview\{[\s\S]*position:sticky;top:0/);
  assert.match(page, /\.asset\{display:grid;grid-template-columns:16px minmax\(0,1fr\);width:100%/);
  assert.match(client, /pendingFamilyMoves/);
  assert.match(client, /stageFamilyMove/);
  assert.match(client, /saveFamilyMoves/);
  assert.match(client, /确认保存拖拽修改/);
});
