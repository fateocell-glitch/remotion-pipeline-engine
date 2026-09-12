import type {JasonWuCue, JasonWuStep} from "./timeline";

const hardwareSteps: JasonWuStep[] = [
  {index: "01", title: "Apple Silicon", subtitle: "PLATFORM SHIFT", active: true, tone: "blue"},
  {index: "02", title: "M-Series", subtitle: "PERFORMANCE PER WATT", active: true, tone: "gold"},
  {index: "03", title: "MagSafe / HDMI / SDXC", subtitle: "PRO WORKFLOW RETURN", active: true, tone: "blue"},
];

const strategySteps: JasonWuStep[] = [
  {index: "01", title: "端侧 AI", subtitle: "ON-DEVICE INTELLIGENCE", active: true, tone: "gold"},
  {index: "02", title: "新硬件形态", subtitle: "NEXT PRODUCT FORMS", active: true, tone: "blue"},
  {index: "03", title: "软硬协同", subtitle: "INTEGRATED EXPERIENCE", active: true, tone: "blue"},
];

const beat = (
  id: string,
  start: number,
  end: number,
  eyebrow: string,
  subtitle: string,
  zh: string,
  en: string,
  layout: JasonWuCue["layout"],
  extras: Partial<Pick<JasonWuCue, "people" | "steps" | "metric">> = {},
): JasonWuCue => ({
  id,
  start,
  end,
  section: {eyebrow, subtitle},
  caption: {zh, en},
  layout,
  ...extras,
});

