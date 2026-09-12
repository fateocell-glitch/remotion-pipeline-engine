import type {ComponentType} from "react";
import {
  DemoAvatarFlip, FloatingCommentCards, KineticTypographyAccent, GrowthTimelineLine, CapitalDashboardNumbers,
  SpecBadgeAndTypewriter, SplitScreenAccent, type LayoutEffectProps,
} from "./DemoEffectComponents";
import {
  BareTypography, BullBear, ChapterCard, CheckProgress, ClipboardNote, ClosingChecklist,
  DesktopFolders, DiagonalChips, DrawLine, FloatingChips, LogoWordmark, NewspaperSwap,
  OpinionHero, OrderedSequence, OrgChart, PhotoWall, ProductExplosion, ProgressDonut,
  RejectList, RouteMap, ScreenRecording, TimeRewind,
} from "./IncompleteEffectComponents";
import {PlatformShiftLine, TradeoffRejectRound, RecoveryProgressBars, HudGlowStack, BriefingPoster, RewindMilestones, FlyingPaperStack, ChecklistEditorial} from "./RecoveredEffectComponents";
import type {JasonWuCue} from "./timeline";

export type EditableField = {key: string; label: string; type: "text" | "number" | "select" | "textarea" | "string-list" | "key-value-list"; placeholder?: string; description?: string; options?: {label: string; value: string}[]};
export type LayoutDef = {
  key: JasonWuCue["layout"];
  component: ComponentType<LayoutEffectProps>;
  editableFields: EditableField[];
  defaultProps: Record<string, unknown>;
  meta: {category: "data" | "typography" | "story" | "interactive"; label: string; description: string};
  renderLayer: "primary" | "enhancement";
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
  "value-verdict": [text("headline", "价值结论"), text("eyebrow", "辅助标签")],
  "capital-dashboard": [text("marketLabel", "第一数字标签"), {key:"marketTo",label:"第一数字",type:"number"}, text("marketSuffix", "第一数字单位"), text("engineeringLabel", "第二数字标签"), {key:"engineeringTo",label:"第二数字",type:"number"}, text("engineeringSuffix", "第二数字单位")],
  "cook-machine": [text("title", "顶端标签"), text("leftLabel", "左侧标签"), text("leftValue", "左侧数值"), text("rightLabel", "右侧标签"), text("rightValue", "右侧数值"), {key:"from",label:"起始比例",type:"number"}, {key:"to",label:"结束比例",type:"number"}],
  "engineering-return": [prose("text", "打字机文本")],
  "market-battlefield": [text("headline", "地图标题"), list("nodes", "路线节点")],
  "finale-kinetic": [text("headline", "冲击大字"), text("eyebrow", "辅助标签")],
  "reject-list": [text("title", "清单标题"), list("items", "否定项", "每项对应一个叉号"), checkboxColorField],
  "check-progress": [text("title", "进度标题"), {key:"progress",label:"完成度",type:"number"}, list("items", "确认项", "每项对应一个确认框"), checkboxColorField],
  "diagonal-chips": [list("items", "Chip 文案", "每项对应一个斜入标签")],
  "floating-chips": [list("items", "浮动 Chip 文案")],
  "bare-typography": [text("headline", "大标题"), text("eyebrow", "辅助标签"), prose("body", "说明文案")],
  "chapter-card": [text("chapterLabel", "章节标签"), text("headline", "章节标题"), prose("body", "章节说明")],
  "logo-wordmark": [text("mark", "标志字母"), text("headline", "标志标题"), text("eyebrow", "辅助标签")],
  "ordered-sequence": [text("categoryTag", "阶段标签"), list("steps", "步骤列表", "步骤按顺序逐一弹出")],
  "org-chart": [text("leader", "核心节点"), text("leaderRole", "核心节点说明"), list("units", "组织单元")],
  "draw-line": [text("headline", "论点标题"), prose("annotation", "画线注释")],
  "progress-donut": [text("label", "进度标签"), {key:"value",label:"完成度",type:"number"}, text("metric", "指标文案"), prose("body", "说明文案")],
  "avatar-handoff": [text("leftName", "交出方"), text("leftRole", "交出方头衔"), text("rightName", "接任方"), text("rightRole", "接任方头衔")],
  "bull-bear": [text("bullLabel", "看多标签"), prose("bullText", "看多观点"), text("bearLabel", "看空标签"), prose("bearText", "看空观点")],
  "opinion-hero": [text("label", "观点标签"), text("headline", "观点大字"), prose("body", "观点说明")],
  "photo-wall": [list("items", "照片墙标签", "每项对应一张信息卡")],
  "product-explosion": [text("headline", "拆解标题"), list("items", "部件标签")],
  "newspaper-swap": [text("oldLabel", "旧标题标签"), prose("oldHeadline", "旧标题"), text("newLabel", "新标题标签"), prose("newHeadline", "新标题"), text("footer", "结论标签")],
  "route-map": [text("headline", "地图标题"), list("nodes", "路线节点")],
  "data-flow": [text("title", "顶端标签"), text("leftLabel", "左侧标签"), text("leftValue", "左侧数值"), text("rightLabel", "右侧标签"), text("rightValue", "右侧数值"), {key:"from",label:"起始比例",type:"number"}, {key:"to",label:"结束比例",type:"number"}],
  "screen-recording": [text("headline", "窗口标题"), list("items", "窗口数据卡")],
  "zoom-statement": [text("headline", "推拉大字"), text("eyebrow", "辅助标签")],
  "desktop-folders": [list("items", "文件夹名称")],
  "time-rewind": [text("headline", "回溯标题"), list("years", "时间节点")],
  "clipboard-note": [text("label", "便签标签"), text("headline", "便签标题"), prose("body", "便签内容"), checkboxColorField],
  "closing-checklist": [text("title", "清单标题（与核心大标题同步）"), list("items", "清单内容", "每项对应一个确认框"), checkboxColorField],
  "platform-shift-line": [text("metricLabel", "增长指标标签"), {key: "count", label: "增长数量", type: "number"}, prose("summary", "增长说明"), list("milestones", "产品线节点"), text("startLabel", "起点标签"), text("endLabel", "终点标签")],
  "tradeoff-reject-round": [text("label", "否定项标签"), text("title", "否定项标题"), list("items", "圆形否定项", "每项对应一个红色圆形叉号")],
  "recovery-progress-bars": [text("label", "进度标签"), text("title", "进度标题"), list("items", "进度项目"), {key: "values", label: "进度数值（%）", type: "string-list", description: "按项目顺序填写 0-100 的百分比"}],
  "hud-glow-stack": [text("subLabel", "卡片辅助标签"), list("items", "HUD 卡片内容")],
  "briefing-poster": [text("label", "简报标签"), text("title", "简报标题"), list("items", "简报要点")],
  "rewind-milestones": [text("label", "回溯标签"), text("title", "回溯标题"), list("years", "年份节点"), text("milestoneLabel", "节点说明")],
  "flying-paper-stack": [text("headline", "主卡标题"), text("ghostTitle", "背景卡标题"), prose("body", "卡片正文")],
  "checklist-editorial": [text("label", "清单标签"), text("title", "清单标题"), list("items", "清单内容", "每项对应一个方形确认框")],
  "spotlight-question": [list("comments", "评论内容")],
};
const mergeFields = (key: JasonWuCue["layout"], editableFields: EditableField[]) => {
  const merged = [...(CONTROLLED_FIELDS[key] ?? []), ...editableFields];
  return merged.filter((field, index) => merged.findIndex((candidate) => candidate.key === field.key) === index);
};
const item = (key: JasonWuCue["layout"], component: ComponentType<LayoutEffectProps>, label: string, description: string, category: LayoutDef["meta"]["category"], renderLayer: LayoutDef["renderLayer"] = "primary", editableFields: EditableField[] = copy, defaultProps: Record<string, unknown> = {}): LayoutDef => ({key, component, editableFields: mergeFields(key, editableFields), defaultProps, meta: {category, label, description}, renderLayer});

