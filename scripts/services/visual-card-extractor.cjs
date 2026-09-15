"use strict";

const {normalizeSimplifiedChinese}=require("./text-analysis.cjs");
const compact=(value)=>normalizeSimplifiedChinese(value).replace(/[，,。！？；、\s]/g,"");
const length=(value)=>Array.from(compact(value)).length;
const overlap=(left,right)=>{const a=compact(left),b=compact(right);if(!a||!b)return 0;if(a.includes(b)||b.includes(a))return Math.min(a.length,b.length)/Math.max(a.length,b.length);let longest=0;for(let start=0;start<a.length;start+=1){for(let end=start+1;end<=a.length;end+=1){const candidate=a.slice(start,end);if(candidate.length<=longest||!b.includes(candidate))continue;longest=candidate.length;}}return longest/Math.max(1,Math.min(a.length,b.length));};
const sourceText=(captions)=>captions.map((caption)=>String(caption?.zh||"")).join("。");
const RULES=[
  [/(?:每天每周都会|周都会做|需求不性感但很稳定).*(?:第一次决策|一大笔钱)/,{headline:"稳定需求降低试用门槛",effectZh:"先降低试用成本再建立信任",bodyText:"稳定需求更适合先降低首次试用门槛，让客户在小成本体验后逐步建立长期信任。",steps:["识别稳定需求","降低试用成本","建立长期信任"]}],
  [/(?:第一次决策.*(?:成本|太重)|降低第一次决策)/,{headline:"低价入口降低首次阻力",effectZh:"先让客户轻松试用再逐步建立信任",bodyText:"第一次购买的心理门槛越低，客户越愿意尝试，后续交易才有机会发生。",steps:["降低首次门槛","促成低价试用","建立持续信任"]}],
  [/(?:找高(?:频|品)需求|高(?:频|品)需求.*(?:最贵|每天每周|稳定))/,{headline:"高频需求胜过高价单品",effectZh:"稳定日常需求更值得长期经营",bodyText:"真正可持续的生意，不只看单次价格，而是找到每天反复发生、能沉淀复购的稳定需求。",steps:["识别高频场景","降低使用门槛","沉淀长期复购"]}],
  [/(?:方便一点|耐用一点|漂亮一点|大市场.*小改进)/,{headline:"微小改进撬动大市场",effectZh:"成熟需求也能靠细节升级放大",bodyText:"不必发明全新品类，只要在成熟需求上持续优化体验，小改进也会被大市场不断放大。",steps:["锁定成熟需求","优化使用细节","放大市场规模"]}],
  [/(?:脚边|懒得弯腰|所有人都懒得多看一眼)/,{headline:"脚边机会常被低估",effectZh:"不起眼的小需求也能孕育大生意",bodyText:"真正的机会未必藏在风口里，那些被忽视的日常小需求同样值得长期打磨。",steps:["观察被忽视需求","找到重复场景","长期打磨体验"]}],
  [/(?:每天重复.*(?:百万|千万)|小交易.*重复|堆出.*(?:惊人|巨大).*生意)/,{headline:"高频小额聚成大生意",effectZh:"海量小交易会持续累积商业规模",bodyText:"单次消费看似微小，重复数百万次后，规模就会把小额需求堆成大生意。",steps:["锁定高频需求","放大交易次数","累积商业规模"]}],
  [/(?:竞争.*白热化|差异化.*抹平)/,{headline:"红海竞争倒逼品牌升级",effectZh:"同质化加剧迫使品牌持续升级",bodyText:"当产品差异被快速抹平，品牌必须通过体验、效率和定位重建用户选择理由。",steps:["识别同质竞争","重塑差异体验","持续迭代升级"]}],
  [/(?:便宜到|懒得比较|顺手多拿|口香糖.*纸巾)/,{headline:"超低客单绕过理性比价",effectZh:"价格低到让购买变成顺手决定",bodyText:"低价商品不靠复杂说服，而是用极低决策成本激发大量即兴购买。",steps:["压低客单价格","绕过理性比价","放大顺手购买"]}],
  [/(?:真正赚的不是单价|一天卖一百.*万|高频.*购买|固定成本.*摊薄)/,{headline:"高频成交摊薄固定成本",effectZh:"薄利必须依靠高频购买形成利润",bodyText:"单件利润再薄，只要交易频次和规模足够高，固定成本就会被持续摊薄。",steps:["提高购买频次","扩大成交规模","摊薄固定成本"]}],
  [/(?:采购价格|物流成本|设备效率|一亿件|单位成本)/,{headline:"规模效应压低单位成本",effectZh:"产量越大采购物流越有成本优势",bodyText:"规模不是单纯多卖，而是让采购、物流和设备效率同时拉开成本差距。",steps:["扩大生产数量","优化采购物流","拉开成本差距"]}],
  [/(?:购买阻力|五万元.*电脑|低价入口|第一次决策太重)/,{headline:"低价入口降低首次阻力",effectZh:"先让客户轻松试用再逐步建立信任",bodyText:"第一次购买的心理门槛越低，客户越愿意尝试，后续交易才有机会发生。",steps:["降低首次门槛","促成低价试用","建立持续信任"]}],
  [/(?:纸巾|牙膏|垃圾袋|洗衣精|高频消耗|半自动)/,{headline:"高频消耗锁定长期复购",effectZh:"习惯形成后购买会逐渐半自动化",bodyText:"日常消耗品不靠一次性爆发，而是把重复需求沉淀成几乎不用思考的复购。",steps:["命中日常需求","形成使用习惯","锁定重复购买"]}],
  [/(?:一次100元|不是便宜.*频率|一直回来)/,{headline:"小额高频才是利润引擎",effectZh:"单次金额不大重复购买才能放大收入",bodyText:"小额消费的价值不在单笔利润，而在客户愿意长期回来，把频次累积成收入。",steps:["控制单次金额","提高回购频率","累积长期收入"]}],
  [/(?:四分钱|一分钱|0[.。]96元|微小.*成本)/,{headline:"微小优化放大规模利润",effectZh:"每省一分钱都能在亿级产量中放大",bodyText:"规模生意的利润常藏在微小改进里，单件差异乘以海量产量就是巨大优势。",steps:["拆解单位成本","持续微小优化","乘上规模产量"]}],
  [/(?:良率|报废率|机器多跑|少一道工序|供应链)/,{headline:"无聊细节筑起成本壁垒",effectZh:"供应链效率决定同质品长期差距",bodyText:"真正难复制的竞争力来自流程、良率和损耗控制，而不是一项显眼的卖点。",steps:["减少流程损耗","提高设备良率","沉淀供应链优势"]}],
  [/(?:追AI|垃圾袋|袜子|衣架|嫌麻烦|愿意蹲下来)/,{headline:"冷门需求藏着长期机会",effectZh:"多数人嫌麻烦的市场更容易沉淀优势",bodyText:"热门赛道吸走注意力后，那些不起眼却稳定的需求反而留给愿意长期深耕的人。",steps:["避开热门噪音","找到稳定需求","长期深耕品类"]}],
  [/(?:十年.*规格|材料最稳|回购最高|追不上)/,{headline:"长期深耕形成追赶壁垒",effectZh:"多年细节迭代会拉开竞争距离",bodyText:"同一品类里的长期打磨会不断积累产品、客户和渠道优势，后来者很难快速追上。",steps:["持续研究细节","积累复购数据","拉开长期差距"]}],
  [/(?:所有人天天|小需求|风口|脚边)/,{headline:"日常小需求撑起大市场",effectZh:"被忽视的高频动作最能聚合规模",bodyText:"财富不只藏在风口里，真正稳定的市场往往来自每天重复发生、却没人炫耀的小需求。",steps:["观察日常动作","识别高频需求","持续优化体验"]}],
];
const PLACEHOLDER_COPY = new Set([
  "把局部优势做成增长结构",
  "用更低阻力推动持续成交",
  "真正有效的增长，不是复述现象，而是把局部优势沉淀成可以持续复制的交易结构。",
  "识别关键机制",
  "降低行动阻力",
  "持续放大优势",
]);

