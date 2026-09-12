const assert = require("node:assert/strict");
const test = require("node:test");
const subtitles = require("../src/JasonWu/zhuzigeTailSubtitleDraft.json");

test("tail subtitle draft contains timed captions for the editable tail", () => {
  assert.ok(subtitles.captions.length > 50);
  assert.ok(subtitles.captions.every((caption) => caption.start >= 222 && caption.end > caption.start));
  assert.ok(subtitles.captions.every((caption) => caption.zh && caption.en));
});
