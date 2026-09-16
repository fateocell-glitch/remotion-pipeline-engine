import type {ComponentType} from "react";
import {
  DemoAvatarFlip, FloatingCommentCards, KineticTypographyAccent, GrowthTimelineLine, CapitalDashboardNumbers,
  SpecBadgeAndTypewriter, SplitScreenAccent, type LayoutEffectProps,
} from "./DemoEffectComponents";
import {
  BareTypography, BullBear, ChapterCard, CheckProgress, ClipboardNote, ClosingChecklist,
  DesktopFolders, DiagonalChips, DrawLine, FloatingChips, LogoWordmark,
  OpinionHero, OrderedSequence, OrgChart, PhotoWall, ProductExplosion, ProgressDonut,
  RejectList, RouteMap, ScreenRecording, TimeRewind,
} from "./IncompleteEffectComponents";
import {PlatformShiftLine, TradeoffRejectRound, RecoveryProgressBars, HudGlowStack, BriefingPoster, RewindMilestones, FlyingPaperStack, ChecklistEditorial} from "./RecoveredEffectComponents";
import {CopyOpenHeroTitle, CopyOpenProgressBar, CopyOpenComparisonCard, CopyOpenTerminalScene, CopyOpenEndTag, CopyOpenBarChart, CopyOpenLineChart, CopyOpenPieChart, CopyOpenKPIGrid} from "./CopyOpenComponents";
import {SpeakerGrowthDashboard} from "./SpeakerGrowthDashboard";
import type {JasonWuCue} from "./timeline";
import {ValueVerdict} from "./ValueVerdict";
import {jcLayoutDefinitions} from "./jcLayoutRegistry";

export type EditableField = {key: string; label: string; type: "text" | "number" | "select" | "textarea" | "string-list" | "key-value-list"; placeholder?: string; description?: string; options?: {label: string; value: string}[]};
export interface ComponentManifest {
  id: string;
  intent: "process" | "metrics" | "narrative" | "contrast" | "system";
  capacity: {minItems: number; maxItems: number};
  keywords: string[];
  visualWeight: "heavy" | "medium" | "light";
}
export type LayoutDef = {
  key: JasonWuCue["layout"];
  component: ComponentType<LayoutEffectProps>;
  editableFields: EditableField[];
  defaultProps: Record<string, unknown>;
  meta: {category: "data" | "typography" | "story" | "interactive"; label: string; description: string};
  renderLayer: "primary" | "enhancement";
  manifest: ComponentManifest;
  usesInternalMotionWrapper?: boolean;
};

