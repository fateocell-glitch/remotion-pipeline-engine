"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {extractBeatContent, extractComponentPayload} = require("./beat-content-extraction.cjs");

test("separates a market-competition beat into a concise title and a distinct effect sentence", () => {
  const result = extractBeatContent("beat-015", [
    {start: 210, end: 213, zh: "随着中端寿司市场的竞争白热化"},
    {start: 213, end: 216, zh: "各大连锁品牌之间的差异化似乎正在被逐渐抹平"},
    {start: 216, end: 220, zh: "品牌需要持续做出改变和升级"},
  ], {start: 210, end: 225}, 14);

  assert.equal(result.headline, "红海竞争倒逼品牌升级");
  assert.equal(result.effectZh, "同质化加剧迫使品牌持续升级");
  assert.ok(result.headline.length >= 8 && result.headline.length <= 14);
  assert.ok(result.effectZh.length >= 10 && result.effectZh.length <= 18);
  assert.ok(result.bodyText.length >= 20 && result.bodyText.length <= 35);
  assert.notEqual(result.headline, result.effectZh);
});


test("derives a contextual second item for auto-generated multi-item cards", () => {
  const result = extractComponentPayload({
    layout: "briefing-poster",
    editorSchema: {kind: "steps", fields: [{key: "items", type: "string-list"}]},
    captions: [{start: 0, end: 5, zh: "采购成本每件压低四分钱。"}],
    copy: {
      headline: "规模采购压低单价",
      effectText: "物流效率继续摊薄固定成本",
      steps: ["采购成本持续下降"],
    },
  });
  const rows = result.contentPayload.steps.map((item) => item.text);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows, ["采购成本持续下降", "物流效率继续摊薄固定成本"]);
  assert.ok(rows.every((item) => !/识别关键机制|降低行动阻力|持续放大优势/.test(item)));
});
test("maps photo-wall copy to dedicated text fields and keeps upload fields blank", () => {
  const result = extractComponentPayload({
    layout: "photo-wall",
    editorSchema: {
      kind: "photo-wall",
      fields: [
        {key: "photoTitle1", control: "text"},
        {key: "photoSubtitle1", control: "text"},
        {key: "photo1", control: "image"},
        {key: "photoTitle2", control: "text"},
        {key: "photoSubtitle2", control: "text"},
        {key: "photo2", control: "image"},
        {key: "photoTitle3", control: "text"},
        {key: "photo3", control: "image"},
      ],
    },
    captions: [{en: "There are multiple higher education opportunities in Virginia Beach, including Regent University and Virginia Wesleyan."}],
    copy: {
      headline: "Higher Education Hub",
      effectText: "Universities expand the region's skilled talent pipeline.",
      steps: ["Regent University", "Virginia Wesleyan"],
    },
  });
  assert.deepEqual(result.fields, {
    photoTitle1: "Regent University",
    photoSubtitle1: "Universities expand the region's skilled talent pipeline.",
    photo1: "",
    photoTitle2: "Virginia Wesleyan",
    photoSubtitle2: "",
    photo2: "",
    photoTitle3: "",
    photo3: "",
  });
});
test("strips leading English conjunctions and separates body from subtext", () => {
  const result = extractBeatContent("beat-en-leisure", [
    {en: "and tackle obstacle courses. Meanwhile, golfers enjoy public courses like the Red Wing Lake Golf Course."},
  ], {start: 0, end: 10, language: "en"}, 0);
  assert.equal(result.headline, "Outdoor Leisure Mix");
  assert.equal(result.bodyText, "Outdoor attractions create a broader recreation mix for local residents.");
  assert.equal(result.effectText, "Golf courses add premium variety beside adventure activities.");
  assert.equal(/^and\b/i.test(result.bodyText), false);
  assert.notEqual(result.bodyText, result.effectText);
  assert.ok(result.bodyText.replace(/[.!?]+$/, "").split(/\s+/).length >= 10);
  assert.ok(result.bodyText.replace(/[.!?]+$/, "").split(/\s+/).length <= 18);
});
test("diversity repair prefers a second local semantic topic over a time marker", () => {
  const {enforceHeadlineDiversity} = require("./beat-content-extraction.cjs");
  const beats = [{id:"beat-001",start:0,end:12,subtitle:"市场竞争白热化",zh:"中端市场竞争升温"},{id:"beat-002",start:12,end:24,subtitle:"市场竞争白热化",zh:"品牌差异化逐渐抹平"},{id:"beat-003",start:24,end:36,subtitle:"供需缺口显现",zh:"中端需求缺少承接"},{id:"beat-004",start:36,end:48,subtitle:"供需缺口显现",zh:"排队人数持续增加"}];
  const captions = [{start:0,end:12,zh:"中端市场竞争正在白热化"},{start:12,end:18,zh:"中端市场竞争正在白热化，各大连锁品牌之间的差异化逐渐抹平"},{start:18,end:24,zh:"品牌还需要持续升级"}];
  const next = enforceHeadlineDiversity(beats,captions).beats;
  assert.equal(next[1].subtitle,"品牌差异收窄");
  assert.equal(/^核心观点 ·/.test(next[1].subtitle),false);
});


