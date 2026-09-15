"use strict";

const {DEFAULT_WEIGHT, getComponentWeightsSync} = require("./component-weight-store.cjs");
const {normalizeCommercialTextRole, textRolesForLayout} = require("./commercial-analysis-preset.cjs");
const {getComponentRegistrySync} = require("./component-registry-store.cjs");
const intentTextRoles = {narrative:["hook","verdict"], metrics:["metric"], process:["chain"], contrast:["risk","verdict"], system:["chain"]};

const componentManifest = {

  "capital-dashboard": {intent:"metrics", capacity:{minItems:1,maxItems:2}, keywords:["数据","增长","市值","营收","百分比","指标"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","market","growth"], data:["number","percentage"]},
  "progress-donut": {intent:"metrics", capacity:{minItems:1,maxItems:1}, keywords:["进度","完成度","百分比","转化率","%"], visualWeight:"light", family:"F1_QUANTITATIVE", tags:["metrics","confirmation","progress"], data:["percentage"]},
  "recovery-progress-bars": {intent:"metrics", capacity:{minItems:2,maxItems:5}, keywords:["进度","恢复","完成","推进","百分比"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","process","progress"], data:["list","percentage"]},
  "platform-shift-line": {intent:"system", capacity:{minItems:3,maxItems:5}, keywords:["产品线","平台","演进","扩展","链路"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","timeline","product","system"], data:["list","number"]},
  "hud-glow-stack": {intent:"system", capacity:{minItems:2,maxItems:4}, keywords:["系统","信号","链路","模块","闭环"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","product","statement","system"], data:["list","number"]},
  "copyopen-progress-bar": {intent:"metrics", capacity:{minItems:1,maxItems:1}, keywords:["进度","百分比","完成","%"], visualWeight:"light", family:"F1_QUANTITATIVE", tags:["metrics","process","progress"], data:["percentage"]},
  "copyopen-comparison-card": {intent:"metrics", capacity:{minItems:2,maxItems:2}, keywords:["对比","差异","数值","增长"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","comparison","market"], data:["number","comparison"]},
  "copyopen-bar-chart": {intent:"metrics", capacity:{minItems:3,maxItems:5}, keywords:["柱状","排名","数据","对比"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","market","growth"], data:["list","number"]},
  "copyopen-line-chart": {intent:"metrics", capacity:{minItems:3,maxItems:5}, keywords:["趋势","增长","曲线","时间"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","timeline","growth"], data:["list","number"]},
  "copyopen-pie-chart": {intent:"metrics", capacity:{minItems:3,maxItems:5}, keywords:["占比","比例","分布","份额"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","market","comparison"], data:["list","percentage"]},
  "copyopen-kpi-grid": {intent:"metrics", capacity:{minItems:3,maxItems:6}, keywords:["KPI","指标","数据","增长"], visualWeight:"medium", family:"F1_QUANTITATIVE", tags:["metrics","market","growth"], data:["list","number"]},

  "ordered-sequence": {intent:"process", capacity:{minItems:2,maxItems:5}, keywords:["第一步","第二步","阶段","步骤","流程"], visualWeight:"medium", family:"F2_TIMELINE_PROCESS", tags:["process","steps"], data:["list"]},
  "event-timeline": {intent:"process", capacity:{minItems:3,maxItems:5}, keywords:["时间线","阶段","演进","节点"], visualWeight:"medium", family:"F2_TIMELINE_PROCESS", tags:["timeline","process"], data:["list","time"]},
  "rewind-milestones": {intent:"process", capacity:{minItems:4,maxItems:6}, keywords:["回溯","过去","演进","节点"], visualWeight:"medium", family:"F2_TIMELINE_PROCESS", tags:["timeline","process","product"], data:["list","time"]},
  "time-rewind": {intent:"process", capacity:{minItems:1,maxItems:5}, keywords:["回溯","时间","过去","历史"], visualWeight:"light", family:"F2_TIMELINE_PROCESS", tags:["timeline","statement"], data:["time"]},
  "route-map": {intent:"process", capacity:{minItems:3,maxItems:4}, keywords:["路线","路径","流程","地图"], visualWeight:"heavy", family:"F2_TIMELINE_PROCESS", tags:["process","market"], data:["list"]},
  "check-progress": {intent:"process", capacity:{minItems:2,maxItems:5}, keywords:["确认","检查","完成","步骤"], visualWeight:"medium", family:"F2_TIMELINE_PROCESS", tags:["process","confirmation","progress"], data:["list","percentage"]},
  "org-chart": {intent:"system", capacity:{minItems:3,maxItems:5}, keywords:["组织","部门","分工","架构"], visualWeight:"heavy", family:"F2_TIMELINE_PROCESS", tags:["process","person","organization","system"], data:["list"]},
  "draw-line": {intent:"process", capacity:{minItems:1,maxItems:2}, keywords:["路径","推导","画线","论证"], visualWeight:"light", family:"F2_TIMELINE_PROCESS", tags:["process","timeline","statement"], data:["time"]},
  "copyopen-terminal-scene": {intent:"process", capacity:{minItems:3,maxItems:6}, keywords:["命令","流程","执行","工作流"], visualWeight:"heavy", family:"F2_TIMELINE_PROCESS", tags:["process","steps","workflow"], data:["list"]},

  "zoom-statement": {intent:"narrative", capacity:{minItems:1,maxItems:1}, keywords:["观点","判断","结论","关键"], visualWeight:"light", family:"F3_ARGUMENT_CONFLICT", tags:["statement","comparison","verdict"], data:["text"]},
  "opinion-hero": {intent:"narrative", capacity:{minItems:1,maxItems:1}, keywords:["观点","核心","金句","主张"], visualWeight:"heavy", family:"F3_ARGUMENT_CONFLICT", tags:["statement","person","verdict"], data:["text"]},
  "bare-typography": {intent:"narrative", capacity:{minItems:1,maxItems:1}, keywords:["大字","判断","结论"], visualWeight:"light", family:"F3_ARGUMENT_CONFLICT", tags:["statement","verdict"], data:["text"]},
  "spotlight-question": {intent:"narrative", capacity:{minItems:2,maxItems:3}, keywords:["问题","评论","为什么","互动"], visualWeight:"light", family:"F3_ARGUMENT_CONFLICT", tags:["statement","question","comparison"], data:["text"]},
  "bull-bear": {intent:"contrast", capacity:{minItems:2,maxItems:2}, keywords:["看多","风险","对比","多空"], visualWeight:"heavy", family:"F3_ARGUMENT_CONFLICT", tags:["comparison","market","risk"], data:["comparison"]},
  "market-battlefield": {intent:"contrast", capacity:{minItems:2,maxItems:4}, keywords:["竞争","对手","市场对垒","战场"], visualWeight:"heavy", family:"F3_ARGUMENT_CONFLICT", tags:["comparison","market","competition"], data:["comparison","list"]},
  "tradeoff-reject-round": {intent:"contrast", capacity:{minItems:2,maxItems:4}, keywords:["风险","否定","排除","不要"], visualWeight:"medium", family:"F3_ARGUMENT_CONFLICT", tags:["risk","comparison","warning"], data:["list"]},
  "reject-list": {intent:"contrast", capacity:{minItems:2,maxItems:5}, keywords:["错误","问题","风险","避坑"], visualWeight:"medium", family:"F3_ARGUMENT_CONFLICT", tags:["risk","warning","process"], data:["list"]},

  "person-rank": {intent:"system", capacity:{minItems:2,maxItems:3}, keywords:["人物","团队","交接","组织"], visualWeight:"medium", family:"F4_ENTITIES_HARDWARE", tags:["person","organization","leadership","system"], data:["person","comparison"]},
  "value-verdict": {intent:"narrative", capacity:{minItems:1,maxItems:2}, keywords:["价值","结论","判断","指标"], visualWeight:"medium", family:"F3_ARGUMENT_CONFLICT", tags:["statement","verdict","metrics"], data:["text","number"]},
  "product-explosion": {intent:"system", capacity:{minItems:3,maxItems:5}, keywords:["产品","生态","硬件","系列"], visualWeight:"heavy", family:"F4_ENTITIES_HARDWARE", tags:["product","hardware","spec","system"], data:["list"]},
  "cook-machine": {intent:"system", capacity:{minItems:2,maxItems:4}, keywords:["经营","机器","商业","闭环"], visualWeight:"medium", family:"F4_ENTITIES_HARDWARE", tags:["product","hardware","process","system"], data:["list"]},
  "photo-wall": {intent:"narrative", capacity:{minItems:3,maxItems:4}, keywords:["照片","证据","案例","产品"], visualWeight:"heavy", family:"F4_ENTITIES_HARDWARE", tags:["person","product","market"], data:["list"]},
  "logo-wordmark": {intent:"narrative", capacity:{minItems:1,maxItems:1}, keywords:["品牌","标志","关键词"], visualWeight:"light", family:"F4_ENTITIES_HARDWARE", tags:["product","market","statement"], data:["text"]},

  "diagonal-chips": {intent:"system", capacity:{minItems:3,maxItems:5}, keywords:["规格","要点","参数","模块"], visualWeight:"light", family:"F5_SPECS_MULTIDIM", tags:["product","hardware","spec","system"], data:["list"]},
  "floating-chips": {intent:"system", capacity:{minItems:2,maxItems:4}, keywords:["标签","要点","模块","信号"], visualWeight:"light", family:"F5_SPECS_MULTIDIM", tags:["product","spec","market","system"], data:["list"]},
  "desktop-folders": {intent:"system", capacity:{minItems:3,maxItems:4}, keywords:["文件","分类","整理","系统"], visualWeight:"medium", family:"F5_SPECS_MULTIDIM", tags:["process","product","spec","system"], data:["list"]},
  "clipboard-note": {intent:"narrative", capacity:{minItems:1,maxItems:3}, keywords:["便签","批注","结论","确认"], visualWeight:"medium", family:"F5_SPECS_MULTIDIM", tags:["process","confirmation","statement"], data:["list","text"]},
  "briefing-poster": {intent:"narrative", capacity:{minItems:1,maxItems:4}, keywords:["简报","摘要","观点","案例"], visualWeight:"heavy", family:"F5_SPECS_MULTIDIM", tags:["market","statement","product"], data:["list","text"]},
  "screen-recording": {intent:"system", capacity:{minItems:2,maxItems:4}, keywords:["界面","操作","产品","窗口"], visualWeight:"heavy", family:"F5_SPECS_MULTIDIM", tags:["process","product","spec","system"], data:["list"]},
  "flying-paper-stack": {intent:"narrative", capacity:{minItems:1,maxItems:3}, keywords:["纸卡","资料","简报","观点"], visualWeight:"medium", family:"F5_SPECS_MULTIDIM", tags:["process","statement","market"], data:["list","text"]},

  "chapter-card": {intent:"narrative", capacity:{minItems:1,maxItems:1}, keywords:["章节","开场","主题"], visualWeight:"heavy", family:"F6_CHAPTER_VERDICT", tags:["chapter","statement","verdict"], data:["text"], allowRepeat:true},
  "closing-checklist": {intent:"process", capacity:{minItems:2,maxItems:5}, keywords:["收尾","清单","确认","总结"], visualWeight:"medium", family:"F6_CHAPTER_VERDICT", tags:["confirmation","verdict","checklist","process"], data:["list"]},
  "checklist-editorial": {intent:"process", capacity:{minItems:2,maxItems:5}, keywords:["清单","确认","步骤","总结"], visualWeight:"medium", family:"F6_CHAPTER_VERDICT", tags:["confirmation","statement","checklist","process"], data:["list"]},
  "pivot-list": {intent:"narrative", capacity:{minItems:1,maxItems:4}, keywords:["打字机","观点","列表"], visualWeight:"medium", family:"F6_CHAPTER_VERDICT", tags:["comparison","statement","verdict"], data:["list","text"]},
  "copyopen-hero-title": {intent:"narrative", capacity:{minItems:1,maxItems:1}, keywords:["开场","标题","主视觉"], visualWeight:"heavy", family:"F6_CHAPTER_VERDICT", tags:["chapter","statement","opening"], data:["text"], manualFirst:true},
  "copyopen-end-tag": {intent:"narrative", capacity:{minItems:1,maxItems:1}, keywords:["结尾","标语","收束"], visualWeight:"light", family:"F6_CHAPTER_VERDICT", tags:["confirmation","verdict","closing"], data:["text"], manualFirst:true},
};

const registeredJcAssets = (() => {
  try {
    return getComponentRegistrySync().components.filter((component) => component.id.startsWith("jc-") || component.id === "avatar-handoff" || component.id === "data-flow");
  } catch {
    return [];
  }
})();

for (const component of registeredJcAssets) {
  const manifest = component.manifest;
  if (!manifest || !["narrative", "metrics", "process", "contrast", "system"].includes(manifest.intent)) continue;
  componentManifest[component.id] = {
    id: component.id,
    intent: manifest.intent,
    capacity: manifest.capacity,
    keywords: manifest.keywords,
    visualWeight: manifest.visualWeight,
    family: component.family,
    tags: Array.isArray(component.tags) ? component.tags : ["jc", manifest.intent],
    data: Array.isArray(component.data) ? component.data : [],
    textRoles: intentTextRoles[manifest.intent] ?? [],
  };
}
for (const [id, manifest] of Object.entries(componentManifest)) {
  manifest.id = id;
  if (!Array.isArray(manifest.textRoles) || !manifest.textRoles.length) manifest.textRoles = textRolesForLayout(id);
}

const componentRegistry = Object.fromEntries(Object.entries(componentManifest).map(([id, manifest]) => [id, {family: manifest.family, tags: manifest.tags, data: manifest.data}]));

const intentKeywords = {
  process: [/(?:第一|第二|第三|首先|其次|然后|最后|步骤|流程|路径|阶段|执行|操作|推进|沉淀|交付|复购)/i, /(?:first|second|third|step|phase|workflow|process|roadmap)/i],
  metrics: [/(?:\d+(?:\.\d+)?%|%|百分比|转化率|增长率|飙到|翻倍|增长|下滑|提升|下降|营收|利润|客单价|复购率|市值|份额|ROI|KPI)/i, /(?:growth|revenue|margin|metric|percentage|conversion|\d+%)/i],
  contrast: [/(?:风险|问题|错误|否定|不要|不能|避坑|隐患|但是|不过|相比|对比|多空|看多|空方|取舍|挑战)/i, /(?:risk|warning|versus|vs\.?|but|however|trade-?off|downside)/i],
  system: [/(?:系统|架构|链路|闭环|底层|模块|组织|分工|平台|生态|中台|后端|前端|模型|结构|串起来)/i, /(?:system|architecture|pipeline|loop|platform|ecosystem|stack)/i],
  narrative: [/(?:观点|判断|结论|核心|关键|本质|其实|意味着|价值|金句|故事|案例|摘要)/i, /(?:thesis|verdict|story|insight|key point|conclusion)/i],
};

const tagPatterns = [
  ["metrics", /(?:revenue|growth|margin|percentage|valuation|roi|metrics|\$\d|\d+%)/i],
  ["growth", /(?:growth|expand|increase|scale|upside|增长|提升|上升|扩大|翻倍|爆发|增长率)/i],
  ["comparison", /(?:however|contrary|versus|vs\.?|trade-?off|but|rather than|但是|不过|相比|对比|取舍|优于|不如|而不是|转向|放弃|逆转|差异)/i],
  ["process", /(?:first|second|third|roadmap|phases|process|workflow|step|execution|首先|其次|然后|步骤|流程|路径|阶段|执行|如何|方法|操作|推进)/i],
  ["steps", /(?:第[一二三四五六七八九十\d]|第一步|第二步|第三步|步骤|流程|phase \d|step \d)/i],
  ["metrics", /(?:\d+(?:\.\d+)?%|\d[\d,.]*\s*(?:亿|万|年|款|美元|元|倍)|[$￥]|增长|下降|市值|营收|估值|份额|排名|比例)/],
  ["person", /(?:CEO|创始人|董事会|团队|高管|负责人|库克|特努斯|乔布斯|用户|消费者)/i],
  ["organization", /(?:组织|事业部|职能|部门|团队|董事会)/],
  ["product", /(?:产品|功能|设备|手机|电脑|软件|硬件|平台|品牌|型号|产品线)/],
  ["hardware", /(?:芯片|规格|性能|硬件|处理器|屏幕|镜头|电池|接口|architecture|specs?|latency|bandwidth|silicon)/i],
  ["market", /(?:市场|竞争|品牌|用户|消费|商业|销量|门店|行业|价格|客户|变现|market|demand|customer|competition)/i],
  ["risk", /(?:风险|问题|失败|缺陷|否定|不能|不该|隐患|挑战|risk|warning|downside)/i],
  ["confirmation", /(?:完成|确认|验证|结论|总结|清单|检查|最终|下一步)/],
  ["progress", /(?:进度|完成|推进|恢复|达成|验证)/],
  ["timeline", /(?:过去|现在|未来|之前|之后|当年|今年|明年|阶段|演进|回溯|历史|年份|timeline|history)/i],
  ["statement", /(?:观点|判断|结论|核心|关键|意味着|本质|其实|必须|应该|critical|key|thesis|verdict|breakthrough|strategy)/i],
  ["question", /(?:为什么|如何|吗|？|\?)/],
  ["chapter", /(?:开场|今天|本期|我们来|先说|总结|opening)/i],
  ["checklist", /(?:清单|检查|确认|完成|下一步)/],
  ["system", /(?:系统|架构|链路|闭环|底层|模块|组织|分工|平台|生态|pipeline|architecture|system)/i],
];

function buildBeatContext({text = "", captions = [], beatIndex = 0, totalBeats = 1, layerIndex = 0, layerCount = 1, textRole = ""} = {}) {
  const source = `${text} ${(captions || []).map((caption) => caption?.zh || caption?.en || "").join(" ")}`;
  const tags = new Set();
  for (const [tag, pattern] of tagPatterns) if (pattern.test(source)) tags.add(tag);
  if (tags.has("steps")) tags.add("process");
  if (!tags.size) tags.add("statement");
  const listCount = Math.max((source.match(/[，,。！？!?；;、]/g) || []).length + 1, (captions || []).filter((caption) => String(caption?.zh || caption?.en || "").trim()).length);
  return {text: source, tags: [...tags], beatIndex, totalBeats, layerIndex, textRole: normalizeCommercialTextRole(textRole), hasNumber: tags.has("metrics"), listCount, isOpening: beatIndex === 0 && layerIndex === 0, isClosing: beatIndex === totalBeats - 1 && layerIndex === layerCount - 1 && !(beatIndex === 0 && layerIndex === 0)};
}

function classifyBeatIntent(context) {
  const text = String(context.text || "");
  const scores = Object.fromEntries(Object.keys(intentKeywords).map((intent) => [intent, 0]));
  for (const [intent, patterns] of Object.entries(intentKeywords)) for (const pattern of patterns) if (pattern.test(text)) scores[intent] += 2;
  for (const tag of context.tags || []) {
    if (["steps", "process", "timeline", "checklist", "confirmation"].includes(tag)) scores.process += 1;
    if (["metrics", "growth", "progress"].includes(tag)) scores.metrics += 1;
    if (["comparison", "risk", "warning"].includes(tag)) scores.contrast += 1;
    if (["system", "organization", "hardware", "product"].includes(tag)) scores.system += 1;
    if (["statement", "verdict", "chapter", "question"].includes(tag)) scores.narrative += 1;
  }
  if (context.isOpening && Math.max(scores.process, scores.metrics, scores.contrast, scores.system) < 3) scores.narrative += 2;
  if (context.isClosing) scores.process += 1;
  const priority = ["metrics", "system", "contrast", "process", "narrative"];
  const targetIntent = priority.sort((left, right) => scores[right] - scores[left] || priority.indexOf(left) - priority.indexOf(right))[0];
  const slotType = context.hasNumber ? "single_stat" : context.listCount >= 2 ? "list" : "quote";
  return {...context, targetIntent, intentScores: scores, payloadShape: {slotType, itemCount: Math.max(1, Math.min(8, context.listCount || 1)), hasMetric: Boolean(context.hasNumber)}};
}

const clampScore = (value) => Math.max(0, Math.min(100, value));
function getComponentWeight(componentId, root = process.cwd()) {
  return getComponentWeightsSync(root)[componentId] ?? DEFAULT_WEIGHT;
}

function calculateFatiguePenalty(layout, classified, history = []) {
  const appearances = (history || []).filter((item) => item.layout === layout);
  const beatIndex = Number(classified.beatIndex);
  const previousBeat = Number.isFinite(beatIndex)
    ? appearances.some((item) => Number(item.beatIndex) === beatIndex - 1)
    : history.at(-1)?.layout === layout;
  const repeatedAcrossProject = appearances.length > 1;
  return {
    fatiguePenalty: (previousBeat ? 80 : 0) + (repeatedAcrossProject ? 40 : 0),
    previousBeat,
    appearanceCount: appearances.length,
    repeatedAcrossProject,
  };
}

function candidateScore(manifest, classified, history = [], componentWeights = getComponentWeightsSync()) {
  let semanticScore = 0;
  const baseWeight = componentWeights[manifest.id] ?? DEFAULT_WEIGHT;
  const roleMatch = Boolean(classified.textRole && manifest.textRoles.includes(classified.textRole));
  if (manifest.intent === classified.targetIntent) semanticScore += 45;
  if (classified.textRole) semanticScore += roleMatch ? 32 : -22;
  const matchingKeywords = manifest.keywords.filter((keyword) => String(classified.text || "").toLowerCase().includes(keyword.toLowerCase()));
  semanticScore += matchingKeywords.length * 18;
  const matchingTags = manifest.tags.filter((tag) => (classified.tags || []).includes(tag));
  semanticScore += matchingTags.length * 8;
  const count = classified.payloadShape.itemCount;
  if (count >= manifest.capacity.minItems && count <= manifest.capacity.maxItems) semanticScore += 6;
  if (classified.payloadShape.hasMetric && manifest.data.some((kind) => ["number", "percentage"].includes(kind))) semanticScore += 12;
  if (classified.payloadShape.slotType === "list" && manifest.data.includes("list")) semanticScore += 6;
  if (classified.payloadShape.slotType === "quote" && manifest.data.includes("text")) semanticScore += 6;
  if (classified.isClosing && manifest.id === "closing-checklist") semanticScore += 16;
  if (manifest.manualFirst) semanticScore -= 45;
  const previous = history.at(-1);
  if (previous?.intent === manifest.intent) semanticScore -= 12;
  if (classified.layerIndex > 0 && previous?.intent === "narrative" && ["metrics", "system"].includes(manifest.intent)) semanticScore += 14;
  semanticScore = clampScore(semanticScore);
  const fatigue = calculateFatiguePenalty(manifest.id, classified, history);
  const score = semanticScore * .4 + baseWeight * .6 - fatigue.fatiguePenalty;
  return {score, semanticScore, baseWeight, preferenceWeight: baseWeight, fatiguePenalty: fatigue.fatiguePenalty, matchingTags, matchingKeywords, roleMatch, ...fatigue};
}

function getCandidatePool(classifiedInput, history = [], limit = 5) {
  const classified = classifiedInput.targetIntent ? classifiedInput : classifyBeatIntent(classifiedInput);
  const previous = history.at(-1);
  const componentWeights = getComponentWeightsSync();
  const allCandidates = () => Object.entries(componentManifest)
    .map(([id, manifest]) => ({id, ...manifest, ...candidateScore({id, ...manifest}, classified, history, componentWeights)}));

  const roleCandidates = classified.textRole ? allCandidates().filter((item) => item.textRoles.includes(classified.textRole)) : [];
  let candidates = roleCandidates.length >= 3 ? roleCandidates : allCandidates().filter((item) => item.intent === classified.targetIntent);

  if (roleCandidates.length < 3 && classified.layerIndex > 0 && previous?.intent === "narrative") {
    const complement = allCandidates().filter((item) => ["metrics", "system"].includes(item.intent));
    if (complement.length >= 3) candidates = complement;
  } else if (roleCandidates.length < 3 && previous?.intent && candidates.filter((item) => item.intent !== previous.intent).length >= 3) {
    candidates = candidates.filter((item) => item.intent !== previous.intent);
  }

  if (candidates.length < 3) {
    candidates = allCandidates().filter((item) => !previous?.intent || item.intent !== previous.intent);
    if (candidates.length < 3) candidates = allCandidates();
  }
  candidates.sort((left, right) => right.score - left.score || left.visualWeight.localeCompare(right.visualWeight) || left.id.localeCompare(right.id));
  return candidates.slice(0, Math.max(3, Math.min(limit, 5)));
}function scoreComponent(componentId, context, history = []) {
  const manifest = componentManifest[componentId];
  if (!manifest) return {componentId, score: Number.NEGATIVE_INFINITY, reasons: ["unregistered"]};
  const classified = classifyBeatIntent(context);
  const raw = candidateScore({id: componentId, ...manifest}, classified, history, getComponentWeightsSync());
  const reasons = [];
  if (manifest.intent === classified.targetIntent) reasons.push("意图命中 " + classified.targetIntent);
  if (raw.matchingTags.length) reasons.push(`语义标签 ${raw.matchingTags.join("、")}`);
  if (classified.payloadShape.hasMetric && manifest.data.some((kind) => ["number", "percentage"].includes(kind))) reasons.push("数值承载");
  if (classified.textRole) reasons.push("文字角色 " + classified.textRole + (raw.roleMatch ? " 命中" : " 兼容兜底"));
  reasons.push("人工优先级 " + raw.baseWeight);
  if (raw.previousBeat) reasons.push("上一 Beat 出现 -80");
  if (raw.repeatedAcrossProject) reasons.push("全片累计出现 " + raw.appearanceCount + " 次 -40");
  return {componentId, family: manifest.family, intent: manifest.intent, textRole: classified.textRole, score: raw.score, semanticScore: raw.semanticScore, baseWeight: raw.baseWeight, preferenceWeight: raw.preferenceWeight, fatiguePenalty: raw.fatiguePenalty, matchingTags: raw.matchingTags, reasons};
}

function funnelPickComponent(beatContext, layerIndex = 0, history = []) {
  const classified = classifyBeatIntent({...beatContext, layerIndex});
  const candidatePool = getCandidatePool(classified, history, 5);
  const ranked = candidatePool.map((item) => ({componentId: item.id, family: item.family, intent: item.intent, textRole: classified.textRole, score: item.score, semanticScore: item.semanticScore, baseWeight: item.baseWeight, fatiguePenalty: item.fatiguePenalty, matchingTags: item.matchingTags, preferenceWeight: item.preferenceWeight, reasons: [`候选池意图 ${classified.targetIntent}`, ...(classified.textRole ? [`文字角色 ${classified.textRole}${item.roleMatch ? " 命中" : " 兼容兜底"}`] : []), `人工优先级 ${item.baseWeight}`]})).sort((left, right) => right.score - left.score || left.componentId.localeCompare(right.componentId));
  const best = ranked[0];
  return {...best, classified, candidatePool, ranked};
}

function pickBestComponent(beatContext, layerIndex = 0, history = []) {
  return funnelPickComponent(beatContext, layerIndex, history);
}

function summarizeComponentUsage(history = []) {
  const summary = Object.fromEntries(Object.keys(componentManifest).map((id) => [id, 0]));
  for (const item of history) if (summary[item.layout] !== undefined) summary[item.layout] += 1;
  return summary;
}

module.exports = {buildBeatContext, calculateFatiguePenalty, classifyBeatIntent, componentManifest, componentRegistry, funnelPickComponent, getCandidatePool, getComponentWeight, pickBestComponent, scoreComponent, summarizeComponentUsage};