export const zhuzigeFullCues: JasonWuCue[] = [
  beat("zhuzige-succession", 0, 12, "ACT 01 · SUCCESSION", "新任 CEO 与苹果交接", "约翰·特纳斯接任苹果新一届 CEO", "John Ternus becomes Apple's new CEO.", "avatar-handoff", {
    people: [
      {name: "JOHN TERNUS", role: "约翰 · 特纳斯", meta: "HARDWARE ENGINEERING · JOINED 2001", tone: "primary"},
      {name: "TIM COOK", role: "蒂姆 · 库克", meta: "OPERATIONAL LEGACY", tone: "muted"},
    ],
  }),
  beat("zhuzige-profile", 12, 27, "CEO PROFILE · 01", "首秀与公众关注", "秋季发布会将成为新任 CEO 的重要亮相", "The fall event becomes his first major appearance.", "logo-wordmark", {steps: strategySteps}),
  beat("zhuzige-career", 27, 40, "CEO PROFILE · 02", "机械工程师的二十五年", "从机械工程到苹果产品设计部门", "From mechanical engineering to Apple's product design team.", "desktop-folders", {
    people: [
      {name: "JOHN TERNUS", role: "2001 加入苹果", meta: "25 YEARS INSIDE APPLE", tone: "primary"},
      {name: "PRODUCT DESIGN", role: "硬件产品线", meta: "IPAD · MAC · AIRPODS", tone: "muted"},
    ],
  }),
  beat("zhuzige-crossroads", 40, 54, "DECISIVE CHOICES", "决定 CEO 的不是资历", "真正让他脱颖而出的，是关键路线选择", "Decisive choices, not seniority, set him apart.", "ordered-sequence", {steps: hardwareSteps}),
  beat("zhuzige-silicon", 54, 66, "APPLE SILICON · 01", "从 Intel 到自研芯片", "Mac 从 Intel 架构切换到 Apple Silicon", "Mac transitions from Intel to Apple Silicon.", "diagonal-chips", {steps: hardwareSteps}),
  beat("zhuzige-silicon-gain", 66, 78, "APPLE SILICON · 02", "性能与续航的跃迁", "M 系列带来性能和续航的双重突破", "M-series brings a leap in power and battery life.", "draw-line"),
  beat("zhuzige-platform-shift", 78, 90, "PLATFORM SHIFT", "两年完成主力产品迁移", "高风险的平台切换，被苹果迅速完成", "Apple completes a high-risk platform shift at speed.", "event-timeline", {steps: hardwareSteps}),
  beat("zhuzige-thinness", 90, 103, "THE THINNESS TRADEOFF", "轻薄曾经压过性能", "极致轻薄曾以性能、散热与接口为代价", "Thinness once came at the cost of power, cooling, and ports.", "reject-list", {steps: hardwareSteps}),
  beat("zhuzige-ports", 103, 117, "PRO WORKFLOW RETURN", "接口与专业能力回归", "HDMI、SD 卡槽和专业用户需求重新被看见", "HDMI, SD, and pro workflows return to the agenda.", "check-progress", {steps: hardwareSteps}),
  beat("zhuzige-pro-market", 117, 132, "MACBOOK PRO · REBUILT", "重新拥抱专业市场", "MacBook Pro 重做后，苹果回到专业用户身边", "A rebuilt MacBook Pro brings Apple back to professionals.", "pivot-list", {steps: hardwareSteps}),
  beat("zhuzige-hardware-portfolio", 132, 147, "HARDWARE PORTFOLIO", "硬件路线的连贯性", "iPad、Mac 与产品线被重新统一", "iPad, Mac, and the broader hardware lineup reconnect.", "logo-wordmark"),
  beat("zhuzige-airpods", 147, 162, "AIRPODS EVOLUTION", "从耳机到健康设备", "AirPods 从无线耳机走向降噪与助听功能", "AirPods evolve from earbuds to ANC and hearing support.", "progress-donut", {steps: hardwareSteps}),
  beat("zhuzige-leadership", 162, 177, "LEADERSHIP PROFILE", "技术之外的组织能力", "CEO 既要懂技术，也要有商业判断与领导力", "A CEO needs technical depth, judgment, and leadership.", "clipboard-note", {
    people: [
      {name: "TERNUS", role: "硬件负责人", meta: "ENGINEERING · COLLABORATION", tone: "primary"},
      {name: "APPLE", role: "高管团队", meta: "LOW PROFILE · TRUST", tone: "muted"},
    ],
  }),
  beat("zhuzige-market-choice", 177, 192, "MARKET APPROVAL", "为什么市场认可他", "低调、协作和硬件判断，成为资本市场的信号", "Steady leadership and hardware judgment become a market signal.", "zoom-statement", {
    metric: {label: "MARKET SIGNAL", value: "25", suffix: "YEARS", year: "APPLE"},
  }),
  beat("zhuzige-functional-org", 192, 207, "APPLE OPERATING MODEL", "职能型组织", "苹果并不按产品线设立传统事业部", "Apple is organized by functions, not product divisions.", "org-chart", {steps: strategySteps}),
  beat("zhuzige-ceo-integrator", 207, 222, "CEO AS INTEGRATOR", "跨职能取舍", "只有 CEO 能统筹跨硬件、软件与服务的取舍", "The CEO integrates tradeoffs across hardware, software, and services.", "time-rewind"),
  beat("zhuzige-candidates", 222, 238, "SUCCESSION DECISION", "接班人的取舍", "董事会最终选择了更年轻的硬件负责人", "The board ultimately chooses the younger hardware leader.", "photo-wall", {
    people: [
      {name: "JOHN TERNUS", role: "HARDWARE", meta: "NEXT CEO", tone: "primary"},
      {name: "OTHER CANDIDATES", role: "SOFTWARE · OPS", meta: "ALTERNATIVE PATHS", tone: "muted"},
    ],
  }),
  beat("zhuzige-direction", 238, 250, "NEXT DIRECTION", "软硬件重新结合", "新领导层意味着更重视硬件创新和软硬协同", "The next era emphasizes hardware innovation and integration.", "data-flow", {steps: strategySteps}),
  beat("zhuzige-soft-hard", 250, 260, "PRODUCT ROADMAP", "新形态硬件的窗口", "端侧 AI、可穿戴与新形态设备正在成为方向", "On-device AI, wearables, and new devices shape the roadmap.", "product-explosion", {steps: strategySteps}),
  beat("zhuzige-future", 260, 274, "ACT 05 · THE NEXT BATTLE", "苹果的下一阶段", "未来的关键是如何把算力、系统和产品重新结合", "The next task is to reunite compute, systems, and products.", "market-battlefield", {steps: strategySteps}),
  beat("zhuzige-future-devices", 274, 289, "NEXT HARDWARE", "Vision Pro 与端侧 AI", "新产品形态要从展示技术变成真实体验", "New forms must become real experiences, not just demos.", "newspaper-swap", {steps: strategySteps}),
  beat("zhuzige-services", 289, 304, "SERVICES MOAT", "成熟业务与新增量", "服务业务已经成熟，新体验才是增长空间", "Services are mature; new experiences create the next growth space.", "cook-machine", {steps: strategySteps}),
  beat("zhuzige-cook-transition", 304, 319, "TRANSITION SUPPORT", "库克留下的能力", "库克仍会以经验支持新任 CEO 的过渡", "Cook's experience continues to support the transition.", "route-map"),
  beat("zhuzige-market-debate", 319, 334, "GLOBAL DEBATE", "乐观与担忧并存", "有人看好端侧 AI，也有人认为苹果起步太慢", "Some favor Apple's AI future; others fear it is late.", "data-flow", {steps: strategySteps}),
  beat("zhuzige-ai-question", 334, 349, "AI QUESTION", "算力如何变成体验", "真正的问题不是 AI 标签，而是它如何进入产品", "The question is not the AI label, but how it enters products.", "screen-recording", {steps: strategySteps}),
  beat("zhuzige-opinion", 349, 364, "A PERSONAL VIEW", "不必预言未来", "未来无法预言，但工程能力值得被认真看待", "The future is unknown, but engineering capacity matters.", "zoom-statement", {
    metric: {label: "ENGINEERING", value: "25", suffix: "YEARS", year: "TERNUS"},
  }),
  beat("zhuzige-innovation", 364, 379, "INNOVATION WINDOW", "从厚实基础走向创新", "积累足够厚实，下一任掌舵人才能放手创新", "A strong base gives the next leader room to innovate.", "desktop-folders", {
    metric: {label: "NEXT WINDOW", value: "2026", suffix: "PRODUCT ERA", year: "APPLE"},
  }),
  beat("zhuzige-cook-legacy", 379, 394, "COOK LEGACY", "运营机器留下的基础", "库克时代为苹果积累了极其丰厚的能力", "The Cook era leaves Apple an exceptionally strong foundation.", "time-rewind"),
  beat("zhuzige-consumer", 394, 410, "CONSUMER VIEW", "产品才是最终答案", "作为消费者，我们期待的不是数字，而是下一次惊喜", "As consumers, we want the next great surprise, not just metrics.", "clipboard-note", {
    people: [
      {name: "PRODUCT", role: "真正的答案", meta: "EXPERIENCE FIRST", tone: "primary"},
      {name: "METRICS", role: "财务数字", meta: "NOT THE WHOLE STORY", tone: "muted"},
    ],
  }),
  beat("zhuzige-product-close", 410, 426, "ONE MORE PRODUCT", "体验必须足够出色", "只要产品足够强，苹果就仍然值得期待", "If the product is strong enough, Apple remains worth watching.", "closing-checklist", {steps: strategySteps}),
  beat("zhuzige-finale", 426, 442.62, "ACT 06 · ONE MORE THING", "你看好特纳斯吗", "这就是本期视频：你看好特纳斯开启的新时代吗？", "Do you believe in the Ternus era?", "spotlight-question", {
    metric: {label: "NEXT CHAPTER", value: "2026", suffix: "PRODUCT ERA", year: "APPLE"},
  }),
];