test("turns a spoken low-price fragment into an independent visual card", () => {
  const result = extractBeatContent("beat-low-price", [{start: 0, end: 6, zh: "这些东西便宜到你买的时候，可能连价格都懒得比较。"}], {start: 0, end: 6}, 0);
  assert.equal(result.headline, "超低客单绕过理性比价");
  assert.equal(result.effectZh, "价格低到让购买变成顺手决定");
  assert.ok(result.bodyText.length >= 20 && result.bodyText.length <= 35);
  assert.ok(Array.isArray(result.steps) && result.steps.length >= 2);
  assert.ok(!result.headline.includes("你买的时候"));
});

test("keeps headline, summary, and narrative body below the duplicate threshold", () => {
  const {overlap} = require("./beat-content-extraction.cjs");
  const result = extractBeatContent("beat-dedupe", [{start: 0, end: 6, zh: "这些东西便宜到你买的时候，可能连价格都懒得比较。"}], {start: 0, end: 6}, 0);
  assert.ok(overlap(result.headline, result.effectZh) < .7);
  assert.ok(overlap(result.headline, result.bodyText) < .7);
  assert.ok(overlap(result.effectZh, result.bodyText) < .7);
});

test("ships the visual-card extraction prompt contract with a bad and good few-shot example", () => {
  const {VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT} = require("./beat-extractor-prompt.cjs");
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /严禁直接机械截断原句/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /Bad Case/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /Good Case/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /8~14 字/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /多项卡片/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /Higher Education Hub/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /10~18 词/);
  assert.match(VISUAL_CARD_EXTRACTION_SYSTEM_PROMPT, /Subtext/);
});


test("extracts a second independent card for repeated small transactions", () => {
  const result = extractBeatContent("beat-frequency", [{start: 0, end: 8, zh: "一次只花几十块，但这些小交易每天重复几百万、几千万次，最后就能堆出惊人的生意。"}], {start: 0, end: 8}, 1);
  assert.equal(result.headline, "高频小额聚成大生意");
  assert.equal(result.effectZh, "海量小交易会持续累积商业规模");
});


test("turns a final small-item fragment into a complete concluding card", () => {
  const result = extractBeatContent("beat-final", [{start: 0, end: 6, zh: "真正的机会有时候就在脚边，只是大多数人嫌它太小，懒得弯腰。"}], {start: 0, end: 6}, 0);
  assert.equal(result.headline, "脚边机会常被低估");
  assert.equal(result.effectZh, "不起眼的小需求也能孕育大生意");
});


