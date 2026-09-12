"use strict";

const componentRegistry = {
  "capital-dashboard": {family: "F1_QUANTITATIVE", tags: ["metrics", "market", "growth"], data: ["number", "percentage"]},
  "engineering-return": {family: "F1_QUANTITATIVE", tags: ["metrics", "hardware", "product"], data: ["number", "comparison"]},
  "progress-donut": {family: "F1_QUANTITATIVE", tags: ["metrics", "confirmation", "progress"], data: ["percentage"]},
  "recovery-progress-bars": {family: "F1_QUANTITATIVE", tags: ["metrics", "process", "progress"], data: ["list", "percentage"]},
  "data-flow": {family: "F1_QUANTITATIVE", tags: ["metrics", "comparison", "market"], data: ["number", "comparison"]},
  "platform-shift-line": {family: "F1_QUANTITATIVE", tags: ["metrics", "timeline", "product"], data: ["list", "number"]},
  "hud-glow-stack": {family: "F1_QUANTITATIVE", tags: ["metrics", "product", "statement"], data: ["list", "number"]},

  "ordered-sequence": {family: "F2_TIMELINE_PROCESS", tags: ["process", "steps"], data: ["list"]},
  "event-timeline": {family: "F2_TIMELINE_PROCESS", tags: ["timeline", "process"], data: ["list", "time"]},
  "rewind-milestones": {family: "F2_TIMELINE_PROCESS", tags: ["timeline", "process", "product"], data: ["list", "time"]},
  "time-rewind": {family: "F2_TIMELINE_PROCESS", tags: ["timeline", "statement"], data: ["time"]},
  "route-map": {family: "F2_TIMELINE_PROCESS", tags: ["process", "market"], data: ["list"]},
  "check-progress": {family: "F2_TIMELINE_PROCESS", tags: ["process", "confirmation", "progress"], data: ["list", "percentage"]},
  "org-chart": {family: "F2_TIMELINE_PROCESS", tags: ["process", "person", "organization"], data: ["list"]},
  "draw-line": {family: "F2_TIMELINE_PROCESS", tags: ["process", "timeline", "statement"], data: ["time"]},

  "zoom-statement": {family: "F3_ARGUMENT_CONFLICT", tags: ["statement", "comparison", "verdict"], data: ["text"]},
  "opinion-hero": {family: "F3_ARGUMENT_CONFLICT", tags: ["statement", "person", "verdict"], data: ["text"]},
  "bare-typography": {family: "F3_ARGUMENT_CONFLICT", tags: ["statement", "verdict"], data: ["text"]},
  "spotlight-question": {family: "F3_ARGUMENT_CONFLICT", tags: ["statement", "question", "comparison"], data: ["text"]},
  "bull-bear": {family: "F3_ARGUMENT_CONFLICT", tags: ["comparison", "market", "risk"], data: ["comparison"]},
  "market-battlefield": {family: "F3_ARGUMENT_CONFLICT", tags: ["comparison", "market", "competition"], data: ["comparison", "list"]},
  "tradeoff-reject-round": {family: "F3_ARGUMENT_CONFLICT", tags: ["risk", "comparison", "warning"], data: ["list"]},
  "reject-list": {family: "F3_ARGUMENT_CONFLICT", tags: ["risk", "warning", "process"], data: ["list"]},

  "person-rank": {family: "F4_ENTITIES_HARDWARE", tags: ["person", "organization", "leadership"], data: ["person", "comparison"]},
  "avatar-handoff": {family: "F4_ENTITIES_HARDWARE", tags: ["person", "leadership", "timeline"], data: ["person", "comparison"]},
  "product-explosion": {family: "F4_ENTITIES_HARDWARE", tags: ["product", "hardware", "spec"], data: ["list"]},
  "cook-machine": {family: "F4_ENTITIES_HARDWARE", tags: ["product", "hardware", "process"], data: ["list"]},
  "photo-wall": {family: "F4_ENTITIES_HARDWARE", tags: ["person", "product", "market"], data: ["list"]},
  "logo-wordmark": {family: "F4_ENTITIES_HARDWARE", tags: ["product", "market", "statement"], data: ["text"]},

  "diagonal-chips": {family: "F5_SPECS_MULTIDIM", tags: ["product", "hardware", "spec"], data: ["list"]},
  "floating-chips": {family: "F5_SPECS_MULTIDIM", tags: ["product", "spec", "market"], data: ["list"]},
  "desktop-folders": {family: "F5_SPECS_MULTIDIM", tags: ["process", "product", "spec"], data: ["list"]},
  "clipboard-note": {family: "F5_SPECS_MULTIDIM", tags: ["process", "confirmation", "statement"], data: ["list"]},
  "briefing-poster": {family: "F5_SPECS_MULTIDIM", tags: ["market", "statement", "product"], data: ["list", "text"]},
  "screen-recording": {family: "F5_SPECS_MULTIDIM", tags: ["process", "product", "spec"], data: ["list"]},
  "flying-paper-stack": {family: "F5_SPECS_MULTIDIM", tags: ["process", "statement", "market"], data: ["list"]},

  "chapter-card": {family: "F6_CHAPTER_VERDICT", tags: ["chapter", "statement", "verdict"], data: ["text"]},
  "value-verdict": {family: "F6_CHAPTER_VERDICT", tags: ["metrics", "verdict", "statement"], data: ["number", "text"]},
  "closing-checklist": {family: "F6_CHAPTER_VERDICT", tags: ["confirmation", "verdict", "checklist"], data: ["list"]},
  "checklist-editorial": {family: "F6_CHAPTER_VERDICT", tags: ["confirmation", "statement", "checklist"], data: ["list"]},
  "finale-kinetic": {family: "F6_CHAPTER_VERDICT", tags: ["chapter", "statement", "verdict"], data: ["text"]},
  "pivot-list": {family: "F6_CHAPTER_VERDICT", tags: ["comparison", "statement", "verdict"], data: ["list", "text"]},
  "newspaper-swap": {family: "F6_CHAPTER_VERDICT", tags: ["comparison", "market", "verdict"], data: ["comparison", "text"]},
};

