const assert = require("node:assert/strict");
const test = require("node:test");
const {buildAdminComponentsPage} = require("./admin-components-page.cjs");

test("admin component studio renders the three-column asset configuration shell", () => {
  const page = buildAdminComponentsPage();
  assert.match(page, /组件资产库/);
  assert.match(page, /admin-components-root/);
  assert.match(page, /admin-components.js/);
  assert.match(page, /admin-shell/);
  assert.match(page, /player-frame/);
});
