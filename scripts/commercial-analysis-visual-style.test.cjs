"use strict";

const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const test = require("node:test");

const readSource = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("uses one wrapper-level commercial-analysis text policy instead of per-layout outline patches", () => {
  const wrapper = readSource("src/JasonWu/components/common/MotionWrapper.tsx");
  const composition = readSource("src/JasonWu/JasonWuComposition.tsx");
  const timeline = readSource("src/JasonWu/timeline.ts");

  assert.match(wrapper, /textRole\?: CommercialTextRole/);
  assert.match(timeline, /export type CommercialTextRole = "hook" \| "chain" \| "metric" \| "risk" \| "verdict"/);
  assert.match(wrapper, /motion-text-role-risk/);
  assert.match(wrapper, /-webkit-text-stroke:\s*none/);
  assert.match(wrapper, /text-shadow:\s*0 5px 18px rgba\(0,0,0,0\.52\)/);
  assert.match(composition, /textRole=\{activeLayer\.textRole\}/);
  assert.match(composition, /background: "rgba\(0, 0, 0, 0\.88\)"/);
  assert.match(composition, /WebkitTextStroke:[\s\S]{0,100}"1px rgba\(0,0,0,0\.85\)"/);
  assert.match(composition, /paintOrder: "stroke fill"/);
  assert.match(composition, /let highlighted = 0/);
  assert.match(composition, /fullKeywordPattern\.test\(part\) && highlighted < 2/);
});
