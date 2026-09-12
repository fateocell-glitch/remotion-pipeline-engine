const assert = require("node:assert/strict");
const test = require("node:test");
const {generateInitialBeats} = require("./generate-beat-plan.cjs");

test("keeps a short no-caption source whole instead of creating a fragment", () => {
  const beats = generateInitialBeats(31);
  assert.equal(beats.length, 1);
  assert.deepEqual(beats.map(({id, start, end}) => ({id, start, end})), [
    {id: "beat-001", start: 0, end: 31},
  ]);
  assert.ok(beats.every((beat) => beat.layout === "chapter-card"));
});

test("supports a per-project target duration and fractional final beat", () => {
  const beats = generateInitialBeats(25.5, 10);
  assert.deepEqual(beats.map(({start, end}) => ({start, end})), [
    {start: 0, end: 10},
    {start: 10, end: 20},
    {start: 20, end: 25.5},
  ]);
});

test("rejects invalid durations instead of emitting unusable plans", () => {
  assert.throws(() => generateInitialBeats(0), /positive/);
  assert.throws(() => generateInitialBeats(20, 0), /positive/);
});


test("snaps 20-second targets to natural punctuation and silence boundaries", () => {
  const captions = [
    {start:0,end:6,zh:"开场铺垫"},
    {start:6,end:12,zh:"继续说明"},
    {start:12,end:18,zh:"关键结论"},
    {start:18,end:22.5,zh:"第一段完整结束。"},
    {start:22.5,end:30,zh:"第二段展开"},
    {start:30,end:39,zh:"继续说明"},
    {start:39,end:44,zh:"第二段完整结束。"},
    {start:44,end:48,zh:"第三段开始"},
    {start:48,end:53,zh:"静音前的最后一句"},
    {start:53.8,end:59,zh:"静音后的下一句"},
  ];
  const beats = generateInitialBeats(59,20,captions);
  assert.deepEqual(beats.map((beat) => ({start:beat.start,end:beat.end})), [{start:0,end:22.5},{start:22.5,end:53},{start:53,end:59}]);
  assert.ok(beats.slice(0,-1).every((beat) => beat.end - beat.start >= 22 && beat.end - beat.start <= 35));
});


test("never cuts through an active Whisper caption when sentence punctuation is unavailable", () => {
  const captions = [{start:0,end:9.8,zh:"第一段铺垫"},{start:9.8,end:20.6,zh:"继续说明"},{start:20.6,end:29.7,zh:"关键论点尚未结束"},{start:29.7,end:32.4,zh:"完整端点"},{start:32.4,end:41.8,zh:"下一段开始"}];
  const beats = generateInitialBeats(41.8, 30, captions);
  assert.equal(beats[0].end, 29.7);
  assert.ok(captions.some((caption) => caption.end === beats[0].end));
});


test("rejects subtitle endpoints whose next cue proves the sentence continues", () => {
  const captions = [{start:0,end:12,zh:"开场说明"},{start:12,end:22,zh:"如果你的网页没有被收录"},{start:22,end:25,zh:"AI就算在聪明"},{start:25,end:29,zh:"也根本捞不到内容来写答案"},{start:29,end:35,zh:"下一段完整结论。"}];
  const beats = generateInitialBeats(35, 30, captions);
  assert.equal(beats[0].end, 35);
  assert.notEqual(beats[0].end, 25);
});


test("merges a semantic tail shorter than the minimum beat duration into its preceding beat", () => {
  const captions = [
    {start: 0, end: 30, zh: "第一段完整结束。"},
    {start: 30, end: 33.5, zh: "大家可以参考一下。"},
  ];
  const beats = generateInitialBeats(33.5, 30, captions);
  assert.deepEqual(beats.map((beat) => ({start: beat.start, end: beat.end})), [{start: 0, end: 33.5}]);
});
