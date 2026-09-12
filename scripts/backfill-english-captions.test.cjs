const assert = require("node:assert/strict");
const test = require("node:test");

const {applyEnglishCaptions} = require("./backfill-english-captions.cjs");

test("fills only blank English captions and preserves manual English edits", () => {
  const project = {
    captions: [
      {id: "subtitle-001", start: 0, end: 1, zh: "中文一", en: ""},
      {id: "subtitle-002", start: 1, end: 2, zh: "中文二", en: "Manual sentence."},
    ],
  };

  const result = applyEnglishCaptions(project, [
    {id: "subtitle-001", start: 0, end: 1, zh: "", en: "Translated one."},
    {id: "subtitle-002", start: 1, end: 2, zh: "", en: "Translated two."},
  ]);

  assert.equal(result.captions[0].en, "Translated one.");
  assert.equal(result.captions[1].en, "Manual sentence.");
});