test("turns high-frequency demand and trial friction into independent business cards", () => {
  const demand = extractBeatContent("beat-demand", [{start: 0, end: 8, zh: "第一，找高品需求，不要只问什么东西最贵。普通人每天每周都会做，需求不性感但很稳定。"}], {start: 0, end: 8}, 0);
  assert.equal(demand.headline, "高频需求胜过高价单品");
  const trial = extractBeatContent("beat-trial", [{start: 0, end: 8, zh: "普通人每天每周都会做，需求不性感但很稳定。第二，降低第一次决策成本，不要一开始就让客户付一大笔钱。"}], {start: 0, end: 8}, 1);
  assert.equal(trial.headline, "稳定需求降低试用门槛");
  assert.ok(!/^(?:找|周|是|点|西)/.test(demand.headline + trial.headline));
});


test("never injects generic visual-card copy when the local caption has no exact rule", () => {
  const result = extractBeatContent("beat-no-mock", [
    {start: 0, end: 5, zh: "预订分流效率提升。社区早餐店把预订时间提前到晚上，早高峰排队明显变短。"},
    {start: 5, end: 10, zh: "顾客不用临时选择，门店也能更早安排备货。"},
  ], {start: 0, end: 10}, 0);
  const output = [result.headline, result.effectZh, result.bodyText, ...(result.steps || [])].join(" ");
  assert.doesNotMatch(output, /把局部优势做成增长结构|用更低阻力推动持续成交|真正有效的增长|识别关键机制|降低行动阻力|持续放大优势/);
  assert.ok(result.headline.length >= 4 && result.headline.length <= 15);
  assert.ok((result.steps || []).every((step) => /预订|早餐店|早高峰|顾客|门店|备货/.test(step)));
});


test("diversifies a repeated second-layer headline from the second layer's own source", () => {
  const {diversifyVisualCard} = require("./beat-content-extraction.cjs");
  const result = diversifyVisualCard({headline:"规模效应压低单位成本",effectZh:"产量越大采购物流越有成本优势",bodyText:"规模会拉开成本差距。",steps:["扩大生产数量"]}, "规模效应压低单位成本", [
    {start: 0, end: 5, zh: "采购价格、物流成本和设备效率已经完全不是一个级别。"},
  ]);
  assert.equal(result.headline, "供应链规模拉开成本差");
  assert.equal(result.effectZh, "采购物流效率决定单位成本");
});

test("assigns a commercial-analysis text role from each layer's own evidence", () => {
  const hook = extractBeatContent("beat-role-hook", [
    {start: 0, end: 8, zh: "真正的关键不是把单价抬高，而是把第一次购买的阻力降下来。"},
  ], {start: 0, end: 8, layerIndex: 0, layerCount: 2}, 0);
  const metric = extractBeatContent("beat-role-metric", [
    {start: 14, end: 25, zh: "每件只省四分钱，但一亿件的采购和物流成本会被规模持续放大。"},
  ], {start: 14, end: 25, layerIndex: 1, layerCount: 2}, 1);
  const risk = extractBeatContent("beat-role-risk", [
    {start: 14, end: 25, zh: "但是供应链一旦失控，低价策略会立刻变成库存和现金流风险。"},
  ], {start: 14, end: 25, layerIndex: 1, layerCount: 2}, 1);

  assert.equal(hook.textRole, "hook");
  assert.equal(metric.textRole, "metric");
  assert.equal(risk.textRole, "risk");
});
test("enforces the commercial two-layer role rhythm before keyword classification", () => {
  const {inferCommercialTextRole} = require("./commercial-analysis-preset.cjs");

  assert.equal(inferCommercialTextRole({
    captions: [{zh: "但是低价策略一旦失控，库存和现金流都会承压。"}],
    layerIndex: 0,
    layerCount: 2,
  }), "hook");
  assert.equal(inferCommercialTextRole({
    captions: [{zh: "通过低价入口让客户试用，再用复购把交易持续做深。"}],
    layerIndex: 0,
    layerCount: 2,
  }), "chain");
  assert.equal(inferCommercialTextRole({
    captions: [{zh: "真正关键不是价格本身，而是客户是否会持续回来购买。"}],
    layerIndex: 1,
    layerCount: 2,
  }), "verdict");
});




