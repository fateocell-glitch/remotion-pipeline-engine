"use strict";

const COMMERCIAL_TEXT_ROLES = ["hook", "chain", "metric", "risk", "verdict"];

const ROLE_LAYOUTS = {
  hook: ["opinion-hero", "briefing-poster", "zoom-statement", "bare-typography", "logo-wordmark", "spotlight-question", "photo-wall", "flying-paper-stack", "chapter-card", "copyopen-hero-title"],
  chain: ["hud-glow-stack", "route-map", "cook-machine", "ordered-sequence", "diagonal-chips", "floating-chips", "event-timeline", "rewind-milestones", "time-rewind", "org-chart", "draw-line", "desktop-folders", "screen-recording", "person-rank", "copyopen-terminal-scene"],
  metric: ["capital-dashboard", "progress-donut", "recovery-progress-bars", "platform-shift-line", "check-progress", "copyopen-progress-bar", "copyopen-comparison-card", "copyopen-bar-chart", "copyopen-line-chart", "copyopen-pie-chart", "copyopen-kpi-grid"],
  risk: ["bull-bear", "market-battlefield", "tradeoff-reject-round", "reject-list", "spotlight-question", "copyopen-comparison-card"],
  verdict: ["value-verdict", "closing-checklist", "clipboard-note", "pivot-list", "checklist-editorial", "chapter-card", "flying-paper-stack", "photo-wall", "bare-typography", "copyopen-end-tag"],
};

const normalizeCommercialTextRole = (value) => COMMERCIAL_TEXT_ROLES.includes(String(value || "").trim()) ? String(value).trim() : "";
const sourceText = ({text = "", captions = []} = {}) => [text, ...(captions || []).map((caption) => caption?.zh || caption?.en || "")].join(" ").replace(/\s+/g, " ").trim();

function inferCommercialTextRole({text = "", captions = [], layerIndex = 0, layerCount = 1} = {}) {
  const source = sourceText({text, captions});
  const isCommercialDualLayer = Number(layerCount) >= 2;
  const isPrimaryLayer = Number(layerIndex) === 0;
  const isChain = /(?:先|再|最后|通过|链路|流程|路径|采购|复购|角色|从.+到)/.test(source);
  const isRisk = /(?:风险|隐患|代价|反噬|失控|库存|现金流|看空|挑战|失败|不能|不该|但是|不过)/.test(source);
  const isMetric = /(?:\d+(?:\.\d+)?(?:%|％|万|亿|元|倍|年|件)|每件|每天|每周|高频|交易次数|重复购买|规模|产量|单位成本|采购|物流|营收|利润|增长率|百分比)/.test(source);
  const isVerdict = /(?:最终判断|结论|判断好生意|衡量基准|好生意|只看)/.test(source);

  // A commercial dual layer is a fixed argument: judgment/chain first, then evidence/risk/verdict.
  if (isCommercialDualLayer && isPrimaryLayer) return isChain ? "chain" : "hook";
  if (isCommercialDualLayer) {
    if (isVerdict) return "verdict";
    if (isRisk) return "risk";
    if (isMetric) return "metric";
    return "verdict";
  }

  if (isVerdict) return "verdict";
  if (isRisk) return "risk";
  if (isMetric) return "metric";
  if (isChain) return "chain";
  if (Number(layerIndex) > 0 && /(?:所以|因此|意味着|本质|结论|最终|关键在于|要看)/.test(source)) return "verdict";
  if (Number(layerCount) > 1 && Number(layerIndex) > 0) return "verdict";
  return "hook";
}

const SEMANTIC_ACCENTS = ["blue", "green", "yellow", "red"];
const strongRedWords = /(?:亏损|亏|风险|陷阱|失控|失败|阻力|库存|现金流|踩坑|代价|下滑|下降)/;
const strongGreenWords = /(?:增长|复购|利润|收益|转化率|提升|生效|盈利|规模化|回报)/;
const softYellowWords = /(?:反直觉|机会|痛点|问题|为什么|但是|不过|转折|低价|便宜)/;

function inferSemanticAccent({role = "", text = ""} = {}) {
  const source = String(text || "");
  if (role === "risk" || strongRedWords.test(source)) return "red";
  if (role === "metric" && (strongGreenWords.test(source) || /\d+(?:\.\d+)?%/.test(source))) return "green";
  if (role === "hook" && softYellowWords.test(source)) return "yellow";
  if (role === "chain") return "blue";
  if (role === "metric") return "green";
  if (role === "hook") return "yellow";
  if (role === "verdict") return strongGreenWords.test(source) ? "green" : "blue";
  return "blue";
}

function assignSemanticAccent({role = "", text = "", previousAccent = ""} = {}) {
  const accent = inferSemanticAccent({role, text});
  if (SEMANTIC_ACCENTS.includes(previousAccent) && accent === previousAccent && !strongRedWords.test(text) && !strongGreenWords.test(text)) {
    if (accent === "blue") return "yellow";
    if (accent === "yellow") return "blue";
  }
  return accent;
}
function textRolesForLayout(layout) {
  const explicit = COMMERCIAL_TEXT_ROLES.filter((role) => ROLE_LAYOUTS[role].includes(layout));
  if (explicit.length) return explicit;
  const id = String(layout || "");
  if (id.startsWith("jc-metrics-")) return ["metric"];
  if (id.startsWith("jc-process-") || id.startsWith("jc-system-")) return ["chain"];
  if (id.startsWith("jc-contrast-")) return ["risk", "verdict"];
  if (id.startsWith("jc-narrative-")) return ["hook", "verdict"];
  return [];
}

module.exports = {COMMERCIAL_TEXT_ROLES, ROLE_LAYOUTS, SEMANTIC_ACCENTS, inferCommercialTextRole, inferSemanticAccent, assignSemanticAccent, normalizeCommercialTextRole, textRolesForLayout};


