"use strict";

const baselineTokens = {
  mountMode: "center",
  mountX: 0,
  mountY: 0,
  boundsX: 0,
  boundsY: 0,
  boundsWidth: 1920,
  boundsHeight: 1080,
  padding: 48,
  gap: 16,
  position: "center",
  scale: 1,
  spring: "spring-up",
  sfx: "none",
  accentColor: "#00F2FE",
  defaultItemCount: 3,
  staggerFrames: 12,
  headerScale: 1,
  contentScale: 1,
};

const narrativePayload = (bodyText, highlightQuote = "") => ({
  type: "narrative",
  bodyText,
  ...(highlightQuote ? {highlightQuote} : {}),
});

const chipsPayload = (items) => ({
  type: "chips",
  items: items.map((title, index) => ({title, subtitle: index === 0 ? "KEY SIGNAL" : ""})),
});

const metricsPayload = (label, value = 72, unit = "%", detailText = "") => ({
  type: "metrics",
  value,
  unit,
  label,
  ...(detailText ? {detailText} : {}),
});

const stepsPayload = (steps, progress) => ({
  type: "steps",
  steps: steps.map((text, index) => ({stepNumber: index + 1, text})),
  ...(Number.isFinite(progress) ? {progress} : {}),
});

const editorSchemas = {
  narrative: {
    version: 1,
    kind: "narrative",
    fields: [
      {key: "bodyText", label: "正文内容", control: "textarea"},
      {key: "highlightQuote", label: "副文内容", control: "text"},
    ],
  },
  chips: {
    version: 1,
    kind: "chips",
    fields: [{key: "items", label: "标签项", control: "chip-list", capacity: 3, itemFields: [
      {key: "title", label: "标签", control: "text"},
      {key: "subtitle", label: "副标", control: "text"},
    ]}],
  },
  metrics: {
    version: 1,
    kind: "metrics",
    fields: [
      {key: "label", label: "指标标签", control: "text"},
      {key: "value", label: "数值", control: "number"},
      {key: "unit", label: "单位", control: "text"},
      {key: "detailText", label: "说明内容", control: "textarea"},
    ],
  },
  steps: {
    version: 1,
    kind: "steps",
    fields: [
      {key: "steps", label: "步骤内容", control: "string-list", capacity: 4},
      {key: "progress", label: "完成度", control: "number", minimum: 0, maximum: 100},
    ],
  },
};

const definition = ({
  id,
  name,
  intent,
  exportName,
  payload,
  keywords,
  visualWeight = "medium",
  capacity,
  displayIntent = "side-overlay",
  description,
}) => {
  const category = intent.toUpperCase();
  const headline = name.replace(/^\[JC\]\s*/, "");
  const defaultPayload = payload;
  const mockData = {
    category,
    headline,
    effectText: payload.type === "narrative" ? payload.bodyText : "",
    contentPayload: defaultPayload,
  };

  if (payload.type === "chips") {
    mockData.items = payload.items.map((item) => item.title);
    mockData.itemSubtitles = payload.items.map((item) => item.subtitle ?? "");
  }
  if (payload.type === "metrics") {
    mockData.label = payload.label;
    mockData.value = payload.value;
    mockData.unit = payload.unit ?? "";
    mockData.detailText = payload.detailText ?? "";
  }
  if (payload.type === "steps") {
    mockData.steps = payload.steps.map((item) => item.text);
    mockData.items = payload.steps.map((item) => item.text);
    mockData.progress = payload.progress ?? 72;
  }

  return {
    id,
    name,
    family: intent,
    description: description ?? `JC imported ${intent} visual component`,
    tags: ["jc", intent],
    data: payload.type === "metrics" ? ["number", "percentage"] : payload.type === "steps" ? ["list"] : payload.type === "chips" ? ["list"] : ["text"],
    version: 1,
    tokens: {...baselineTokens, defaultItemCount: capacity.maxItems},
    sfx: {enter: "none", exit: "none", volume: 0.65},
    occupancyScore: displayIntent === "fullscreen-modal" ? 0.88 : 0.36,
    faceAvoidanceEligible: displayIntent !== "fullscreen-modal",
    displayIntent,
    mockData,
    defaultPayload,
    editorSchema: editorSchemas[payload.type],
    manifest: {
      id,
      intent,
      capacity,
      keywords,
      visualWeight,
    },
    runtime: {
      exportName,
      adapter: id,
    },
  };
};

