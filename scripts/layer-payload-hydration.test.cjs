"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {hydrateLayerWithPayload} = require("./layout-matcher.cjs");

const captions = [
  {start: 0, end: 4, zh: "一件商品只赚一毛钱，但一天卖一百万件就完全不同。"},
  {start: 4, end: 8, zh: "采购价格、物流成本和设备效率都会随着走量继续下降。"},
  {start: 8, end: 12, zh: "低价入口让客户先试一次，再形成长期复购。"},
];
const copy = {headline:"规模效应压低单位成本",effectText:"走量拉开采购与物流成本差",effectZh:"走量拉开采购与物流成本差",bodyText:"当销量持续放大，采购、物流和设备效率会同步压低单位成本。",steps:["提高销售数量","压低采购成本","形成复购规模"]};
const forbidden = /识别关键机制|降低行动阻力|持续放大优势|核心信息|视觉节奏|行动结论/;

for (const layout of ["capital-dashboard", "hud-glow-stack", "briefing-poster", "value-verdict", "cook-machine"]) {
  test(layout + " hydrates its schema from current captions instead of registry mock data", () => {
    const payload = hydrateLayerWithPayload(layout, copy, captions);
    const text = JSON.stringify(payload);
    assert.doesNotMatch(text, forbidden);
    assert.ok(payload.contentPayload, "must persist a canonical contentPayload");
    assert.match(text, /采购|物流|走量|低价|复购|一百万|销售/);
    if (layout === "capital-dashboard") {
      assert.notEqual(payload.marketTo, 100);
      assert.notEqual(payload.engineeringTo, 25);
      assert.ok(String(payload.marketLabel).trim());
      assert.ok(String(payload.engineeringLabel).trim());
    }
    if (layout === "hud-glow-stack") assert.ok(payload.contentPayload.items.length >= 2);
    if (layout === "briefing-poster") assert.ok(payload.contentPayload.steps.length >= 2);
    if (layout === "value-verdict") assert.ok(payload.contentPayload.bodyText.includes("采购"));
    if (layout === "cook-machine") { assert.ok(String(payload.leftValue).trim()); assert.ok(String(payload.rightValue).trim()); }
  });
}
