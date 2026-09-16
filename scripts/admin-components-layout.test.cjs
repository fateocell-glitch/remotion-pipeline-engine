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
  assert.match(client, /确认保存列表修改/);
});


test("admin component tree defaults families collapsed and exposes explicit family and order controls", () => {
  assert.match(client, /buildDefaultCollapsedFamilies/);
  assert.match(client, /setCollapsedFamilies\(buildDefaultCollapsedFamilies\(next\)\)/);
  assert.match(client, /className="asset-family-select"/);
  assert.match(client, /移动至分组/);
  assert.match(client, /moveComponentWithinFamily/);
  assert.match(client, /saveTreeChanges/);
  assert.match(client, /确认保存列表修改/);
  assert.match(client, /aria-label=\{"上移 "/);
  assert.match(client, /aria-label=\{"下移 "/);
});


test("admin component tree save button exposes saving and success feedback", () => {
  assert.match(client, /treeSaveState/);
  assert.match(client, /setTreeSaveState\("saving"\)/);
  assert.match(client, /setTreeSaveState\("saved"\)/);
  assert.match(client, /保存中…/);
  assert.match(client, /已保存 ✓/);
  assert.match(client, /disabled=\{treeSaveState==="saving"\|\|\(!pendingTreeChangeCount&&treeSaveState!=="saved"\)\}/);
  assert.match(client, /列表修改已保存成功，左侧分组已更新。/);
});


test("admin component tree stage family moves maintain temporary order in source and target groups", () => {
  assert.ok(client.includes("const sourceFamily=source.family"));
  assert.ok(client.includes("setPendingFamilyOrders((current)=>{"));
  assert.ok(client.includes("const sourceOrder=effectiveComponents.filter((item)=>item.family===sourceFamily&&item.id!==componentId)"));
  assert.ok(client.includes("const targetOrder=[componentId,...effectiveComponents.filter((item)=>item.family===familyId)"));
  assert.ok(client.includes('key={component.family+":"+component.id}'));
  assert.ok(client.includes("return {...current,[sourceFamily]:sourceOrder,[familyId]:targetOrder}"));
});


test("admin component tree exposes stable family ids for duplicate display names", () => {
  assert.ok(client.includes("data-family-id={family.id}"));
  assert.ok(client.includes("other.name===item.name"));
});


test("admin component tree sorts against the rendered family container after cross-group moves", () => {
  assert.ok(client.includes("moveComponentWithinFamily=(componentId:string,familyId:string"));
  assert.ok(client.includes("effectiveComponents.filter((item)=>item.family===familyId)"));
  assert.ok(client.includes("moveComponentWithinFamily(component.id,family.id,-1)"));
  assert.ok(client.includes("moveComponentWithinFamily(component.id,family.id,1)"));
});


test("admin component tree uses family bucket ordering instead of global sort", () => {
  assert.ok(client.includes("const familyBuckets=new Map<string,ComponentAsset[]>()"));
  assert.ok(client.includes("const orderedBuckets=new Map<string,ComponentAsset[]>()"));
  assert.ok(client.includes("return components.map((component)=>{"));
});


test("admin component tree exposes searchable component filtering", () => {
  assert.ok(client.includes("searchQuery"));
  assert.ok(client.includes("componentMatchesSearch"));
  assert.ok(client.includes("filteredComponents"));
  assert.ok(client.includes("搜索组件名称 / ID / 标签"));
  assert.ok(client.includes("没有匹配的组件"));
  assert.match(page, /\.component-search/);
  assert.match(page, /\.search-summary/);
});