const tagPatterns = [
  ["metrics", /(?:revenue|growth|margin|percentage|valuation|roi|metrics|\$\d|\d+%)/i],
  ["growth", /(?:growth|expand|increase|scale|upside)/i],
  ["comparison", /(?:however|contrary|versus|vs\.?|trade-?off|but|rather than)/i],
  ["process", /(?:first|second|third|roadmap|phases|process|workflow|step|execution)/i],
  ["steps", /(?:first|second|third|step \d|phase \d)/i],
  ["timeline", /(?:roadmap|evolution|history|phase|timeline|next generation|next-gen)/i],
  ["hardware", /(?:architecture|specs?|latency|bandwidth|hardware|silicon|chip)/i],
  ["spec", /(?:architecture|specs?|latency|bandwidth|hardware|silicon)/i],
  ["market", /(?:market|revenue|margin|valuation|demand|customer|competition)/i],
  ["competition", /(?:competition|competitive|market share|race)/i],
  ["risk", /(?:risk|critical|trade-?off|myth|warning|downside)/i],
  ["statement", /(?:critical|key|thesis|verdict|breakthrough|strategy)/i],
  ["metrics", /(?:\d+(?:\.\d+)?%|\d[\d,.]*\s*(?:亿|万|年|款|美元|元|倍)|[$￥]|增长|下降|市值|营收|估值|份额|排名|比例)/],
  ["growth", /(?:增长|提升|上升|扩大|翻倍|爆发|增长率)/],
  ["comparison", /(?:但是|不过|相比|对比|取舍|优于|不如|而不是|转向|放弃|逆转|差异)/],
  ["process", /(?:首先|其次|然后|步骤|流程|路径|阶段|执行|如何|方法|操作|推进)/],
  ["steps", /(?:第[一二三四五六七八九十\d]|第一步|第二步|第三步|步骤|流程)/],
  ["person", /(?:CEO|创始人|董事会|团队|高管|负责人|库克|特努斯|乔布斯|用户|消费者)/i],
  ["organization", /(?:组织|事业部|职能|部门|团队|董事会)/],
  ["leadership", /(?:交接|接任|继任|管理层|CEO|董事会)/i],
  ["product", /(?:产品|功能|设备|手机|电脑|软件|硬件|平台|品牌|型号|产品线)/],
  ["hardware", /(?:芯片|规格|性能|硬件|处理器|屏幕|镜头|电池|接口)/],
  ["spec", /(?:规格|参数|配置|性能|功能|型号|芯片|接口)/],
  ["market", /(?:市场|竞争|品牌|用户|消费|商业|销量|门店|行业|价格|客户|变现)/],
  ["competition", /(?:竞争|红海|对手|抢占|份额|白热化)/],
  ["risk", /(?:风险|问题|失败|缺陷|否定|不能|不该|隐患|挑战)/],
  ["warning", /(?:风险|警惕|避免|不要|失败|问题|隐患)/],
  ["confirmation", /(?:完成|确认|验证|结论|总结|清单|检查|最终|下一步)/],
  ["progress", /(?:进度|完成|推进|恢复|达成|验证)/],
  ["timeline", /(?:过去|现在|未来|之前|之后|当年|今年|明年|阶段|演进|回溯|历史|年份)/],
  ["statement", /(?:观点|判断|结论|核心|关键|意味着|本质|其实|必须|应该)/],
  ["verdict", /(?:结论|判断|价值|关键|本质|核心)/],
  ["question", /(?:为什么|如何|吗|？|\?)/],
  ["chapter", /(?:开场|今天|本期|我们来|先说|总结)/],
  ["checklist", /(?:清单|检查|确认|完成|下一步)/],
];

