"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {validateBeatIntegrity, shouldAbortForStall, diagnoseRenderFailure} = require("./beat-render-guard.cjs");

const props = (enterOffset, duration) => ({enterOffset, duration, exitOffset: 0});
const validChineseBeat = () => ({
  id: "beat-001",
  start: 0,
  end: 30,
  effectProps: {headline: "市场竞争白热化", effectText: "中端品牌加速下沉抢夺用户"},
  layers: [
    {layout: "ordered-sequence", effectProps: {headline: "市场竞争白热化", effectText: "中端品牌加速下沉抢夺用户", steps: ["需求验证", "形成判断"]}, commonProps: props(0, 14)},
    {layout: "diagonal-chips", effectProps: {headline: "市场竞争白热化", effectText: "中端品牌加速下沉抢夺用户", items: ["市场收缩", "渠道下沉"]}, commonProps: props(14.5, 15)}
  ]
});

test("accepts an independently-written Chinese beat with clean handoff", () => {
  const result = validateBeatIntegrity(validChineseBeat(), {language: "zh"});
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("accepts a mixed Chinese product headline inside a Chinese project", () => {
  const beat = validChineseBeat();
  beat.effectProps.headline = "iPhone Duo 细节";
  beat.layers.forEach((layer) => { layer.effectProps.headline = "iPhone Duo 细节"; });
  const result = validateBeatIntegrity(beat, {language: "zh"});
  assert.equal(result.valid, true);
  assert.equal(result.errors.some((item) => item.code === "headline-zh-length"), false);
});

test("rejects duplicated headline and effect copy", () => {
  const beat = validChineseBeat();
  beat.effectProps.effectText = beat.effectProps.headline;
  const result = validateBeatIntegrity(beat, {language: "zh"});
  assert.ok(result.errors.some((error) => error.code === "copy-duplicate"));
});

test("rejects multi-item component values with no real content", () => {
  const beat = validChineseBeat();
  beat.layers[0].effectProps.steps = ["", "核心判断"];
  const result = validateBeatIntegrity(beat, {language: "zh"});
  assert.ok(result.errors.some((error) => error.code === "component-items"));
});

test("allows one real briefing-poster item", () => {
  const beat = validChineseBeat();
  beat.layers[0] = {
    layout: "briefing-poster",
    payload: {items: ["单价之外，采购与物流效率共同决定实际成交成本。"]},
    commonProps: props(0, 14)
  };
  const result = validateBeatIntegrity(beat, {language: "zh"});
  assert.equal(result.errors.some((error) => error.code === "component-items"), false);
});

test("allows one real checklist-editorial item", () => {
  const beat = validChineseBeat();
  beat.layers[0] = {
    layout: "checklist-editorial",
    payload: {items: ["先验证真实需求，再把交付路径压缩到可复购的流程。"]},
    commonProps: props(0, 14)
  };
  const result = validateBeatIntegrity(beat, {language: "zh"});
  assert.equal(result.errors.some((error) => error.code === "component-items"), false);
});

test("rejects dangling English headlines", () => {
  const beat = {id: "beat-en", start: 0, end: 24, effectProps: {headline: "Fast Growth and", effectText: "Margins compress as premium demand weakens across markets"}, layers: [{layout: "value-verdict", effectProps: {headline: "Fast Growth and", effectText: "Margins compress as premium demand weakens across markets"}, commonProps: props(0, 20)}]};
  const result = validateBeatIntegrity(beat, {language: "en"});
  assert.ok(result.errors.some((error) => error.code === "headline-en-ending"));
});

test("detects a silent low-CPU renderer but tolerates active CPU", () => {
  assert.equal(shouldAbortForStall({now: 31000, lastProgressAt: 0, previousCpuSeconds: 10, currentCpuSeconds: 10.01}), true);
  assert.equal(shouldAbortForStall({now: 31000, lastProgressAt: 0, previousCpuSeconds: 10, currentCpuSeconds: 11}), false);
});

test("maps failure output to a usable diagnosis", () => {
  assert.equal(diagnoseRenderFailure("JavaScript heap out of memory"), "系统内存不足");
  assert.equal(diagnoseRenderFailure("Error in composition"), "组件动画异常或 Chromium 渲染异常");
});


test("accepts multi-item Layer payloads without legacy effectProps", () => {
  const beat = validChineseBeat();
  beat.layers = [
    {layout: "ordered-sequence", payload: {items: ["需求验证", "形成判断"]}, commonProps: props(0, 14)},
    {layout: "clipboard-note", payload: {items: ["核心发现", "结果验证"]}, commonProps: props(14.5, 15)},
  ];
  const result = validateBeatIntegrity(beat, {language: "zh"});
  assert.equal(result.errors.some((error) => error.code === "component-items"), false);
});

test("allows an absorbed terminal tail up to 38 seconds only on the final Beat", () => {
  const beat = {id:"beat-010",start:297.51,end:333.18,layout:"chapter-card",effectProps:{headline:"结尾结论",effectText:"收束全文观点"},terminalTailAbsorbed:{sourceBeatId:"beat-011",tailDuration:2.94},layers:[{layout:"chapter-card",effectProps:{headline:"结尾结论",effectText:"收束全文观点"},commonProps:props(0,35.67)}]};
  const result = validateBeatIntegrity(beat, {beats:[beat]});
  assert.equal(result.errors.some((error) => error.code === "beat-duration"), false);
});

test("allows a clipboard note with one supporting label and narrative body", () => {
  const beat = validChineseBeat();
  beat.layers = [
    {layout: "clipboard-note", payload: {bodyText: "单件利润再薄，只要交易频次和规模足够高，固定成本就会被持续摊薄。", items: ["提高购买频次"]}, commonProps: props(0, 14)},
    {layout: "hud-glow-stack", payload: {items: ["扩大生产数量", "优化采购物流", "拉开成本差距"]}, commonProps: props(14.5, 15)},
  ];
  const result = validateBeatIntegrity(beat, {language: "zh"});
  assert.equal(result.errors.some((error) => error.code === "component-items"), false);
});

