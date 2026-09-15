import type {JasonWuCue} from "./timeline";

export const jasonWuLongCues: JasonWuCue[] = [
  {
    id: "long-capital-handoff",
    start: 0,
    end: 45,
    section: {
      eyebrow: "ACT 01 · CAPITAL HANDOFF",
      subtitle: "万亿巨轮交接与资本大盘",
    },
    caption: {
      zh: "库克交棒特纳斯，苹果进入第七任掌门时代",
      en: "Cook hands Apple to Ternus, its seventh chief",
    },
    layout: "capital-dashboard",
    people: [
      {
        name: "JOHN TERNUS",
        role: "约翰 · 特纳斯 · 50 岁",
        meta: "HARDWARE ENGINEERING · CEO VII",
        tone: "primary",
      },
      {
        name: "TIM COOK",
        role: "蒂姆 · 库克",
        meta: "2011 → 2026 · 15 YEARS",
        tone: "muted",
      },
    ],
  },
  {
    id: "long-cook-machine",
    start: 45,
    end: 90,
    section: {
      eyebrow: "ACT 02 · COOK DOCTRINE",
      subtitle: "库克主义的极限",
    },
    caption: {
      zh: "精准刀法撑起利润，也压低了创新风险",
      en: "Precision finance lifts profit and suppresses risk",
    },
    layout: "cook-machine",
    steps: [
      {index: "01", title: "库存周转 30 天 → 2-5 天", subtitle: "ZERO INVENTORY MACHINE", active: true, tone: "blue"},
      {index: "02", title: "20% 出货量 · 85% 利润", subtitle: "SMARTPHONE PROFIT CAPTURE", active: true, tone: "gold"},
      {index: "03", title: "服务生态占比突破 25%", subtitle: "SERVICES GROSS MARGIN 74%", active: true, tone: "blue"},
    ],
  },
  {
    id: "long-engineer-return",
    start: 90,
    end: 150,
    section: {
      eyebrow: "ACT 03 · ENGINEER RETURN",
      subtitle: "特纳斯与硬件工程还魂",
    },
    caption: {
      zh: "产品定义权，重新回到工程师手里",
      en: "Product authority returns to engineering",
    },
    layout: "pivot-list",
    steps: [
      {index: "01", title: "M-Series Efficiency +300%", subtitle: "PERFORMANCE PER WATT", active: true, tone: "gold"},
      {index: "02", title: "Battery 22h+", subtitle: "MACBOOK PRO ENDURANCE", active: true, tone: "blue"},
      {index: "03", title: "Tolerance 0.01mm", subtitle: "MATERIALS · THERMAL · PACKAGING", active: true, tone: "blue"},
    ],
  },
  {
    id: "long-battlefield",
    start: 150,
    end: 200,
    section: {
      eyebrow: "ACT 04 · MARKET WAR ROOM",
      subtitle: "新政下的三大攻坚战",
    },
    caption: {
      zh: "研发、端侧 AI 与供应链，将决定新苹果的上限",
      en: "R&D, on-device AI, and supply chain set the ceiling",
    },
    layout: "market-battlefield",
    steps: [
      {index: "01", title: "R&D Ratio 10%", subtitle: "BUDGET RELEASE", active: true, tone: "gold"},
      {index: "02", title: "Active Devices 2.2B", subtitle: "ON-DEVICE NPU NETWORK", active: true, tone: "blue"},
      {index: "03", title: "Latency <15ms", subtitle: "EDGE MODEL RESPONSE", active: true, tone: "blue"},
    ],
  },
  {
    id: "long-finale",
    start: 200,
    end: 240,
    section: {
      eyebrow: "ACT 05 · ONE MORE THING",
      subtitle: "终局总结与互动升温",
    },
    caption: {
      zh: "全新苹果，还能再次拿出 One more thing 吗",
      en: "Can the new Apple deliver one more thing?",
    },
    layout: "zoom-statement",
    metric: {
      label: "NET CASH FLOW",
      value: "$1600",
      suffix: "BILLION",
      year: "COOK LEGACY",
    },
  },
];