function isPlaceholderCopy(value) {
  return PLACEHOLDER_COPY.has(String(value || "").trim());
}

function sourceClauses(captions) {
  return sourceText(captions)
    .split(/[。！？；，,]/)
    .map((value) => String(value || "").trim())
    .filter((value) => value && !isPlaceholderCopy(value));
}

function completeLocalValue(value, minimum, maximum) {
  return length(value) >= minimum && length(value) <= maximum && !/^(?:当|如果|因为|所以|但是|而且|然后|这|那|它)/.test(String(value || "").trim()) && !/[，,、]$/.test(String(value || "").trim());
}

const LOCAL_SEMANTIC_RULES = [
  [/(?:预订).*(?:排队|早高峰)|(?:排队|早高峰).*(?:预订)/, {headline:"预订分流缩短排队", effectZh:"提前备货降低早高峰压力"}],
  [/(?:规模效应).*(?:摊薄|固定成本)|(?:摊薄).*(?:固定成本)/, {headline:"规模效应摊薄固定成本", effectZh:"产量提升持续拉低单位成本"}],
  [/(?:小额高频).*(?:利润|引擎)|(?:重复购买).*(?:利润|收入)/, {headline:"小额高频才是利润引擎", effectZh:"重复购买持续放大长期收入"}],
  [/(?:长期深耕|多年改良).*(?:壁垒|差距)|(?:细节).*(?:竞争壁垒)/, {headline:"长期深耕筑起竞争壁垒", effectZh:"细节积累拉开长期差距"}],
];