function buildBeatContext({text = "", captions = [], beatIndex = 0, totalBeats = 1, layerIndex = 0, layerCount = 1} = {}) {
  const source = `${text} ${(captions || []).map((caption) => caption?.zh || caption?.en || "").join(" ")}`;
  const tags = new Set();
  for (const [tag, pattern] of tagPatterns) if (pattern.test(source)) tags.add(tag);
  if (tags.has("steps")) tags.add("process");
  if (!tags.size) tags.add("statement");
  const listCount = (captions || []).filter((caption) => String(caption?.zh || "").trim()).length;
  return {
    text: source,
    tags: [...tags],
    beatIndex,
    totalBeats,
    layerIndex,
    hasNumber: tags.has("metrics"),
    listCount,
    isOpening: beatIndex === 0 && layerIndex === 0,
    isClosing: beatIndex === totalBeats - 1 && layerIndex === layerCount - 1 && !(beatIndex === 0 && layerIndex === 0),
  };
}

function scoreComponent(componentId, context, history = []) {
  const component = componentRegistry[componentId];
  if (!component) return {componentId, score: Number.NEGATIVE_INFINITY, reasons: ["unregistered"]};
  let score = 8;
  const reasons = [];
  const matchingTags = component.tags.filter((tag) => context.tags.includes(tag));
  score += matchingTags.length * 18;
  if (matchingTags.length) reasons.push(`语义标签 ${matchingTags.join("、")}`);
  if (context.hasNumber && component.data.some((kind) => ["number", "percentage"].includes(kind))) {
    score += 14;
    reasons.push("数值承载");
  }
  if (context.listCount >= 2 && component.data.includes("list")) score += 9;
  if (context.tags.includes("steps") && componentId === "ordered-sequence") {
    score += 24;
    reasons.push("明确步骤结构");
  }
  if (componentId === "chapter-card" && !context.isOpening) {
    score -= 100;
    reasons.push("仅开场使用 -100");
  }
  if (componentId === "closing-checklist" && !context.isClosing) {
    score -= 100;
    reasons.push("仅收尾使用 -100");
  }
  if (context.isOpening && componentId === "chapter-card") score += 80;
  if (context.isClosing && componentId === "closing-checklist") score += 80;

  const previous = history.at(-1);
  const recentFour = history.slice(-4);
  const usage = history.filter((item) => item.layout === componentId).length;
  if (previous?.layout === componentId) {
    score -= 100;
    reasons.push("上一层同组件 -100");
  }
  if (recentFour.some((item) => item.layout === componentId)) {
    score -= 50;
    reasons.push("最近四层重复 -50");
  }
  if (previous?.family === component.family) {
    score -= 30;
    reasons.push("连续同家族 -30");
  }
  if (usage) {
    score -= usage * 12;
    reasons.push(`全片使用 ${usage} 次 -${usage * 12}`);
  } else {
    score += 25;
    reasons.push("未使用组件 +25");
  }
  return {componentId, family: component.family, score, matchingTags, reasons};
}

function pickBestComponent(beatContext, layerIndex = 0, history = []) {
  const context = {...beatContext, layerIndex};
  const ranked = Object.keys(componentRegistry)
    .map((componentId) => scoreComponent(componentId, context, history))
    .sort((left, right) => right.score - left.score || left.componentId.localeCompare(right.componentId));
  return {...ranked[0], ranked};
}

function summarizeComponentUsage(history = []) {
  const summary = Object.fromEntries(Object.keys(componentRegistry).map((id) => [id, 0]));
  for (const item of history) if (summary[item.layout] !== undefined) summary[item.layout] += 1;
  return summary;
}

module.exports = {buildBeatContext, componentRegistry, pickBestComponent, scoreComponent, summarizeComponentUsage};