export const LAYOUT_DEFINITIONS: LayoutDef[] = [
  item("person-rank", DemoAvatarFlip, "人物交接", "双人物交接与权力转换", "story", "primary", [{key: "leftName", label: "左侧人物", type: "text"}, {key: "rightName", label: "右侧人物", type: "text"}], {leftName: "人物 A", rightName: "人物 B"}),
  item("event-timeline", GrowthTimelineLine, "增长时间轴", "横向节点线与光点推进", "data", "enhancement", [list("years", "时间节点")], {years: ["起步", "迭代", "规模化", "目标"]}),
  item("pivot-list", SpecBadgeAndTypewriter, "规格打字机", "绿色终端逐字出现", "interactive", "enhancement", [{key: "text", label: "打字机文本", type: "textarea"}], {}),
  item("value-verdict", KineticTypographyAccent, "价值判断", "数字结论与冲击式观点", "data", "primary"),
  item("capital-dashboard", CapitalDashboardNumbers, "资本仪表盘", "双数字卡滚动增长", "data", "primary", [text("marketLabel", "第一数字标签"), {key: "marketTo", label: "第一数字", type: "number"}, text("marketSuffix", "第一数字单位"), text("engineeringLabel", "第二数字标签"), {key: "engineeringTo", label: "第二数字", type: "number"}, text("engineeringSuffix", "第二数字单位")], {marketLabel: "市场规模", marketTo: 4600, marketSuffix: "亿", engineeringLabel: "增长率", engineeringTo: 25, engineeringSuffix: "%"}),
  item("cook-machine", SplitScreenAccent, "经营机器", "运营效率和利润对照", "story", "primary", copy, {leftLabel: "PROFIT", rightLabel: "SHIPMENT", from: 20, to: 85}),
  item("engineering-return", SpecBadgeAndTypewriter, "工程回归", "工程规格与打字机参数", "story", "primary", copy, {text: "关键路径 / 核心动作 / 下一步"}),
  item("market-battlefield", RouteMap, "市场对垒", "供应链路线和区域节点", "data"),
  item("finale-kinetic", KineticTypographyAccent, "结尾冲击", "结论型大字节奏", "typography", "primary"),
  item("reject-list", RejectList, "错误清单", "叉号否定与纠错列表", "story", "primary", [checkboxColorField], {boxColor: "auto"}),
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
  item("bull-bear", BullBear, "多空对比", "左右观点与中线对照", "data", "primary", [{key: "bullLabel", label: "看多标签", type: "text"}, {key: "bullText", label: "看多观点", type: "textarea"}, {key: "bearLabel", label: "看空标签", type: "text"}, {key: "bearText", label: "看空观点", type: "textarea"}], {}),
  item("opinion-hero", OpinionHero, "观点主视觉", "重点观点大字强调", "typography"),
  item("photo-wall", PhotoWall, "照片墙", "多层产品图片卡片组合", "story", "primary", [{key: "items", label: "照片墙标签", type: "string-list", description: "每项对应一张信息卡"}], {}),
  item("product-explosion", ProductExplosion, "产品爆炸图", "产品部件拆解展示", "data"),
  item("newspaper-swap", NewspaperSwap, "报纸标题", "旧标题与新标题切换", "story"),
  item("route-map", RouteMap, "二维地图", "路线和区域说明", "data"),
  item("data-flow", SplitScreenAccent, "数据分屏", "软件硬件分屏数据对照", "data", "enhancement", [{key: "leftLabel", label: "左侧标签", type: "text"}, {key: "leftValue", label: "左侧数值", type: "text"}, {key: "rightLabel", label: "右侧标签", type: "text"}, {key: "rightValue", label: "右侧数值", type: "text"}, {key: "from", label: "起始比例", type: "number"}, {key: "to", label: "结束比例", type: "number"}], {}),
  item("screen-recording", ScreenRecording, "屏幕录制框", "产品界面与操作窗口", "interactive"),
  item("zoom-statement", KineticTypographyAccent, "镜头推拉大字", "镜头推拉与大字冲击", "typography", "enhancement"),
  item("desktop-folders", DesktopFolders, "桌面文件夹", "桌面文件与内容整理", "interactive"),
  item("time-rewind", TimeRewind, "时间回溯", "逆向时间线叙事", "story"),
  item("clipboard-note", ClipboardNote, "剪贴板批注", "便签与批注信息", "interactive", "primary", [checkboxColorField], {boxColor: "auto"}),
  item("closing-checklist", ClosingChecklist, "结尾清单", "结论项目逐项确认", "story", "primary", [{key: "title", label: "清单标题（与核心大标题同步）", type: "text"}, {key: "items", label: "清单内容", type: "string-list", description: "每项对应一个确认框"}, checkboxColorField], {title: "核心结论", boxColor: "auto"}),
  item("platform-shift-line", PlatformShiftLine, "产品线增长", "蓝色增长数字与产品线节点", "data", "primary", [], {count: 3, metricLabel: "产品线", milestones: ["基础能力", "产品扩展", "规模增长"], startLabel: "起点", endLabel: "目标阶段"}),
  item("tradeoff-reject-round", TradeoffRejectRound, "圆形红色否定项", "无边框红色圆叉的风险清单", "story", "primary", [], {label: "风险排除", items: ["无效投入", "重复流程", "低效路径"]}),
  item("recovery-progress-bars", RecoveryProgressBars, "进度确认条", "进度条与右侧确认标记", "data", "primary", [], {label: "执行进度", items: ["需求确认", "能力建设", "结果验证"], values: [68, 54, 42]}),
  item("hud-glow-stack", HudGlowStack, "HUD 浮动发光", "叠放的高亮 HUD 信息卡", "interactive", "primary", [], {subLabel: "LIVE SIGNAL", items: ["核心信号", "关键判断", "下一步动作"]}),
  item("briefing-poster", BriefingPoster, "报纸简报二号", "夹板式科技简报海报", "story", "primary", [], {label: "简报摘要", items: ["核心判断", "产品路径", "下一步行动"]}),
  item("rewind-milestones", RewindMilestones, "时间回溯宽版", "宽幅时间线与回溯节点", "story", "primary", [], {label: "时间回溯", years: ["过去", "现在", "下一阶段"], milestoneLabel: "能力演进"}),
  item("flying-paper-stack", FlyingPaperStack, "飞入纸卡二号", "三层重叠飞入的简报纸卡", "story", "primary", [], {ghostTitle: "阶段观察", body: "提炼当前拍的核心观点与行动信息。"}),
  item("checklist-editorial", ChecklistEditorial, "编辑清单二号", "留白更强的蓝色方框确认清单", "story", "primary", [], {label: "最终确认", items: ["核心价值", "执行路径", "结果验证"]}),
  item("spotlight-question", FloatingCommentCards, "浮动评论", "互动评论卡", "interactive", "enhancement", [{key: "comments", label: "评论内容", type: "text"}], {comments: ["核心观点", "关键判断", "下一步"]}),
];

export const LAYOUT_BY_KEY = new Map<JasonWuCue["layout"], LayoutDef>(LAYOUT_DEFINITIONS.map((definition) => [definition.key, definition]));
export const isLayoutKey = (value: unknown): value is JasonWuCue["layout"] => typeof value === "string" && LAYOUT_BY_KEY.has(value as JasonWuCue["layout"]);
export const getLayoutDefinition = (layout: JasonWuCue["layout"]): LayoutDef => LAYOUT_BY_KEY.get(layout) ?? LAYOUT_DEFINITIONS[0];
export const LAYOUT_METADATA = LAYOUT_DEFINITIONS.map(({key, editableFields, defaultProps, meta, renderLayer}) => ({key, editableFields, defaultProps, meta, renderLayer}));