const copy: EditableField[] = [{key: "headline", label: "主标题", type: "text"}];
const checkboxColorField: EditableField = {key: "boxColor", label: "确认框颜色", type: "select", options: [{label: "自动", value: "auto"}, {label: "紫色", value: "purple"}, {label: "蓝色", value: "blue"}, {label: "金色", value: "gold"}, {label: "白色", value: "white"}, {label: "绿色", value: "green"}, {label: "红色", value: "red"}]};
const text = (key: string, label: string): EditableField => ({key, label, type: "text"});
const prose = (key: string, label: string): EditableField => ({key, label, type: "textarea"});
const list = (key: string, label: string, description?: string): EditableField => ({key, label, type: "string-list", description});
const CONTROLLED_FIELDS: Partial<Record<JasonWuCue["layout"], EditableField[]>> = {
  "person-rank": [text("leftName", "左侧人物"), text("leftRole", "左侧头衔"), text("rightName", "右侧人物"), text("rightRole", "右侧头衔")],
  "event-timeline": [list("years", "时间节点", "横线依次推进至每个节点")],
  "pivot-list": [prose("text", "打字机文本")],
  "capital-dashboard": [text("marketLabel", "小标题1【标题内容】"), {key:"marketTo",label:"数值1【数字内容】",type:"number"}, text("marketSuffix", "数字单位"), text("engineeringLabel", "小标题2【标题内容】"), {key:"engineeringTo",label:"数值2【数字内容】",type:"number"}, text("engineeringSuffix", "数字单位")],
  "cook-machine": [text("title", "顶端标签"), text("leftLabel", "小标题1【标题内容】"), text("leftValue", "数值1【数字内容】"), text("rightLabel", "小标题2【标题内容】"), text("rightValue", "数值2【数字内容】"), {key:"from",label:"起始比例",type:"number"}, {key:"to",label:"结束比例",type:"number"}],
  "market-battlefield": [text("headline", "地图标题"), list("nodes", "路线节点")],
  "reject-list": [text("title", "清单标题"), list("items", "正文内容", "每项对应一个叉号，可配合副标题显示"), text("subLabel", "默认副标题"), checkboxColorField],
  "check-progress": [text("bodyText", "进度条标题【正文内容】"), {key:"progress",label:"完成度",type:"number"}, list("items", "正文内容", "每项对应一个打勾的灰色文字列表"), checkboxColorField],
  "diagonal-chips": [list("items", "Chip 文案", "每项对应一个斜入标签")],
  "floating-chips": [list("items", "浮动 Chip 文案")],
  "bare-typography": [text("headline", "大标题"), text("eyebrow", "辅助标签"), prose("body", "说明文案")],
  "chapter-card": [text("chapterLabel", "章节标签"), text("headline", "章节标题"), prose("body", "章节说明")],
  "logo-wordmark": [text("mark", "标志字母"), text("headline", "标志标题"), text("eyebrow", "辅助标签")],
  "ordered-sequence": [text("categoryTag", "阶段标签"), list("steps", "步骤列表", "步骤按顺序逐一弹出")],
  "org-chart": [text("leader", "核心节点"), text("leaderRole", "核心节点说明"), list("units", "组织单元")],
  "draw-line": [prose("bodyText", "正文内容"), text("highlightQuote", "副文内容")],
  "progress-donut": [text("label", "小标题"), {key:"value",label:"数值",type:"number"}, text("bodyText", "正文内容")],
  "avatar-handoff": [text("leftName", "交出方"), text("leftRole", "交出方头衔"), text("rightName", "接任方"), text("rightRole", "接任方头衔")],
  "bull-bear": [text("bullLabel", "多方观点标签"), prose("bullText", "多方观点【正文内容】"), text("bearLabel", "空方观点标签"), prose("bearText", "空方观点【正文内容】"), prose("highlightQuote", "底部金色强调文字")],
  "opinion-hero": [text("label", "观点标签"), text("headline", "观点大字"), prose("body", "观点说明")],
  "photo-wall": [text("photoTitle1", "照片1标题"), text("photoSubtitle1", "照片1副标题"), text("photo1", "照片1图片URL"), text("photoTitle2", "照片2标题"), text("photoSubtitle2", "照片2副标题"), text("photo2", "照片2图片URL"), text("photoTitle3", "照片3标题"), text("photoSubtitle3", "照片3副标题"), text("photo3", "照片3图片URL"), text("photoTitle4", "照片4标题"), text("photoSubtitle4", "照片4副标题"), text("photo4", "照片4图片URL")],
  "product-explosion": [text("centerLabel", "中心产品标题"), text("centerImage", "中心产品图片"), text("productTitle1", "产品1名称"), text("productImage1", "产品1图片"), text("productTitle2", "产品2名称"), text("productImage2", "产品2图片"), text("productTitle3", "产品3名称"), text("productImage3", "产品3图片"), text("productTitle4", "产品4名称"), text("productImage4", "产品4图片")],
  "route-map": [text("headline", "地图标题"), list("nodes", "路线节点")],
  "data-flow": [text("title", "顶端标签"), text("leftLabel", "左侧标签"), text("leftValue", "左侧数值"), text("rightLabel", "右侧标签"), text("rightValue", "右侧数值"), {key:"from",label:"起始比例",type:"number"}, {key:"to",label:"结束比例",type:"number"}],
  "screen-recording": [text("headline", "窗口标题"), list("items", "窗口数据卡")],
  "zoom-statement": [text("headline", "推拉大字"), text("eyebrow", "辅助标签")],
  "desktop-folders": [list("items", "文件夹名称")],
  "time-rewind": [text("headline", "回溯标题"), list("years", "时间节点"), prose("bodyText", "时间回溯内容正文")],
  "clipboard-note": [text("label", "便签标签"), prose("body", "正文内容"), text("highlightQuote", "副文内容"), checkboxColorField],
  "closing-checklist": [text("title", "清单标题（与核心大标题同步）"), list("items", "清单内容", "每项对应一个确认框"), checkboxColorField],
  "platform-shift-line": [text("metricLabel", "正文内容"), {key: "count", label: "数值内容", type: "number"}, text("summary", "副文内容"), text("startLabel", "起点内容"), text("endLabel", "终点内容")],
  "tradeoff-reject-round": [text("label", "否定项标签"), prose("bodyText", "正文内容"), list("items", "否定项", "三项会显示在风险排除下方的红色叉号列表中")],
  "recovery-progress-bars": [text("label", "进度标签"), prose("bodyText", "正文内容"), list("items", "进度项目"), {key: "progress", label: "完成度", type: "number", description: "每条进度会在该数字正负 15% 内稳定浮动"}],
  "hud-glow-stack": [text("subLabel", "卡片辅助标签"), list("items", "HUD 卡片内容")],
  "briefing-poster": [text("label", "简报标签"), prose("bodyText", "正文内容"), list("items", "副文内容", "每项对应一个 checkbox 勾选项")],
  "rewind-milestones": [text("label", "回溯标签"), text("title", "回溯标题"), list("years", "年份节点"), text("milestoneLabel", "节点说明")],
  "flying-paper-stack": [text("headline", "主卡标题"), text("ghostTitle", "背景卡标题"), prose("body", "卡片正文")],
  "checklist-editorial": [text("label", "清单标签"), text("title", "清单标题"), list("items", "清单内容", "每项对应一个方形确认框")],
  "spotlight-question": [list("comments", "评论内容")],
  "copyopen-hero-title": [prose("body", "正文内容"), text("highlightQuote", "副文内容")],
  "copyopen-progress-bar": [{key:"progress",label:"进度数值",type:"number"}, prose("body", "进度说明")],
  "copyopen-comparison-card": [text("leftLabel", "左侧标签"), text("leftValue", "左侧数值"), text("rightLabel", "右侧标签"), text("rightValue", "右侧数值"), prose("body", "中间变化说明")],
  "copyopen-terminal-scene": [list("steps", "终端命令与输出")],
  "copyopen-end-tag": [prose("body", "结尾标语")],
  "copyopen-bar-chart": [list("items", "柱状标签"), {key:"values",label:"柱状数值",type:"string-list"}],
  "copyopen-line-chart": [list("items", "折线横轴"), {key:"values",label:"折线数值",type:"string-list"}],
  "copyopen-pie-chart": [list("items", "分区标签"), {key:"values",label:"分区数值",type:"string-list"}],
  "copyopen-kpi-grid": [list("items", "指标标签"), {key:"values",label:"指标数值",type:"string-list"}],
  "speaker-growth-dashboard": [text("eyebrow", "顶端标签"), text("subline", "副标题"), text("skillLabel", "能力标签"), text("feature1Title", "功能1【正文内容】"), text("feature1Sub", "功能1【副文内容】"), text("feature2Title", "功能2【正文内容】"), text("feature2Sub", "功能2【副文内容】"), text("metricTitle", "增长指标标题"), text("metricValue", "增长数字"), text("metricUnit", "数字单位"), text("metricSub", "指标副文"), text("footer", "底部说明")],
};
export const LAYOUT_MANIFEST: Partial<Record<JasonWuCue["layout"], ComponentManifest>> = {
  "speaker-growth-dashboard": {
    "id": "speaker-growth-dashboard",
    "intent": "metrics",
    "capacity": {
      "minItems": 1,
      "maxItems": 3
    },
    "keywords": [
      "口播",
      "自媒体",
      "增长",
      "获客",
      "会员",
      "转化"
    ],
    "visualWeight": "heavy"
  },  "capital-dashboard": {
    "id": "capital-dashboard",
    "intent": "metrics",
    "capacity": {
      "minItems": 1,
      "maxItems": 2
    },
    "keywords": [
      "数据",
      "增长",
      "市值",
      "营收",
      "百分比",
      "指标"
    ],
    "visualWeight": "medium"
  },
  "progress-donut": {
    "id": "progress-donut",
    "intent": "metrics",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "进度",
      "完成度",
      "百分比",
      "转化率",
      "%"
    ],
    "visualWeight": "light"
  },
  "recovery-progress-bars": {
    "id": "recovery-progress-bars",
    "intent": "metrics",
    "capacity": {
      "minItems": 2,
      "maxItems": 5
    },
    "keywords": [
      "进度",
      "恢复",
      "完成",
      "推进",
      "百分比"
    ],
    "visualWeight": "medium"
  },
  "platform-shift-line": {
    "id": "platform-shift-line",
    "intent": "system",
    "capacity": {
      "minItems": 3,
      "maxItems": 5
    },
    "keywords": [
      "产品线",
      "平台",
      "演进",
      "扩展",
      "链路"
    ],
    "visualWeight": "medium"
  },
  "hud-glow-stack": {
    "id": "hud-glow-stack",
    "intent": "system",
    "capacity": {
      "minItems": 2,
      "maxItems": 4
    },
    "keywords": [
      "系统",
      "信号",
      "链路",
      "模块",
      "闭环"
    ],
    "visualWeight": "medium"
  },
  "copyopen-progress-bar": {
    "id": "copyopen-progress-bar",
    "intent": "metrics",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "进度",
      "百分比",
      "完成",
      "%"
    ],
    "visualWeight": "light"
  },
  "copyopen-comparison-card": {
    "id": "copyopen-comparison-card",
    "intent": "metrics",
    "capacity": {
      "minItems": 2,
      "maxItems": 2
    },
    "keywords": [
      "对比",
      "差异",
      "数值",
      "增长"
    ],
    "visualWeight": "medium"
  },
  "copyopen-bar-chart": {
    "id": "copyopen-bar-chart",
    "intent": "metrics",
    "capacity": {
      "minItems": 3,
      "maxItems": 5
    },
    "keywords": [
      "柱状",
      "排名",
      "数据",
      "对比"
    ],
    "visualWeight": "medium"
  },
  "copyopen-line-chart": {
    "id": "copyopen-line-chart",
    "intent": "metrics",
    "capacity": {
      "minItems": 3,
      "maxItems": 5
    },
    "keywords": [
      "趋势",
      "增长",
      "曲线",
      "时间"
    ],
    "visualWeight": "medium"
  },
  "copyopen-pie-chart": {
    "id": "copyopen-pie-chart",
    "intent": "metrics",
    "capacity": {
      "minItems": 3,
      "maxItems": 5
    },
    "keywords": [
      "占比",
      "比例",
      "分布",
      "份额"
    ],
    "visualWeight": "medium"
  },
  "copyopen-kpi-grid": {
    "id": "copyopen-kpi-grid",
    "intent": "metrics",
    "capacity": {
      "minItems": 3,
      "maxItems": 6
    },
    "keywords": [
      "KPI",
      "指标",
      "数据",
      "增长"
    ],
    "visualWeight": "medium"
  },
  "ordered-sequence": {
    "id": "ordered-sequence",
    "intent": "process",
    "capacity": {
      "minItems": 2,
      "maxItems": 5
    },
    "keywords": [
      "第一步",
      "第二步",
      "阶段",
      "步骤",
      "流程"
    ],
    "visualWeight": "medium"
  },
  "event-timeline": {
    "id": "event-timeline",
    "intent": "process",
    "capacity": {
      "minItems": 3,
      "maxItems": 5
    },
    "keywords": [
      "时间线",
      "阶段",
      "演进",
      "节点"
    ],
    "visualWeight": "medium"
  },
  "rewind-milestones": {
    "id": "rewind-milestones",
    "intent": "process",
    "capacity": {
      "minItems": 4,
      "maxItems": 6
    },
    "keywords": [
      "回溯",
      "过去",
      "演进",
      "节点"
    ],
    "visualWeight": "medium"
  },
  "time-rewind": {
    "id": "time-rewind",
    "intent": "process",
    "capacity": {
      "minItems": 1,
      "maxItems": 5
    },
    "keywords": [
      "回溯",
      "时间",
      "过去",
      "历史"
    ],
    "visualWeight": "light"
  },
  "route-map": {
    "id": "route-map",
    "intent": "process",
    "capacity": {
      "minItems": 3,
      "maxItems": 4
    },
    "keywords": [
      "路线",
      "路径",
      "流程",
      "地图"
    ],
    "visualWeight": "heavy"
  },
  "check-progress": {
    "id": "check-progress",
    "intent": "process",
    "capacity": {
      "minItems": 2,
      "maxItems": 5
    },
    "keywords": [
      "确认",
      "检查",
      "完成",
      "步骤"
    ],
    "visualWeight": "medium"
  },
  "org-chart": {
    "id": "org-chart",
    "intent": "system",
    "capacity": {
      "minItems": 3,
      "maxItems": 5
    },
    "keywords": [
      "组织",
      "部门",
      "分工",
      "架构"
    ],
    "visualWeight": "heavy"
  },
  "draw-line": {
    "id": "draw-line",
    "intent": "process",
    "capacity": {
      "minItems": 1,
      "maxItems": 2
    },
    "keywords": [
      "路径",
      "推导",
      "画线",
      "论证"
    ],
    "visualWeight": "light"
  },
  "copyopen-terminal-scene": {
    "id": "copyopen-terminal-scene",
    "intent": "process",
    "capacity": {
      "minItems": 3,
      "maxItems": 6
    },
    "keywords": [
      "命令",
      "流程",
      "执行",
      "工作流"
    ],
    "visualWeight": "heavy"
  },
  "zoom-statement": {
    "id": "zoom-statement",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "观点",
      "判断",
      "结论",
      "关键"
    ],
    "visualWeight": "light"
  },
  "opinion-hero": {
    "id": "opinion-hero",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "观点",
      "核心",
      "金句",
      "主张"
    ],
    "visualWeight": "heavy"
  },
  "bare-typography": {
    "id": "bare-typography",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "大字",
      "判断",
      "结论"
    ],
    "visualWeight": "light"
  },
  "spotlight-question": {
    "id": "spotlight-question",
    "intent": "narrative",
    "capacity": {
      "minItems": 2,
      "maxItems": 3
    },
    "keywords": [
      "问题",
      "评论",
      "为什么",
      "互动"
    ],
    "visualWeight": "light"
  },
  "bull-bear": {
    "id": "bull-bear",
    "intent": "contrast",
    "capacity": {
      "minItems": 2,
      "maxItems": 2
    },
    "keywords": [
      "看多",
      "风险",
      "对比",
      "多空"
    ],
    "visualWeight": "heavy"
  },
  "market-battlefield": {
    "id": "market-battlefield",
    "intent": "contrast",
    "capacity": {
      "minItems": 2,
      "maxItems": 4
    },
    "keywords": [
      "竞争",
      "对手",
      "市场对垒",
      "战场"
    ],
    "visualWeight": "heavy"
  },
  "tradeoff-reject-round": {
    "id": "tradeoff-reject-round",
    "intent": "contrast",
    "capacity": {
      "minItems": 2,
      "maxItems": 4
    },
    "keywords": [
      "风险",
      "否定",
      "排除",
      "不要"
    ],
    "visualWeight": "medium"
  },
  "reject-list": {
    "id": "reject-list",
    "intent": "contrast",
    "capacity": {
      "minItems": 2,
      "maxItems": 5
    },
    "keywords": [
      "错误",
      "问题",
      "风险",
      "避坑"
    ],
    "visualWeight": "medium"
  },
  "person-rank": {
    "id": "person-rank",
    "intent": "system",
    "capacity": {
      "minItems": 2,
      "maxItems": 3
    },
    "keywords": [
      "人物",
      "团队",
      "交接",
      "组织"
    ],
    "visualWeight": "medium"
  },
  "value-verdict": {
    "id": "value-verdict",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 2
    },
    "keywords": [
      "价值",
      "结论",
      "判断",
      "指标"
    ],
    "visualWeight": "medium"
  },
  "product-explosion": {
    "id": "product-explosion",
    "intent": "system",
    "capacity": {
      "minItems": 3,
      "maxItems": 5
    },
    "keywords": [
      "产品",
      "生态",
      "硬件",
      "系列"
    ],
    "visualWeight": "heavy"
  },
  "cook-machine": {
    "id": "cook-machine",
    "intent": "system",
    "capacity": {
      "minItems": 2,
      "maxItems": 4
    },
    "keywords": [
      "经营",
      "机器",
      "商业",
      "闭环"
    ],
    "visualWeight": "medium"
  },
  "photo-wall": {
    "id": "photo-wall",
    "intent": "narrative",
    "capacity": {
      "minItems": 3,
      "maxItems": 4
    },
    "keywords": [
      "照片",
      "证据",
      "案例",
      "产品"
    ],
    "visualWeight": "heavy"
  },
  "logo-wordmark": {
    "id": "logo-wordmark",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "品牌",
      "标志",
      "关键词"
    ],
    "visualWeight": "light"
  },
  "diagonal-chips": {
    "id": "diagonal-chips",
    "intent": "system",
    "capacity": {
      "minItems": 3,
      "maxItems": 5
    },
    "keywords": [
      "规格",
      "要点",
      "参数",
      "模块"
    ],
    "visualWeight": "light"
  },
  "floating-chips": {
    "id": "floating-chips",
    "intent": "system",
    "capacity": {
      "minItems": 2,
      "maxItems": 4
    },
    "keywords": [
      "标签",
      "要点",
      "模块",
      "信号"
    ],
    "visualWeight": "light"
  },
  "desktop-folders": {
    "id": "desktop-folders",
    "intent": "system",
    "capacity": {
      "minItems": 3,
      "maxItems": 4
    },
    "keywords": [
      "文件",
      "分类",
      "整理",
      "系统"
    ],
    "visualWeight": "medium"
  },
  "clipboard-note": {
    "id": "clipboard-note",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 3
    },
    "keywords": [
      "便签",
      "批注",
      "结论",
      "确认"
    ],
    "visualWeight": "medium"
  },
  "briefing-poster": {
    "id": "briefing-poster",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 4
    },
    "keywords": [
      "简报",
      "摘要",
      "观点",
      "案例"
    ],
    "visualWeight": "heavy"
  },
  "screen-recording": {
    "id": "screen-recording",
    "intent": "system",
    "capacity": {
      "minItems": 2,
      "maxItems": 4
    },
    "keywords": [
      "界面",
      "操作",
      "产品",
      "窗口"
    ],
    "visualWeight": "heavy"
  },
  "flying-paper-stack": {
    "id": "flying-paper-stack",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 3
    },
    "keywords": [
      "纸卡",
      "资料",
      "简报",
      "观点"
    ],
    "visualWeight": "medium"
  },
  "chapter-card": {
    "id": "chapter-card",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "章节",
      "开场",
      "主题"
    ],
    "visualWeight": "heavy"
  },
  "closing-checklist": {
    "id": "closing-checklist",
    "intent": "process",
    "capacity": {
      "minItems": 2,
      "maxItems": 5
    },
    "keywords": [
      "收尾",
      "清单",
      "确认",
      "总结"
    ],
    "visualWeight": "medium"
  },
  "checklist-editorial": {
    "id": "checklist-editorial",
    "intent": "process",
    "capacity": {
      "minItems": 2,
      "maxItems": 5
    },
    "keywords": [
      "清单",
      "确认",
      "步骤",
      "总结"
    ],
    "visualWeight": "medium"
  },
  "pivot-list": {
    "id": "pivot-list",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 4
    },
    "keywords": [
      "打字机",
      "观点",
      "列表"
    ],
    "visualWeight": "medium"
  },
  "copyopen-hero-title": {
    "id": "copyopen-hero-title",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "开场",
      "标题",
      "主视觉"
    ],
    "visualWeight": "heavy"
  },
  "copyopen-end-tag": {
    "id": "copyopen-end-tag",
    "intent": "narrative",
    "capacity": {
      "minItems": 1,
      "maxItems": 1
    },
    "keywords": [
      "结尾",
      "标语",
      "收束"
    ],
    "visualWeight": "light"
  }
};
const mergeFields = (key: JasonWuCue["layout"], editableFields: EditableField[]) => {
  const merged = [...(CONTROLLED_FIELDS[key] ?? []), ...editableFields];
  return merged.filter((field, index) => merged.findIndex((candidate) => candidate.key === field.key) === index);
};
const item = (key: JasonWuCue["layout"], component: ComponentType<LayoutEffectProps>, label: string, description: string, category: LayoutDef["meta"]["category"], renderLayer: LayoutDef["renderLayer"] = "primary", editableFields: EditableField[] = copy, defaultProps: Record<string, unknown> = {}): LayoutDef => ({key, component, editableFields: mergeFields(key, editableFields), defaultProps, meta: {category, label, description}, renderLayer, manifest: LAYOUT_MANIFEST[key] ?? {id: key, intent: "narrative", capacity: {minItems: 1, maxItems: 1}, keywords: [label, description, category], visualWeight: "medium"}});