function semanticLocalCopy(captions) {
  const text = sourceText(captions);
  const match = LOCAL_SEMANTIC_RULES.find(([pattern]) => pattern.test(text));
  return match ? match[1] : null;
}

function localSourceCard(captions, fallback = {}) {
  const clauses = sourceClauses(captions);
  const source = sourceText(captions);
  const semantic = semanticLocalCopy(captions);
  const fallbackHeadline = String(fallback.headline || "").trim();
  const fallbackEffect = String(fallback.effectZh || fallback.effectText || "").trim();
  const fallbackBody = String(fallback.bodyText || "").trim();
  const headline = semantic?.headline || (completeLocalValue(fallbackHeadline, 4, 15)
    ? fallbackHeadline
    : clauses.find((value) => completeLocalValue(value, 4, 15)));
  const effectZh = semantic?.effectZh || (completeLocalValue(fallbackEffect, 6, 24) && compact(fallbackEffect) !== compact(headline)
    ? fallbackEffect
    : clauses.find((value) => completeLocalValue(value, 6, 24) && compact(value) !== compact(headline)) || clauses[0]);
  const bodyText = !isPlaceholderCopy(fallbackBody) && completeLocalValue(fallbackBody, 12, 120)
    ? fallbackBody
    : clauses.find((value) => completeLocalValue(value, 12, 120) && compact(value) !== compact(headline) && compact(value) !== compact(effectZh)) || source;
  const steps = clauses
    .filter((value) => completeLocalValue(value, 3, 36))
    .filter((value) => !isPlaceholderCopy(value))
    .slice(0, 4);
  if (!headline || !effectZh || !bodyText) {
    throw new Error("VisualCardExtractionError: local captions cannot produce a complete source-backed card");
  }
  return {headline, effectZh, bodyText, steps};
}
function extractVisualCard(captions, fallback = {}) {
  const text = sourceText(captions);
  const match = RULES.find(([pattern]) => pattern.test(text));
  const card = match ? match[1] : localSourceCard(captions, fallback);
  const headline = String(card.headline || "").trim();
  const effectZh = String(card.effectZh || "").trim();
  const bodyText = String(card.bodyText || "").trim();
  const steps = Array.isArray(card.steps)
    ? card.steps.map((value) => String(value || "").trim()).filter((value) => value && !isPlaceholderCopy(value))
    : [];
  if (!completeLocalValue(headline, 4, 15) || !completeLocalValue(effectZh, 6, 24) || !bodyText) {
    throw new Error("VisualCardExtractionError: incomplete visual card output");
  }
  return {headline, effectZh, bodyText, steps};
}

module.exports={extractVisualCard,overlap,compact,length};