const JC_COMPONENT_DEFINITIONS = [
  definition({id: "jc-narrative-badge-card", name: "[JC] 徽章结论卡", intent: "narrative", exportName: "BadgeCard", payload: narrativePayload("用一个明确结论收束当前商业判断。", "TIER ONE"), keywords: ["结论", "判断", "定位", "第一"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-metrics-bar-chart", name: "[JC] 动态柱状图", intent: "metrics", exportName: "BarChart", payload: stepsPayload(["采购成本", "履约成本", "毛利空间"], 72), keywords: ["数据", "对比", "排名", "增长"], capacity: {minItems: 3, maxItems: 5}}),
  definition({id: "jc-metrics-big-number", name: "[JC] 大数字计数", intent: "metrics", exportName: "BigNumber", payload: metricsPayload("转化提升", 72, "%", "关键指标在当前阶段形成明显差异。"), keywords: ["数据", "数字", "增长", "百分比"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-bilingual-sub", name: "[JC] 双语字幕条", intent: "narrative", exportName: "BilingualSub", payload: narrativePayload("先给观点，再给证据。", "POINT THEN PROOF"), keywords: ["字幕", "观点", "说明"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-breathe", name: "[JC] 呼吸强调", intent: "narrative", exportName: "Breathe", payload: narrativePayload("核心信息保持持续呼吸感。"), keywords: ["强调", "呼吸", "观点"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-system-brick-wall", name: "[JC] 砖墙约束", intent: "system", exportName: "BrickWall", payload: narrativePayload("供给约束决定了扩张上限。", "HARD WALL"), keywords: ["壁垒", "约束", "供给", "风险"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-system-card-wall", name: "[JC] 信息卡墙", intent: "system", exportName: "CardWall", payload: chipsPayload(["渠道结构", "供给能力", "复购表现"]), keywords: ["结构", "模块", "信息", "系统"], capacity: {minItems: 3, maxItems: 6}}),
  definition({id: "jc-process-checklist", name: "[JC] 逐项清单", intent: "process", exportName: "Checklist", payload: stepsPayload(["明确采购底价", "锁定履约成本", "验证复购路径"], 78), keywords: ["清单", "步骤", "执行", "确认"], capacity: {minItems: 2, maxItems: 5}}),
  definition({id: "jc-system-chip", name: "[JC] 语义标签", intent: "system", exportName: "Chip", payload: chipsPayload(["低价入口", "高频复购", "履约闭环"]), keywords: ["标签", "模块", "要点", "链路"], capacity: {minItems: 1, maxItems: 3}}),
  definition({id: "jc-contrast-clone-cascade", name: "[JC] 克隆风险级联", intent: "contrast", exportName: "CloneCascade", payload: narrativePayload("同质化会快速压低先发优势。", "COPY RISK"), keywords: ["风险", "复制", "同质化", "竞争"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-contrast-compare-card", name: "[JC] 对照信息卡", intent: "contrast", exportName: "CompareCard", payload: stepsPayload(["传统高毛利", "低价高周转", "复购驱动"], 68), keywords: ["对比", "差异", "取舍", "变化"], capacity: {minItems: 2, maxItems: 4}}),
  definition({id: "jc-metrics-curve-overlay", name: "[JC] 增长曲线", intent: "metrics", exportName: "CurveOverlay", payload: metricsPayload("增长曲线", 74, "%", "曲线用于强调规模与效率的同步变化。"), keywords: ["趋势", "曲线", "增长", "数据"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-dm-card-stack", name: "[JC] 对话卡叠层", intent: "narrative", exportName: "DMCardStack", payload: chipsPayload(["先降低决策阻力", "再建立复购理由", "最后扩张渠道"]), keywords: ["对话", "叙事", "观点", "用户"], capacity: {minItems: 2, maxItems: 4}}),
  definition({id: "jc-process-flow-chain", name: "[JC] 商业链路", intent: "process", exportName: "FlowChain", payload: stepsPayload(["低价入口", "试用转化", "复购回流"], 76), keywords: ["链路", "流程", "闭环", "传导"], capacity: {minItems: 2, maxItems: 5}}),
  definition({id: "jc-system-flywheel", name: "[JC] 增长飞轮", intent: "system", exportName: "Flywheel", payload: stepsPayload(["供给稳定", "成本下降", "复购增长"], 80), keywords: ["飞轮", "循环", "增长", "系统"], capacity: {minItems: 3, maxItems: 5}}),
  definition({id: "jc-narrative-hero-text", name: "[JC] 主视觉断言", intent: "narrative", exportName: "HeroText", payload: narrativePayload("低价不是优势，是决策阻力归零。", "BUSINESS THESIS"), keywords: ["观点", "判断", "结论", "主视觉"], capacity: {minItems: 1, maxItems: 1}, displayIntent: "fullscreen-modal", visualWeight: "heavy"}),
  definition({id: "jc-narrative-info-card", name: "[JC] 信息说明卡", intent: "narrative", exportName: "InfoCard", payload: narrativePayload("价格低到绕过理性比价，直接触发即时购买。", "KEY INSIGHT"), keywords: ["说明", "观点", "洞察", "信息"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-info-scrim", name: "[JC] 信息遮罩", intent: "narrative", exportName: "InfoScrim", payload: narrativePayload("用留白突出关键信息。"), keywords: ["遮罩", "信息", "留白"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-system-loop-diagram", name: "[JC] 闭环图解", intent: "system", exportName: "LoopDiagram", payload: stepsPayload(["流量入口", "成交转化", "复购沉淀"], 82), keywords: ["闭环", "系统", "循环", "链路"], capacity: {minItems: 3, maxItems: 5}}),
  definition({id: "jc-system-matrix-icon", name: "[JC] 矩阵图标", intent: "system", exportName: "MatrixIcon", payload: metricsPayload("能力矩阵", 75, "%", "用矩阵强调能力密度与协同。"), keywords: ["矩阵", "能力", "系统", "模块"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-name-plate", name: "[JC] 人物名牌", intent: "narrative", exportName: "NamePlate", payload: narrativePayload("关键角色决定了执行上限。", "KEY OPERATOR"), keywords: ["人物", "角色", "负责人", "名牌"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-person-badge", name: "[JC] 人物徽章", intent: "narrative", exportName: "PersonBadge", payload: narrativePayload("操盘手的选择会改变整条链路。", "OPERATOR"), keywords: ["人物", "角色", "团队", "负责人"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-person-card", name: "[JC] 人物信息卡", intent: "narrative", exportName: "PersonCard", payload: narrativePayload("角色分工要与商业目标保持一致。", "ROLE FIT"), keywords: ["人物", "团队", "角色", "分工"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-system-phone-mockup", name: "[JC] 手机界面框", intent: "system", exportName: "PhoneMockup", payload: narrativePayload("产品体验必须把路径压缩到最短。", "MOBILE FLOW"), keywords: ["产品", "手机", "界面", "体验"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-quote-doc", name: "[JC] 引文资料卡", intent: "narrative", exportName: "QuoteDoc", payload: narrativePayload("关键原话能为判断提供最直接的证据。", "SOURCE NOTE"), keywords: ["引文", "资料", "证据", "观点"], capacity: {minItems: 1, maxItems: 3}}),
  definition({id: "jc-contrast-score-board", name: "[JC] 对比记分牌", intent: "contrast", exportName: "ScoreBoard", payload: stepsPayload(["成本更低", "履约更快", "复购更稳"], 83), keywords: ["评分", "对比", "竞争", "优势"], capacity: {minItems: 2, maxItems: 5}}),
  definition({id: "jc-narrative-shot-card", name: "[JC] 截图注释卡", intent: "narrative", exportName: "ShotCard", payload: narrativePayload("画面证据要服务于当前判断。", "VISUAL PROOF"), keywords: ["截图", "证据", "画面", "说明"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-side-label", name: "[JC] 侧边标签", intent: "narrative", exportName: "SideLabel", payload: narrativePayload("把关键判断固定在安全侧边。", "SIDE SIGNAL"), keywords: ["标签", "侧边", "判断", "强调"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-system-solvent-tank", name: "[JC] 溶剂反应槽", intent: "system", exportName: "SolventTank", payload: narrativePayload("效率提升来自结构性溶解成本。", "COST REACTION"), keywords: ["成本", "效率", "系统", "变化"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-narrative-stamp", name: "[JC] 结论印章", intent: "narrative", exportName: "Stamp", payload: narrativePayload("结论成立，进入下一步。", "VERDICT"), keywords: ["结论", "印章", "确认", "判断"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-process-step-list", name: "[JC] 步骤清单", intent: "process", exportName: "StepList", payload: stepsPayload(["确定目标人群", "验证单次利润", "放大复购效率"], 78), keywords: ["步骤", "流程", "执行", "行动"], capacity: {minItems: 2, maxItems: 5}}),
  definition({id: "jc-process-timeline-card", name: "[JC] 时间卡片", intent: "process", exportName: "TimelineCard", payload: stepsPayload(["低价试探", "复购验证", "渠道放大"], 74), keywords: ["时间", "阶段", "演进", "节点"], capacity: {minItems: 2, maxItems: 4}}),
  definition({id: "jc-process-timeline-events", name: "[JC] 时间事件轴", intent: "process", exportName: "TimelineEvents", payload: stepsPayload(["起步", "优化", "扩张"], 70), keywords: ["时间线", "事件", "阶段", "节点"], capacity: {minItems: 2, maxItems: 5}}),
  definition({id: "jc-narrative-tweet-card", name: "[JC] 观点引用帖", intent: "narrative", exportName: "TweetCard", payload: narrativePayload("一条观点必须落到可以验证的商业事实。", "PUBLIC TAKE"), keywords: ["观点", "引用", "评论", "判断"], capacity: {minItems: 1, maxItems: 3}}),
  definition({id: "jc-metrics-unit-matrix", name: "[JC] 单元矩阵", intent: "metrics", exportName: "UnitMatrix", payload: metricsPayload("结构占比", 68, "%", "用单元密度展示规模与结构。"), keywords: ["矩阵", "占比", "规模", "数据"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-contrast-verdict-box", name: "[JC] 风险裁决框", intent: "contrast", exportName: "VerdictBox", payload: chipsPayload(["供给不稳", "履约失控", "复购不足"]), keywords: ["风险", "裁决", "对比", "取舍"], capacity: {minItems: 2, maxItems: 4}}),
  definition({id: "jc-metrics-views-badge", name: "[JC] 观看量徽章", intent: "metrics", exportName: "ViewsBadge", payload: metricsPayload("触达规模", 20, "M+", "用增长数字强调市场反馈。"), keywords: ["播放", "观看", "规模", "数据"], capacity: {minItems: 1, maxItems: 1}}),
  definition({id: "jc-system-window-card", name: "[JC] 产品窗口卡", intent: "system", exportName: "WindowCard", payload: narrativePayload("界面每一步都要缩短用户决策。", "PRODUCT WINDOW"), keywords: ["产品", "窗口", "界面", "系统"], capacity: {minItems: 1, maxItems: 1}}),
];

const backfilledRuntimeAssets = [
  {
    id: "avatar-handoff",
    name: "头像交接",
    family: "system",
    description: "运行时已有的双人物交接效果",
    tags: ["person", "handoff", "system"],
    data: ["person", "comparison"],
    version: 1,
    tokens: {...baselineTokens, boundsWidth: 860},
    sfx: {enter: "none", exit: "none", volume: 0.65},
    occupancyScore: 0.36,
    faceAvoidanceEligible: true,
    displayIntent: "side-overlay",
    mockData: {category: "TEAM", headline: "关键角色交接", contentPayload: chipsPayload(["前序角色", "目标角色"])},
    defaultPayload: chipsPayload(["前序角色", "目标角色"]),
    editorSchema: {version: 1, kind: "chips", fields: [{key: "items", label: "角色信息", control: "string-list", capacity: 2}]},
    manifest: {id: "avatar-handoff", intent: "system", capacity: {minItems: 2, maxItems: 2}, keywords: ["人物", "交接", "团队", "角色"], visualWeight: "medium"},
  },
  {
    id: "data-flow",
    name: "数据分屏",
    family: "system",
    description: "运行时已有的左右数据分屏效果",
    tags: ["data", "system", "comparison"],
    data: ["number", "comparison"],
    version: 1,
    tokens: {...baselineTokens, boundsWidth: 920},
    sfx: {enter: "none", exit: "none", volume: 0.65},
    occupancyScore: 0.42,
    faceAvoidanceEligible: true,
    displayIntent: "side-overlay",
    mockData: {category: "DATA FLOW", headline: "两侧数据对照", contentPayload: metricsPayload("转化提升", 72, "%", "核心指标形成明确分差。")},
    defaultPayload: metricsPayload("转化提升", 72, "%", "核心指标形成明确分差。"),
    editorSchema: editorSchemas.metrics,
    manifest: {id: "data-flow", intent: "system", capacity: {minItems: 2, maxItems: 2}, keywords: ["数据", "对照", "系统", "链路"], visualWeight: "medium"},
  },
];

module.exports = {JC_COMPONENT_DEFINITIONS, backfilledRuntimeAssets};