test("extracts schema-aware HUD chip fields with safe defaults", () => {
  const result = extractComponentPayload({
    layout: "hud-glow-stack",
    family: "metrics",
    editorSchema: {kind: "chips", fields: [{key: "tags", type: "string_array", control: "chip-list"}]},
    captions: [{start: 0, end: 6, zh: "先用低价入口降低试用门槛，然后用会员模板提高复购。"}],
    copy: {headline: "低价入口形成复购", effectText: "会员模板持续降低交易阻力", steps: ["低价入口", "会员模板", "复购提升"]},
  });
  assert.equal(result.contentPayload.type, "chips");
  assert.deepEqual(result.fields.tags, ["低价入口", "会员模板", "复购提升"]);
});

test("extracts metric value and unit fields for schema-driven metric components", () => {
  const result = extractComponentPayload({
    layout: "capital-dashboard",
    family: "metrics",
    editorSchema: {kind: "metrics", fields: [
      {key: "marketLabel", type: "text"},
      {key: "marketTo", type: "number"},
      {key: "marketSuffix", type: "text"},
      {key: "engineeringLabel", type: "text"},
      {key: "engineeringTo", type: "number"},
      {key: "engineeringSuffix", type: "text"},
    ]},
    captions: [{start: 0, end: 7, zh: "转化率直接飙到78%，复购率也提升到32%。"}],
    copy: {headline: "转化率直接飙升", effectText: "复购率同步验证增长质量", steps: ["转化率", "复购率"]},
  });
  assert.equal(result.fields.marketLabel, "转化率");
  assert.equal(result.fields.marketTo, 78);
  assert.equal(result.fields.marketSuffix, "%");
  assert.equal(result.fields.engineeringLabel, "复购率");
  assert.equal(result.fields.engineeringTo, 32);
  assert.equal(result.fields.engineeringSuffix, "%");
});

test("extracts contrast fields for bull/bear style comparison components", () => {
  const result = extractComponentPayload({
    layout: "bull-bear",
    family: "contrast",
    editorSchema: {kind: "narrative", fields: [
      {key: "bullText", type: "textarea"},
      {key: "bearText", type: "textarea"},
      {key: "highlightQuote", type: "textarea"},
    ]},
    captions: [{start: 0, end: 8, zh: "看多的是低价入口能带来复购，风险是供应链不稳会吞掉利润。"}],
    copy: {headline: "低价入口换复购", effectText: "供应链不稳会吞掉利润", bodyText: "低价入口能带来复购"},
  });
  assert.equal(result.fields.bullText, "低价入口能带来复购");
  assert.equal(result.fields.bearText, "供应链不稳会吞掉利润");
  assert.equal(result.fields.highlightQuote, "供应链不稳会吞掉利润");
});

test("auto-hydrates extracted payloads from component defaultPayload", () => {
  const result = extractComponentPayload({
    layout: "hud-glow-stack",
    family: "chips",
    editorSchema: {kind: "chips", fields: [{key: "tags", type: "string_array", control: "chip-list"}]},
    defaultPayload: {type: "chips", items: [{title: "默认标题", subtitle: "默认副标题"}]},
    captions: [{start: 0, end: 4, zh: "低价入口带来第一次试用。"}],
    copy: {headline: "低价入口", effectText: "第一次试用", steps: ["低价入口"]},
  });
  assert.equal(result.contentPayload.type, "chips");
  assert.equal(result.contentPayload.items[0].title, "低价入口");
  assert.equal(result.contentPayload.items[0].subtitle, "第一次试用");
  const sparse = extractComponentPayload({
    layout: "hud-glow-stack",
    family: "chips",
    editorSchema: {kind: "chips", fields: []},
    defaultPayload: {type: "chips", items: [{title: "默认标题", subtitle: "默认副标题", icon: "star"}]},
    captions: [],
    copy: {headline: "", effectText: "", steps: []},
  });
  assert.equal(sparse.contentPayload.items[0].subtitle, "默认副标题");
  assert.equal(sparse.contentPayload.items[0].icon, "star");
});
