const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync} = require("node:fs");
const source = readFileSync("scripts/services/face-guide-browser-check.cjs", "utf8");

test("browser screenshot check uses Windows-safe flags and a non-blocking fallback", () => {
  assert.match(source, /--no-sandbox/);
  assert.match(source, /--disable-setuid-sandbox/);
  assert.match(source, /--disable-gpu/);
  assert.match(source, /browser-check-skipped/);
  assert.doesNotMatch(source, /process\.exitCode\s*=\s*1/);
});
