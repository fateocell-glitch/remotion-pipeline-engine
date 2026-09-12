import type {JasonWuCue} from "./timeline";

export const jasonWuTestCues: JasonWuCue[] = [
  {
    id: "test-opening",
    start: 0,
    end: 25,
    section: {
      eyebrow: "APPLE SUCCESSION · 2011 / 2026",
      subtitle: "15年掌舵终局：特纳斯接棒苹果",
    },
    caption: {
      zh: "库克正式卸任 CEO，特纳斯接过科技巨舰舵盘",
      en: "Tim Cook steps down as CEO, and John Ternus takes the helm",
    },
    layout: "person-rank",
    people: [
      {
        name: "JOHN TERNUS",
        role: "约翰 · 特纳斯 · 50 岁",
        meta: "HARDWARE ENGINEERING · NEW CEO",
        tone: "primary",
      },
      {
        name: "TIM COOK",
        role: "蒂姆 · 库克",
        meta: "2011 → 2026 · 15 年 · EXECUTIVE CHAIRMAN",
        tone: "muted",
      },
    ],
  },
  {
    id: "test-duel",
    start: 25,
    end: 56,
    section: {
      eyebrow: "COOK VS TERNUS",
      subtitle: "财会刀法 vs 极客工程",
    },
    caption: {
      zh: "苹果的顶层逻辑，正从财会主导转向工程师领航",
      en: "Apple's top logic shifts from finance-led to engineer-led",
    },
    layout: "pivot-list",
    steps: [
      {
        index: "01",
        title: "库克 · 供应链与运营宗师",
        subtitle: "INVENTORY 30 DAYS → 2-5 DAYS",
        active: true,
        tone: "blue",
      },
      {
        index: "02",
        title: "服务业务 · 年营收 1000 亿美元",
        subtitle: "SERVICES CASH ENGINE",
        active: true,
        tone: "gold",
      },
      {
        index: "03",
        title: "特纳斯 · 25 年硬件工程师",
        subtitle: "MATERIALS · TOLERANCE · ARCHITECTURE",
        active: true,
        tone: "blue",
      },
    ],
  },
  {
    id: "test-three-strikes",
    start: 56,
    end: 91,
    section: {
      eyebrow: "TERNUS ERA · THREE SHOCKS",
      subtitle: "新官上任的三大重击",
    },
    caption: {
      zh: "硬件、AI 和产品定义权，将被重新推上前台",
      en: "Hardware, AI, and product definition move back to the front",
    },
    layout: "event-timeline",
    steps: [
      {
        index: "01",
        title: "硬件激进主义回潮",
        subtitle: "R&D RATIO BREAKS 7.5%",
        active: true,
        tone: "gold",
      },
      {
        index: "02",
        title: "全栈 AI 落地救赎",
        subtitle: "2.2B DEVICES · ON-DEVICE NPU",
        active: true,
        tone: "blue",
      },
      {
        index: "03",
        title: "重塑产品定义权",
        subtitle: "TITANIUM · THERMAL REDESIGN",
        active: true,
        tone: "blue",
      },
    ],
  },
  {
    id: "test-ending",
    start: 91,
    end: 135,
    section: {
      eyebrow: "FINAL QUESTION · COMMENT",
      subtitle: "尾声与互动",
    },
    caption: {
      zh: "告别挤牙膏的苹果，还能再次改变世界吗？",
      en: "Can Apple change the world again after leaving incrementalism behind?",
    },
    layout: "value-verdict",
    metric: {
      label: "NET CASH FLOW",
      value: "$1600",
      suffix: "BILLION",
      year: "COOK LEGACY",
    },
  },
];
