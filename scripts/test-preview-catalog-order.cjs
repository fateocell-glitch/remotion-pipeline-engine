"use strict";
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const sourceFile = readFileSync("scripts/render-preview-catalog-animations.cjs", "utf8");
const order = ["platform-shift-line", "tradeoff-reject-round", "recovery-progress-bars", "hud-glow-stack", "briefing-poster", "rewind-milestones", "flying-paper-stack", "checklist-editorial", "spotlight-question"];
let previous = -1;
for (const key of order) { const index = sourceFile.indexOf(String.fromCharCode(34) + key + String.fromCharCode(34)); assert.ok(index > previous, "preview catalog order is out of sync at " + key); previous = index; }
console.log(JSON.stringify({result: "preview catalog order matches component registry tail"}));
