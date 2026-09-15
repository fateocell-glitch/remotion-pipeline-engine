// 字体一律走本地 npm 包（@fontsource，woff2 打进 bundle），禁止运行时从
// Google Fonts 拉取 —— 国内网络拉不到中文分包，会静默退化成宋体。
// 见 remotion-design-system skill 错题集 #01。
import '@fontsource/noto-sans-sc/400.css'; // 底部字幕中文行的非 macOS 兜底（PingFang SC 缺席时按 400 细档渲染，见 tokens.ts subZh）
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/noto-sans-sc/900.css';
import '@fontsource/inter/300.css'; // 底部字幕英文行（FONT.subEn）
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/archivo-black'; // 英文标题/大字专用（基准片同款窄方超黑 grotesque），weight 400 即 Black
