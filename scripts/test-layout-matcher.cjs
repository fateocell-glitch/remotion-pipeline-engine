"use strict";

const assert = require("node:assert/strict");
const {autoMatchProject, inferLayoutFromContent} = require("./layout-matcher.cjs");
const {buildBeatContext, classifyBeatIntent, componentManifest, funnelPickComponent, getCandidatePool} = require("./services/component-recommender.cjs");

const intentOf = (layout) => componentManifest[layout]?.intent;
const log = (label, result) => console.log(label + " -> " + result.componentId + " [" + componentManifest[result.componentId].intent + "] pool=" + result.candidatePool.map((item) => item.id).join(","));

function assertRoute(text, expectedIntents, label) {
  const context = buildBeatContext({text, captions: [{start: 0, end: 5, zh: text}], beatIndex: 1, totalBeats: 10});
  const classified = classifyBeatIntent(context);
  const pool = getCandidatePool(classified, []);
  assert.ok(pool.length >= 3 && pool.length <= 5, label + " candidate pool must be 3-5 components");
  const result = funnelPickComponent(context, 0, []);
  log(label, result);
  assert.ok(expectedIntents.includes(componentManifest[result.componentId].intent), label + " routed to " + componentManifest[result.componentId].intent);
  return result;
}

const processRoute = assertRoute("第一阶段做贴纸，第二阶段卖服务，最后把客户沉淀到长期复购流程里。", ["process"], "process sample");
assert.equal(componentManifest[processRoute.componentId].intent, "process");

const metricsRoute = assertRoute("转化率直接飙到 78%，客单价翻倍，增长速度比之前快了三倍。", ["metrics"], "metrics sample");
assert.equal(componentManifest[metricsRoute.componentId].intent, "metrics");
assert.ok(componentManifest[metricsRoute.componentId].keywords.some((keyword) => /%|增长|转化|数据|指标/.test(keyword)), "metrics route must carry metric keywords");

assertRoute("这其实就是底层商业闭环，前端获客、中台交付、后端复购全部连起来。", ["system", "narrative"], "system narrative sample");

const layerOne = funnelPickComponent(buildBeatContext({text: "真正的价值不是机器，而是把用户需求变成一句清晰观点。", beatIndex: 2, totalBeats: 10, layerIndex: 0, layerCount: 2}), 0, []);
const layerTwo = funnelPickComponent(buildBeatContext({text: "这意味着品牌主张必须更清楚，用户才会记住这个核心结论。", beatIndex: 2, totalBeats: 10, layerIndex: 1, layerCount: 2}), 1, [{layout: layerOne.componentId, intent: componentManifest[layerOne.componentId].intent, family: componentManifest[layerOne.componentId].family}]);
log("layer complement L1", layerOne);
log("layer complement L2", layerTwo);
assert.notEqual(componentManifest[layerOne.componentId].intent, componentManifest[layerTwo.componentId].intent, "two adjacent layers must not use the same intent");
if (componentManifest[layerOne.componentId].intent === "narrative") assert.ok(["metrics", "system"].includes(componentManifest[layerTwo.componentId].intent), "narrative layer should be complemented by metrics/system");

const captions = [
  "第一阶段做贴纸，第二阶段卖服务，第三阶段做复购。",
  "转化率直接飙到 78%，客单价翻倍。",
  "这其实就是底层商业闭环。",
  "不要只看机器成本，真正风险是交付不稳定。",
  "然后把订单、设计、生产、发货串成流程。",
  "利润率从 12% 提升到 31%。",
  "核心观点是小机器背后有大生意。",
  "组织分工变成获客、设计、交付三个系统。",
  "最后用清单确认下一步动作。",
  "相比过去，这套模型更像一个可复制的经营系统。",
];
const project = {projectId: "qa-funnel", fps: 30, globalSettings: {}, captions: captions.map((zh, index) => ({id: "c" + index, start: index * 6, end: index * 6 + 5, zh, en: ""})), beats: captions.map((zh, index) => ({id: "b" + index, start: index * 6, end: index * 6 + 5, eyebrow: "QA", subtitle: zh.slice(0, 12), zh, en: "", layout: "diagonal-chips", layoutLocked: false, effectProps: {}}))};
const routed = autoMatchProject(project, {force: true, effectsPerBeat: 1});
const layouts = routed.beats.map((beat) => beat.layout);
console.log("10 beat route -> " + layouts.map((layout) => layout + ":" + intentOf(layout)).join(" | "));
for (let index = 1; index < layouts.length; index += 1) assert.notEqual(layouts[index], layouts[index - 1], "no consecutive duplicate layouts at beat " + index);
assert.ok(new Set(layouts).size >= Math.ceil(layouts.length * .6), "fatigue routing should keep at least 60% of layouts distinct across the project");
const expected = ["process", "metrics", "system", "contrast", "process", "metrics", "narrative", "system", "process", "system"];
for (let index = 0; index < routed.beats.length; index += 1) assert.equal(intentOf(routed.beats[index].layout), expected[index], "beat " + index + " must match expected intent");

console.log("Two-tier layout matcher regression passed.");