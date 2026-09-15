// 设计系统唯一真源 —— 所有包装组件只允许从这里取值。
// 规则见 .claude/skills/remotion-design-system/SKILL.md
// 基准分辨率 1920x1080；4K 导出时整体 scale ×2，不单独改字号。

export const COLOR = {
  // 四色语义（唯一允许的强调色）
  blue: '#4D9EFF', // 定义 / 方法 / 中性推进
  green: '#3DDC84', // 正面 / 低门槛 / 已生效
  yellow: '#FFC53D', // 机会 / 警示 / 争议 / 转折
  red: '#FF4D4D', // 负面 / 陷阱 / 危机
  // 基础
  white: '#FFFFFF',
  grey: '#B7BDC6', // 次要文字
  greyDim: '#7A8089', // 更弱的说明文字
  cardBg: 'rgba(12,14,18,0.78)',
  cardStroke: 'rgba(255,255,255,0.10)',
} as const;

export type SemanticColor = 'blue' | 'green' | 'yellow' | 'red';

// 表面变体：白板/亮背景场景用 light（避免深色卡压白板成贴纸），深色场景用 darkPlate。
export const SURFACE = {
  light: {
    bg: 'rgba(255,255,255,0.92)',
    fg: '#1A1D24',
    stroke: 'rgba(0,0,0,0.12)',
    shadow: '0 6px 20px rgba(0,0,0,0.18)',
  },
  darkPlate: 'rgba(10,10,12,0.72)',
} as const;

export type SurfaceVariant = 'dark' | 'light';

export const FONT = {
  zh: '"Noto Sans SC"', // 思源黑体
  en: '"Inter"', // 英文 kicker / 正文 / 数字
  enTitle: '"Archivo Black"', // 英文标题与大字结论（CRUSHED / 人名），窄方超黑，weight 一律 400
  // 底部字幕专用字族（2026-07-26 裁定，唯一例外）：字幕是跟读层不是包装层，用 PingFang SC
  // Regular 取苹果字幕的细体气质；MG 包装层仍一律 FONT.zh。PingFang 为 macOS 系统字体，
  // 不走 @fontsource 打包 —— Windows/Linux 渲染时回退到打包的 Noto Sans SC 400（fonts.ts
  // 已引入 400 细档，近似但非同款；跨机器交付前先渲一帧确认字幕观感）。
  subZh: '"PingFang SC", "Noto Sans SC"',
  subEn: '"Inter"', // 字幕英文行必须用比例西文字体：用中文字体渲英文，字宽字距全错
  zhHeavy: 900,
  zhMedium: 500,
  enBold: 700,
  subZhWeight: 400,
  subEnWeight: 300,
} as const;

// 大字结论用的语义色渐变（上浅下深），CRUSHED 级别标题 / 印章用
export const GRADIENT: Record<SemanticColor, [string, string]> = {
  blue: ['#6FB4FF', '#2F7FE0'],
  green: ['#5CE89A', '#1FA85D'],
  yellow: ['#FFD666', '#E8A81E'],
  red: ['#FF6B6B', '#E22D2D'],
};

// 字号阶梯（1080p）。禁止使用阶梯外字号。
export const SIZE = {
  kicker: 22, // 英文 kicker / 侧标英文
  subSmall: 20, // 侧标第二行等最小说明字
  chip: 30, // ⚠ 已废弃（2026-07-25）：30 落 typography §7.7 空档带 26-31。存量片沿用，新片改用下方 T 档
  // ---- T 档字阶（2026-07-25 基准片八维实测，typography §7.7 唯一真源）----
  // 五档 + 空档带：T1 106-138 / [91-105 禁] / T2 51-71 / [43-50 禁] / T3 32-42 / [26-31 禁] / T4 17-25 / [13-16 禁] / T5 10-12
  // 现有 token 归档：h1=108→T1｜h2=64 & subZh=52→T2｜card=40→T3｜kicker=22 & subSmall=20→T4｜mega=180 独立冲击档
  navTitle: 52, // 章节侧标 title 变体的中文大标（导航层）。2026-07-27 新增：旧值 SIZE.kicker*2=44
  // 落 typography §7.7 的 43-50 禁用空档带；52 落 T2 档 51-71 内，与 kicker 22 成 2.36:1。
  // 独立成 token 而非复用 subZh（同为 52）——subZh 是底部字幕跟读层专用，两者语义无关，
  // 合用会让「调字幕字号」连带动侧标（impl-S08 提出）。
  t3: 32, // 清单条目 / 小标题（取代 chip 30）
  t4Lg: 25, // 贴行 / 徽章标签 / 次级 chip（T4 上沿）
  t4Sm: 17, // 条目级 EN 小标（T4 下沿，取代 16）
  subZh: 52, // 底部字幕中文（2026-07-16 裁决：对齐基准片 ≈53px、屏高 4.9%）
  subEn: 28, // 底部字幕英文（与中文行比例对齐基准片）
  card: 40, // 卡片标题
  h2: 64, // 段落 hero
  h1: 108, // 章节 hero / 大数字（2026-07-16 裁决：88→108，对齐基准片单字 100-110px）
  mega: 180, // 全屏冲击数字
} as const;

export const GRID = 8;
export const RADIUS = { chip: 12, card: 20, phone: 56 } as const;

export const SAFE = {
  sideLabel: { x: 72, y: 88 }, // 章节侧标锚点（竖线左缘 / kicker 基线区顶）
  stackX: 72, // 左侧信息卡堆栈左缘
  subtitleBottom: 30, // 字幕距底（2026-07-16 规格表：基准片英文箱底距画底 26-30px，旧值 84 偏高约 50px）
  faceZoneXPct: 0.55, // x > 55% 不放常驻卡
  subtitleZoneYPct: 0.82, // y > 82% 不放卡片
} as const;

export const MOTION = {
  // 合成是 30fps（勿按 60fps 写帧数——2026-07-16 校准：旧值 18/14 是 60fps 口径，
  // 在 30fps 下所有入场慢一倍、stagger 拖 0.47s，是「PPT 感」的系统性来源）。
  popInFrames: 9, // 入场时长（30fps ≈ 0.3s）
  popInShift: 40, // 入场位移 px（明显的滑入感）
  stagger: 7, // 先后入场的默认间隔帧数（≈0.23s）
  dimOpacity: 0.35, // 旧信息常驻透明度
} as const;