export const LAYOUT_DEFINITIONS: LayoutDef[] = [
  item("person-rank", DemoAvatarFlip, "人物交接", "双人物交接与权力转换", "story", "primary", [{key: "leftName", label: "左侧人物", type: "text"}, {key: "rightName", label: "右侧人物", type: "text"}], {leftName: "人物 A", rightName: "人物 B"}),
  item("event-timeline", GrowthTimelineLine, "增长时间轴", "横向节点线与光点推进", "data", "enhancement", [list("years", "时间节点")], {years: ["起步", "迭代", "规模化", "目标"]}),
  item("value-verdict", ValueVerdict, "价值结论", "结论与关键指标卡", "story", "primary", [prose("body", "正文内容"), text("metricLabel", "指标标签"), text("metricValue", "数值"), text("metricUnit", "单位")], {metricLabel: "KEY SIGNAL"}),
  item("pivot-list", SpecBadgeAndTypewriter, "规格打字机", "绿色终端逐字出现", "interactive", "enhancement", [{key: "text", label: "打字机文本", type: "textarea"}], {}),
  item("capital-dashboard", CapitalDashboardNumbers, "资本仪表盘", "双数字卡滚动增长", "data", "primary", [text("marketLabel", "小标题1【标题内容】"), {key: "marketTo", label: "数值1【数字内容】", type: "number"}, text("marketSuffix", "数字单位"), text("engineeringLabel", "小标题2【标题内容】"), {key: "engineeringTo", label: "数值2【数字内容】", type: "number"}, text("engineeringSuffix", "数字单位")], {marketLabel: "市场规模", marketTo: 4600, marketSuffix: "亿", engineeringLabel: "增长率", engineeringTo: 25, engineeringSuffix: "%"}),
  item("cook-machine", SplitScreenAccent, "经营机器", "运营效率和利润对照", "story", "primary", copy, {leftLabel: "PROFIT", rightLabel: "SHIPMENT", from: 20, to: 85}),
  item("market-battlefield", RouteMap, "市场对垒", "供应链路线和区域节点", "data"),
  item("reject-list", RejectList, "错误清单", "叉号否定与纠错列表", "story", "primary", [checkboxColorField], {boxColor: "auto", items: ["核心信息", "视觉节奏", "行动结论"], itemSubtitles: ["CUT FROM THE PRODUCT PATH", "REMOVE FROM THE FLOW", "BLOCK BEFORE RELEASE"]}),
  item("check-progress", CheckProgress, "进度确认", "进度条和勾选确认", "interactive", "primary", [checkboxColorField], {boxColor: "auto"}),
  item("diagonal-chips", DiagonalChips, "斜入标签", "斜向飞入的规格标签", "interactive", "primary", [{key: "items", label: "Chip 文案", type: "string-list", description: "每项对应一个斜入标签"}], {}),
  item("floating-chips", FloatingChips, "发光浮动标签", "发光漂浮的 Chip 标签", "interactive"),
  item("bare-typography", BareTypography, "纯文字排版", "无框大字信息层", "typography"),
  item("chapter-card", ChapterCard, "章节卡", "章节标题与信息摘要", "story"),
  item("logo-wordmark", LogoWordmark, "标志文字", "图形标志与文字组合", "story"),
  item("ordered-sequence", OrderedSequence, "顺序步骤", "编号信息逐项出现", "story", "primary", [{key: "categoryTag", label: "阶段标签", type: "text"}, {key: "steps", label: "步骤列表", type: "string-list", description: "步骤按顺序逐一弹出"}], {}),
  item("org-chart", OrgChart, "组织架构", "组织关系与中轴线动画", "story"),
  item("draw-line", DrawLine, "画线强调", "曲线绘制和重点标记", "interactive"),
  item("progress-donut", ProgressDonut, "环形进度", "环形进度与完成度", "data"),
  item("avatar-handoff", DemoAvatarFlip, "头像交接", "双头像切换与接任", "story", "primary", [{key: "leftName", label: "交出方", type: "text"}, {key: "rightName", label: "接任方", type: "text"}], {leftName: "人物 A", leftRole: "起始角色", rightName: "人物 B", rightRole: "目标角色"}),
  item("bull-bear", BullBear, "多空对比", "左右观点与中线对照", "data", "primary", [{key: "bullLabel", label: "多方观点标签", type: "text"}, {key: "bullText", label: "多方观点【正文内容】", type: "textarea"}, {key: "bearLabel", label: "空方观点标签", type: "text"}, {key: "bearText", label: "空方观点【正文内容】", type: "textarea"}, {key: "highlightQuote", label: "底部金色强调文字", type: "textarea"}], {bullLabel: "看多观点", bearLabel: "风险提示", highlightQuote: "关键分歧决定最终走势"}),
  item("opinion-hero", OpinionHero, "观点主视觉", "重点观点大字强调", "typography"),
  item("photo-wall", PhotoWall, "照片墙", "多层产品图片卡片组合", "story", "primary", [], {photoTitle1: "核心信息", photoSubtitle1: "PRODUCT HISTORY", photo1: "", photoTitle2: "视觉节奏", photoSubtitle2: "VISUAL RHYTHM", photo2: "", photoTitle3: "行动结论", photoSubtitle3: "ACTION SIGNAL", photo3: "", photoTitle4: "补充证据", photoSubtitle4: "EXTRA PROOF", photo4: ""}),
  item("product-explosion", ProductExplosion, "产品爆炸图", "产品生态爆炸展示", "data", "primary", [], {centerLabel: "APPLE", productTitle1: "iPhone", productTitle2: "iPad", productTitle3: "Mac", productTitle4: "AirPods", items: ["iPhone", "iPad", "Mac", "AirPods"]}),
  item("route-map", RouteMap, "二维地图", "路线和区域说明", "data"),
  item("data-flow", SplitScreenAccent, "数据分屏", "软件硬件分屏数据对照", "data", "enhancement", [{key: "leftLabel", label: "左侧标签", type: "text"}, {key: "leftValue", label: "左侧数值", type: "text"}, {key: "rightLabel", label: "右侧标签", type: "text"}, {key: "rightValue", label: "右侧数值", type: "text"}, {key: "from", label: "起始比例", type: "number"}, {key: "to", label: "结束比例", type: "number"}], {}),
  item("screen-recording", ScreenRecording, "屏幕录制框", "产品界面与操作窗口", "interactive"),
  item("zoom-statement", KineticTypographyAccent, "镜头推拉大字", "镜头推拉与大字冲击", "typography", "enhancement"),
  item("desktop-folders", DesktopFolders, "桌面文件夹", "桌面文件与内容整理", "interactive"),
  item("time-rewind", TimeRewind, "时间回溯", "逆向时间线叙事", "story", "primary", [], {bodyText: "时间回归"}),
  item("clipboard-note", ClipboardNote, "剪贴板批注", "便签与批注信息", "interactive", "primary", [prose("body", "正文内容"), text("highlightQuote", "副文内容"), checkboxColorField], {boxColor: "auto", body: "展示可编辑的真实组件预设", highlightQuote: "真实组件预设说明"}),
  item("closing-checklist", ClosingChecklist, "结尾清单", "结论项目逐项确认", "story", "primary", [{key: "title", label: "清单标题（与核心大标题同步）", type: "text"}, {key: "items", label: "清单内容", type: "string-list", description: "每项对应一个确认框"}, checkboxColorField], {title: "核心结论", boxColor: "auto"}),
  item("platform-shift-line", PlatformShiftLine, "产品线增长", "蓝色增长数字与产品线节点", "data", "primary", [text("metricLabel", "正文内容"), {key: "count", label: "数值内容", type: "number"}, text("summary", "副文内容"), text("startLabel", "起点内容"), text("endLabel", "终点内容")], {count: 3, metricLabel: "产品线", summary: "展示可编辑的真实组件预设", startLabel: "起点", endLabel: "目标阶段"}),
  item("tradeoff-reject-round", TradeoffRejectRound, "圆形红色否定项", "无边框红色圆叉的风险清单", "story", "primary", [{key: "label", label: "否定项标签", type: "text"}, {key: "bodyText", label: "正文内容", type: "textarea"}, {key: "items", label: "否定项", type: "string-list"}], {label: "风险排除", bodyText: "展示可编辑的真实组件预设", items: ["核心信息", "视觉节奏", "行动结论"]}),
  item("recovery-progress-bars", RecoveryProgressBars, "进度确认条", "进度条与右侧确认标记", "data", "primary", [], {label: "执行进度", bodyText: "展示可编辑的真实组件预设", items: ["需求确认", "能力建设", "结果验证"], progress: 76}),
  item("hud-glow-stack", HudGlowStack, "HUD 浮动发光", "叠放的高亮 HUD 信息卡", "interactive", "primary", [], {subLabel: "LIVE SIGNAL", items: ["核心信号", "关键判断", "下一步动作"]}),
  item("briefing-poster", BriefingPoster, "报纸简报二号", "夹板式科技简报海报", "story", "primary", [prose("bodyText", "正文内容"), list("items", "副文内容", "每项对应一个 checkbox 勾选项")], {label: "简报摘要", bodyText: "展示可编辑的真实组件预设", items: ["核心判断", "产品路径", "下一步行动"]}),
  item("rewind-milestones", RewindMilestones, "时间回溯宽版", "宽幅时间线与回溯节点", "story", "primary", [], {label: "时间回溯", years: ["起点", "探索", "迭代", "现在", "下一步"], milestoneLabel: "能力演进"}),
  item("flying-paper-stack", FlyingPaperStack, "飞入纸卡二号", "三层重叠飞入的简报纸卡", "story", "primary", [], {ghostTitle: "阶段观察", body: "提炼当前拍的核心观点与行动信息。"}),
  item("checklist-editorial", ChecklistEditorial, "编辑清单二号", "留白更强的蓝色方框确认清单", "story", "primary", [], {label: "最终确认", items: ["核心价值", "执行路径", "结果验证"]}),
  item("spotlight-question", FloatingCommentCards, "浮动评论", "互动评论卡", "interactive", "enhancement", [{key: "comments", label: "评论内容", type: "string-list", description: "三项分别对应三个发光互动按钮"}], {comments: ["核心观点", "关键判断", "下一步"]}),
  item("copyopen-hero-title", CopyOpenHeroTitle, "CopyOpen HeroTitle", "CopyOpen 原版逐字弹簧主标题", "typography", "primary", [], {body: "clip factory"}),
  item("copyopen-progress-bar", CopyOpenProgressBar, "CopyOpen ProgressBar", "CopyOpen 原版脉冲进度条", "data", "primary", [], {progress: 76, body: "Highlight extraction"}),
  item("copyopen-comparison-card", CopyOpenComparisonCard, "CopyOpen ComparisonCard", "CopyOpen 原版左右指标对比卡", "data", "primary", [], {leftLabel: "Long video", rightLabel: "Short clips", leftValue: "58 min", rightValue: "8 clips", body: "ready"}),
  item("copyopen-terminal-scene", CopyOpenTerminalScene, "CopyOpen TerminalScene", "CopyOpen 原版终端命令回放", "interactive", "primary", [], {steps: ["openmontage clip input.mp4", "transcribing audio...", "ranking highlight candidates...", "8 clips ready", "remotion render JcMotionCards", "done -> out/shorts"]}),
  item("copyopen-end-tag", CopyOpenEndTag, "CopyOpen EndTag", "CopyOpen 原版结尾闪光标语", "typography", "primary", [], {body: "Make the clip worth watching"}),
  item("copyopen-bar-chart", CopyOpenBarChart, "CopyOpen BarChart", "CopyOpen 原版动画柱状图", "data", "primary", [], {items: ["Hook", "Value", "Pace", "Share"], values: [94, 82, 76, 69]}),
  item("copyopen-line-chart", CopyOpenLineChart, "CopyOpen LineChart", "CopyOpen 原版折线绘制图", "data", "primary", [], {items: ["0", "10", "20", "30"], values: [100, 91, 86, 78]}),
  item("copyopen-pie-chart", CopyOpenPieChart, "CopyOpen PieChart", "CopyOpen 原版环形分布图", "data", "primary", [], {items: ["Hook", "Proof", "Story", "CTA"], values: [35, 30, 20, 15], value: 8, label: "clips"}),
  item("copyopen-kpi-grid", CopyOpenKPIGrid, "CopyOpen KPIGrid", "CopyOpen 原版 KPI 仪表网格", "data", "primary", [], {items: ["clips", "avg score", "minutes saved"], values: [8, 86, 74]}),
  item("speaker-growth-dashboard", SpeakerGrowthDashboard, "口播增长仪表盘", "柱子哥/TzFilm 风格左侧口播增长数据仪表盘", "data", "primary", [], {eyebrow: "LIVE · AI AGENT", subline: "自媒体运营 · 实时演示", headline: "Hermes", skillLabel: "自媒体运营 SKILL", feature1Title: "评论区自动回复", feature1Sub: "AUTO-REPLY", feature2Title: "委婉推荐 · 财务自由团", feature2Sub: "SOFT CTA", metricTitle: "入群率 猛增", metricValue: "165", metricUnit: "生效会员", metricSub: "NEW MEMBERS · 近 30 天", footer: "获客一把好手 · GROWTH ENGINE"}),
  ...jcLayoutDefinitions,
];

export const LAYOUT_BY_KEY = new Map<JasonWuCue["layout"], LayoutDef>(LAYOUT_DEFINITIONS.map((definition) => [definition.key, definition]));
export const isLayoutKey = (value: unknown): value is JasonWuCue["layout"] => typeof value === "string" && LAYOUT_BY_KEY.has(value as JasonWuCue["layout"]);
export const getLayoutDefinition = (layout: JasonWuCue["layout"]): LayoutDef => LAYOUT_BY_KEY.get(layout) ?? LAYOUT_DEFINITIONS[0];
export const LAYOUT_METADATA = LAYOUT_DEFINITIONS.map(({key, editableFields, defaultProps, meta, renderLayer, manifest}) => ({key, editableFields, defaultProps, meta, renderLayer, manifest}));







