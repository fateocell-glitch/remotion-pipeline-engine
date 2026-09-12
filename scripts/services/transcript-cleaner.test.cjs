"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {cleanCaptionText, cleanWhisperTranscript} = require("./transcript-cleaner.cjs");

test("cleans only Whisper text while retaining timestamp and row metadata", () => {
  const source = {
    result: {language: "zh"},
    transcription: [
      {offsets: {from: 1200, to: 3400}, text: "我們在做 A I 晶片，Dipsick Dipsick。", speaker: "host"},
      {offsets: {from: 3400, to: 5200}, text: "然後 i Pad 的體驗要看。"},
    ],
  };
  const cleaned = cleanWhisperTranscript(source, {now: new Date("2026-09-11T12:00:00.000Z")});

  assert.deepEqual(
    cleaned.transcription.map((row) => ({offsets: row.offsets, speaker: row.speaker})),
    source.transcription.map((row) => ({offsets: row.offsets, speaker: row.speaker})),
  );
  assert.deepEqual(
    cleaned.transcription.map((row) => row.text),
    ["我们在做 AI 晶片，DeepSeek。", "iPad 的体验要看。"],
  );
  assert.equal(cleaned.cleaning.changedCount, 2);
  assert.equal(cleaned.cleaning.mode, "context-aware-local");
});

test("keeps unrelated spoken wording intact", () => {
  assert.equal(cleanCaptionText("这个方案需要三个月验证。"), "这个方案需要三个月验证。");
});


test("normalizes foldable iPhone aliases only when the transcript establishes that product context", () => {
  const cleaned = cleanWhisperTranscript({
    transcription: [
      {text: "苹果对于折痕下足功夫，太坚守的版做了很多层"},
      {text: "iPhone丢使用纳米瘟里玻璃，支持Apple Pencil和MacSafe"},
      {text: "它达到iP68等级，并搭载AR20 Pro"},
    ],
  });
  assert.deepEqual(cleaned.transcription.map((row) => row.text), [
    "苹果对于折痕下足功夫，钛金属基板做了很多层",
    "iPhone Duo使用纳米纹理玻璃，支持Apple Pencil和MagSafe",
    "它达到IP68等级，并搭载A20 Pro",
  ]);
  assert.equal(cleanCaptionText("太坚守的版需要验证。"), "太坚守的版需要验证。");
});

test("normalizes ASCII punctuation in Chinese transcript text", () => {
  assert.equal(cleanCaptionText("Hello大家好,今天说折痕."), "Hello大家好，今天说折痕。");
});