const assert = require("node:assert/strict");
const test = require("node:test");
const draft = require("../src/JasonWu/zhuzigeTailEditorDraft.json");

test("tail editor draft exposes exactly the 15 editable tail beats", () => {
  assert.equal(draft.beats.length, 15);
  assert.equal(new Set(draft.beats.map((beat) => beat.id)).size, 15);
  assert.equal(draft.beats[0].id, "zhuzige-candidates");
  assert.equal(draft.beats.at(-1).id, "zhuzige-finale");
});

test("each editable beat keeps the caption and layout controls", () => {
  for (const beat of draft.beats) {
    assert.ok(beat.eyebrow);
    assert.ok(beat.subtitle);
    assert.ok(beat.zh);
    assert.ok(beat.en);
    assert.ok(beat.layout);
  }
});
