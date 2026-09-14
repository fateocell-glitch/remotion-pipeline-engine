const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync} = require("node:fs");

const componentRegistry = JSON.parse(readFileSync("src/design/components.registry.json", "utf8"));
const layoutRegistry = readFileSync("src/JasonWu/layoutRegistry.ts", "utf8");

test("value verdict is a registered renderable component", () => {
  const verdict = componentRegistry.components.find((component) => component.id === "value-verdict");
  assert.ok(verdict, "value-verdict must be an editable component asset");
  assert.match(layoutRegistry, /import \{ValueVerdict\} from "\.\/ValueVerdict";/);
  assert.match(layoutRegistry, /item\("value-verdict", ValueVerdict,/);
});
