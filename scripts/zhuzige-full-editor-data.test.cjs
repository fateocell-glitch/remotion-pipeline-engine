const assert = require("node:assert/strict");
const test = require("node:test");
const beats = require("../src/JasonWu/zhuzigeEditorDraft.json");
const subtitles = require("../src/JasonWu/zhuzigeSubtitleDraft.json");

test("full editor draft retains all 31 beats", () => {
  assert.equal(beats.beats.length, 31);
  assert.equal(beats.beats[0].id, "zhuzige-succession");
  assert.equal(beats.beats.at(-1).id, "zhuzige-finale");
});

test("full subtitle editor draft covers the source duration", () => {
  assert.ok(subtitles.captions.length >= 200);
  assert.equal(subtitles.captions[0].start, 0);
  assert.equal(subtitles.captions.at(-1).end, 442.62);
});
