"use strict";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const dependentLead = /^(?:如果|因为|虽然|当|在|对于|随着|也|还|并|而|就|才|那|这|它|做这个\s*skill\s*时|我给它加了)/i;
const incompleteTail = /(?:从|到|在|当|与|和|以及|时|被|把|谁|的|地|得|[，、])$/;
const terminalPunctuation = /[。！？!?]$/;

function sourceText(captions) {
  return (captions || []).map((caption) => clean(caption?.zh ?? caption?.text)).filter(Boolean).join("");
}

function clauses(captions) {
  return sourceText(captions).split(/[。！？!?；;，,]/).map(clean).filter((value) => value.length >= 4);
}

function isCompleteVisualCopy(value, {source = ""} = {}) {
  const text = clean(value);
  if (!text || dependentLead.test(text) || incompleteTail.test(text)) return false;
  if (/[，、]$/.test(text)) return false;
  const terminalWord = text.match(/([A-Za-z0-9_-]+)$/)?.[1];
  if (terminalWord && source) {
    const words = source.match(/\b[A-Za-z0-9_-]+\b/g) || [];
    if (words.some((word) => word.length > terminalWord.length && word.toLowerCase().startsWith(terminalWord.toLowerCase()))) return false;
  }
  return true;
}

function contextSpecificCopy(captions) {
  const source = sourceText(captions);
  if (/(?:产品卖给谁|靠什么赚钱)/.test(source)) {
    return {headline: "会前先厘清行业基本盘", effectText: "客户、产品与盈利模式必须明确"};
  }
  if (/(?:Industry Research|行业研究\s*skill|行业研究skill).*(?:已经开源|已开源)|(?:已经开源|已开源).*(?:Industry Research|行业研究\s*skill|行业研究skill)/i.test(source)) {
    return {headline: "行业研究 Skill 已开源", effectText: "陌生行业也能快速建立认知"};
  }
  if (/(?:装好以后).*(?:告诉AI|告诉 AI)|(?:帮我快速了解).*(?:工业软件)/.test(source)) {
    return {headline: "先向 AI 明确研究目标", effectText: "行业范围决定后续研究质量"};
  }
  if (/(?:软件许可).*(?:硬件|实施服务)|(?:硬件|实施服务).*软件许可/.test(source)) {
    return {headline: "收入结构取决于交付模式", effectText: "软件许可与实施服务必须分开看"};
  }
  if (/(?:证据要求|追溯到来源|事实和.*推断.*分开)/.test(source)) {
    return {headline: "研究结论必须可追溯", effectText: "事实与推断必须分开记录"};
  }
  if (/(?:市场规模).*(?:年份|统计范围)|(?:年份|统计范围).*市场规模/.test(source)) {
    return {headline: "统计口径必须说清", effectText: "年份与统计范围决定比较价值"};
  }
  if (/(?:报告正文|报告证文|证据和资料缺口)/.test(source)) {
    return {headline: "报告必须附带证据链", effectText: "证据来源与资料缺口一并呈现"};
  }
  if (/(?:读到原文后做了更正|错误转述的数字)/.test(source)) {
    return {headline: "原始资料可以纠正误读", effectText: "摘要数字必须回到原文核验"};
  }
  if (/(?:默认的快速研究).*(?:深入研究)|(?:具体业务问题).*(?:深入研究)/.test(source)) {
    return {headline: "研究深度应匹配业务问题", effectText: "默认研究适合快速建立认知"};
  }
  if (/(?:准备客户沟通|准备沟通问题)/.test(source)) {
    return {headline: "首次沟通先准备关键问题", effectText: "客户会谈需要明确核验重点"};
  }
  if (/(?:skill已经开源|Skill 已经开源)/i.test(source)) {
    return {headline: "开源工具支持真实调研", effectText: "真实问题可直接验证研究流程"};
  }
  return null;
}

function chooseClause(captions, blocked = "") {
  const normalizedBlocked = clean(blocked).replace(/[，、。！？!?；;\s]/g, "");
  return clauses(captions).find((candidate) => {
    const normalized = candidate.replace(/[，、。！？!?；;\s]/g, "");
    return normalized && normalized !== normalizedBlocked && isCompleteVisualCopy(candidate, {source: sourceText(captions)});
  }) || "";
}

function ensureCompleteVisualCopy({headline, effectZh, effectText}, captions) {
  const source = sourceText(captions);
  const specific = contextSpecificCopy(captions);
  let nextHeadline = clean(headline);
  let nextEffect = clean(effectZh ?? effectText);
  if (specific) return {headline: specific.headline, effectZh: specific.effectText, effectText: specific.effectText};
  if (!isCompleteVisualCopy(nextHeadline, {source})) nextHeadline = chooseClause(captions) || "当前观点需要完整表达";
  if (!isCompleteVisualCopy(nextEffect, {source}) || nextEffect === nextHeadline) nextEffect = chooseClause(captions, nextHeadline) || "请依据完整字幕补充说明";
  return {headline: nextHeadline, effectZh: nextEffect, effectText: nextEffect};
}

module.exports = {clean, sourceText, isCompleteVisualCopy, ensureCompleteVisualCopy};
