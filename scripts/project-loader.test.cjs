const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const {buildSync} = require("esbuild");

function loadProjectLoader() {
  const result = buildSync({
    entryPoints: ["src/JasonWu/projectLoader.ts"],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "es2018",
    write: false,
  });
  const module = {exports: {}};
  new Function("module", "exports", "require", result.outputFiles[0].text)(module, module.exports, require);
  return module.exports;
}

test("project transcript merges adjacent short bilingual cues into a readable display group", () => {
  const {projectToTranscript} = loadProjectLoader();
  const transcript = projectToTranscript({
    captions: [
      {start: 0, end: 1.1, zh: "这是一个", en: "This is a"},
      {start: 1.1, end: 2.2, zh: "完整的字幕", en: "complete subtitle"},
      {start: 2.2, end: 3.4, zh: "句组测试", en: "grouping test"},
      {start: 3.4, end: 4.8, zh: "可以显示更多内容。", en: "that shows more content."},
      {start: 5.8, end: 6.6, zh: "下一句独立显示。", en: "The next sentence stands alone."},
    ],
  });

  assert.equal(transcript.length, 2);
  assert.deepEqual(transcript[0], {
    start: 0,
    end: 4.8,
    zh: "这是一个完整的字幕句组测试可以显示更多内容。",
    en: "This is a complete subtitle grouping test that shows more content.",
  });
});
