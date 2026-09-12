"use strict";

const OpenCC = require("opencc-js");
const {compactEffectCopy, conciseEffectCopy} = require("./effect-copy.cjs");

const toSimplified = OpenCC.Converter({from: "t", to: "cn"});
const fillerPattern = /^(?:主持人[：:]?|大家好[，,。]?|各位朋友[，,。]?|你看|看见没有|是不是|是吧|知道吧|然后|那|其实|就是|这个|我们来|接下来)/;

function normalizeSimplifiedChinese(value) {
  return toSimplified(String(value ?? "")).replace(/\s+/g, " ").trim();
}

function meaningfulSentences(captions) {
  return (captions ?? [])
    .map((caption) => normalizeSimplifiedChinese(caption?.zh))
    .flatMap((text) => text.split(/[。！？；\n]+/))
    .map((text) => text.replace(fillerPattern, "").replace(/^[，,、\s]+/, "").trim())
    .filter((text) => text.replace(/[，,、\s]/g, "").length >= 4);
}

function isTitleQuality(title) {
  const value = compactEffectCopy(title);
  return value.length >= 8 && value.length <= 14 && !/^(也能|有时候|她|他|这|那|火到|就|然后)/.test(value) && !/[，,。！？；]$/.test(value);
}

const legacyGenericCopy = new Set(["从素材到成片的操作路径", "关键路线出现转折", "核心体验进入实测", "这一拍的核心判断", "工具组合解决核心问题", "折叠设备进入实测", "多任务体验决定实用性"]);

function localClauses(text) {
  return normalizeSimplifiedChinese(text).split(/[。！？；，,]/).map((item) => item.replace(fillerPattern, "").replace(/^(?:但是说实话|首先第一个就是|首先|对于|苹果对于)/, "").trim()).filter((item) => item.length >= 4);
}

function localHeadlineFor(text) {
  const source = normalizeSimplifiedChinese(text);
  const rules = [
    [/(?:钛金属|太金属).*(?:基板|板)/, "钛金属基板"],
    [/(?:iPhone\s*Duo)/i, "iPhone Duo 细节"],
    [/(?:四个|四).{0,3}边角/, "四角平整支撑"],
    [/(?:层叠).*?(?:结构|设计)/, "层叠结构设计"],
    [/(?:折痕)/, "折痕控制方案"],
    [/(?:纳米纹理).*?(?:玻璃)?/, "纳米纹理玻璃"],
    [/(?:Apple\s*Pencil|苹果笔)/i, "Apple Pencil 支持"],
    [/(?:MagSafe|Magsafe|磁吸)/i, "MagSafe 磁吸方案"],
    [/(?:IP68|防水)/i, "IP68 防护规格"],
    [/(?:A20\s*Pro|A20)/i, "A20 Pro 性能"],
    [/(?:内屏).*?(?:多任务)|(?:多任务)/, "内屏多任务"],
    [/(?:外屏)/, "外屏交互体验"],
    [/(?:玻璃).*?(?:折)|(?:折).*?(?:玻璃)/, "可折叠玻璃"],
    [/(?:铰链)/, "铰链结构设计"],
    [/(?:折叠)/, "折叠结构细节"],
  ];
  for (const [pattern, phrase] of rules) if (pattern.test(source)) return phrase;
  const clause = localClauses(source).find((item) => item.length >= 4 && item.length <= 15);
  if (clause) return clause.slice(0, 15);
  const compact = source.replace(/[，,。！？；、\s]/g, "");
  return compact.length >= 4 ? compact.slice(0, 15) : "";
}

function localEffectFor(text, headline) {
  const source = normalizeSimplifiedChinese(text);
  const rules = [
    [/(?:钛金属|太坚守|太金属)/, "钛金属基板提供平整支撑"],
    [/(?:四个|四).{0,3}边角.*?(?:按不下|平整)|(?:按不下).*?(?:平整)/, "四角平整增强机身支撑"],
    [/(?:钛金属|太金属).*(?:层叠|折痕)/, "钛金属层叠结构改善折痕"],
    [/(?:层叠).*?(?:折痕)/, "层叠结构重点改善折痕"],
    [/(?:纳米纹理).*?(?:玻璃)/, "纳米纹理玻璃兼顾清晰度"],
    [/(?:内屏).*?(?:多任务)|(?:多任务)/, "内屏可以衔接多任务"],
    [/(?:玻璃).*?(?:折)|(?:折).*?(?:玻璃)/, "玻璃材质也能实现折叠"],
    [/(?:铰链)/, "铰链结构决定开合手感"],
  ];
  for (const [pattern, phrase] of rules) if (pattern.test(source) && phrase !== headline) return phrase;
  const normalizedHeadline = compactEffectCopy(headline).replace(/[，,。！？；、\s]/g, "");
  const clause = localClauses(source).find((item) => {
    const normalized = compactEffectCopy(item).replace(/[，,。！？；、\s]/g, "");
    return item.length >= 8 && item.length <= 18 && normalized && normalized !== normalizedHeadline;
  });
  if (clause) return clause;
  const compact = source.replace(/[，,。！？；、\s]/g, "");
  if (compact && compact !== normalizedHeadline) return compact.slice(0, 16);
  return "";
}

function topicFor(text) {
  if (/(火了|爆火|火到什么程度).*(找上门|活动现场)|(找上门|活动现场).*(火了|爆火|火到什么程度)/.test(text)) return "需求验证";
  if (/(20多场活动|二十多场活动|自己的品牌)/.test(text)) return "品牌增长";
  if (/(新发明|好生意).*(换个场景|用法)|(换个场景|用法).*(新发明|好生意)/.test(text)) return "场景创新";
  if (/^也能变成一门生意/.test(text) || /(旧工具|家里).*(换个场景|一门生意)|(换个场景|一门生意).*(旧工具|家里)/.test(text)) return "资产盘活";
  if (/(制作过程|发到网上|视频火)/.test(text)) return "内容传播";
  if (/(带到活动现场|不是来买贴纸|婚礼|生日|企业活动)/.test(text)) return "活动服务";
  if (/(贴纸|定制).*?(副业|零花钱|店里|闲着)/.test(text) || /(副业|零花钱|店里|闲着).*?(贴纸|定制)/.test(text)) return "创意副业";
  if (/(公众号|关注.*(?:公众号|项目库|内部玩法))/.test(text)) return "项目资源入口";
  if (/项目我跟你们讲/.test(text) && !/(古人|历史人物|画像|猎奇|好奇心|流量|变现|带货|项目库|赚钱|广告|账号)/.test(text.replace(/项目我跟你们讲/g, ""))) return "案例引入";
  if (/(折叠|内屏|外屏|多任务|展开)/i.test(text)) return "折叠体验";
  if (/(董事会|CEO|首席执行官|接任|交接|高管)/i.test(text)) return "管理层交接";
  if (/(人工智能|端侧AI|\bAI\b|Siri)/i.test(text)) return "AI 战略";
  if (/(古人|历史人物|画像|猎奇|好奇心)/.test(text) && /(流量|变现|带货|项目库|赚钱|广告|账号)/.test(text)) return "内容变现";
  if (/(DeepSeek|Dipsick|即梦|AI|提示词|生成视频|生成图片)/i.test(text)) return "AI 创作工作流";
  if (/(流量|变现|带货|项目库|赚钱|广告|账号|点赞)/.test(text)) return "内容变现";
  if (/(步骤|首先|第二|第三|流程|操作)/.test(text)) return "实操流程";
  if (/(产品|功能|工具|软件|平台)/.test(text)) return "工具与方法";
  return "核心观点";
}

function priorityBeatCopy(text) {
  const overrides = [
    [/(董事会|CEO|首席执行官|接任|交接|高管).*?(工程能力|产品路线)|(工程能力|产品路线).*?(董事会|CEO|首席执行官|接任|交接|高管)/i, {topic: "管理层交接", headline: "新任 CEO 交接", effectZh: "董事会重估工程能力"}],
    [/(公众号|关注.*(?:公众号|项目库|内部玩法|项目资料))/, {topic: "项目资源入口", headline: "获取完整项目资料", effectZh: "关注公众号获取完整项目资料"}],
    [/(项目我跟你们讲|古人复活|历史人物|画像|猎奇|好奇心).*(古人复活|历史人物|画像|猎奇|好奇心|流量|变现|带货|项目库|赚钱|广告|账号)|(古人复活|历史人物|画像|猎奇|好奇心).*(流量|变现|带货|项目库|赚钱|广告|账号)/, {topic: "内容变现", headline: "猎奇内容的变现逻辑", effectZh: "古人复活内容满足猎奇需求"}],
    [/^(?:主持人[：:]?)?这?个项目我跟你们讲[，,]?$/, {topic: "案例引入", headline: "重新组合资源创造价值", effectZh: "从案例开始拆解赚钱逻辑"}],
    [/(制作过程|发到网上|视频火|这条视频火)/, {topic: "内容传播", headline: "定制内容为何能快速走红", effectZh: "制作过程放大定制服务需求"}],
    [/(机器闲置在店里|印点贴纸|零花钱|副业)/, {topic: "创意副业", headline: "贴纸机如何从副业走红", effectZh: "闲置机器先验证副业需求"}],
    [/(火到什么程度|找上门来|主动询单)/, {topic: "需求验证", headline: "内容爆火带来主动询单", effectZh: "观看流量转成现场需求"}],
    [/(不是来买贴纸|带到活动现场|活动现场|生日派对|企业活动)/, {topic: "活动服务", headline: "从卖贴纸到卖现场服务", effectZh: "现场体验才是真正商品"}],
    [/(20多场活动|二十多场活动|自己的品牌)/, {topic: "品牌增长", headline: "二十场活动跑出个人品牌", effectZh: "连续活动验证品牌价值"}],
    [/(新发明|好生意).*(换个场景|用法)|(换个场景|用法).*(新发明|好生意)/, {topic: "场景创新", headline: "换个场景就是新生意", effectZh: "旧物换用法创造新需求"}],
    [/^也能变成一门生意|旧工具.*新收入|家里.*吃灰.*生意/, {topic: "资产盘活", headline: "旧工具也能创造新收入", effectZh: "闲置资产换场景变现"}],
    [/(新产品路线|产品路线).*(端侧人工智能|端侧AI|AI)|(端侧人工智能|端侧AI|AI).*(新产品路线|产品路线)/i, {topic: "AI 战略", headline: "端侧 AI 产品路线", effectZh: "新产品路线转向端侧智能"}],
    [/(商品服务.*AI商业搜寻|资料保持.*最新|带进曝光)/i, {topic: "商业资料", headline: "商品资料直达商业搜索", effectZh: "准确信息才能带来曝光"}],
    [/(LLMS.*AI代理|AI代理.*(?:自动|不同))/i, {topic: "代理规则", headline: "代理规则仍待观察", effectZh: "新入口尚未形成统一标准"}],
    [/(语义化HTML|网站速度)/i, {topic: "网站体验", headline: "语义与速度才是王道", effectZh: "基础体验支撑搜索表现"}],
    [/(SEO.*(?:死透|白费)|传统.*SEO)/i, {topic: "SEO基础", headline: "传统SEO并未失效", effectZh: "搜索基础仍是核心资产"}],
    [/(LLMS|LMS.*TXT|内容切块)/i, {topic: "无效偏方", headline: "切块偏方不必跟风", effectZh: "谷歌明确否定投机操作"}],
    [/(五大迷思|核心策略)/, {topic: "策略拆解", headline: "五大迷思逐一拆解", effectZh: "先分清焦虑与有效策略"}],
    [/(AIO|GEO|新名词)/i, {topic: "行业焦虑", headline: "新名词正在放大焦虑", effectZh: "概念包装不能替代增长"}],
    [/(第二去.*Search.*Console|Search.*Console.*索引)/i, {topic: "行动指南", headline: "检查索引并深耕内容", effectZh: "技术与观点必须同步推进"}],
    [/(最后记得.*更新.*(?:商家|Merchant)|更新.*Merchant.*档案)/i, {topic: "商业资料", headline: "商家资料需要持续更新", effectZh: "准确信息才能进入商业搜索"}],
    [/(Merchant Center|商家档案)/i, {topic: "商业资料", headline: "商品资料应保持最新", effectZh: "准确信息才能进入商业搜索"}],
    [/(访客.*收[获货]|追着演算法)/, {topic: "用户价值", headline: "用户收获才是最终标准", effectZh: "所有优化都应服务真实价值"}],
  ];
  for (const [pattern, result] of overrides) if (pattern.test(text)) return result;
  const rules = [
    [/(停止.*优化偏方|停止把钱)/, {topic: "行动指南", headline: "停止无效优化投入", effectZh: "预算应回到有效动作"}],
    [/(索引状态.*健康|Search.*Console.*索引|深度.*独特观点)/i, {topic: "行动指南", headline: "检查索引并深耕内容", effectZh: "技术与观点必须同步推进"}],
    [/(终极滤镜|访客.*收获|追着演算法)/, {topic: "用户价值", headline: "用户收获才是最终标准", effectZh: "所有优化都应服务真实价值"}],
    [/(不会被淘汰|唯一.*策略)/, {topic: "长期策略", headline: "长期策略回到用户价值", effectZh: "有用内容始终不会过时"}],
    [/(行销预算.*砸|核心SEO比较实在|暂时.*押注)/, {topic: "投入节奏", headline: "代理趋势暂不值得押注", effectZh: "先守住核心搜索基本盘"}],
    [/(执行任务|比对.*规格|说明书)/, {topic: "任务执行", headline: "任务代理需要新说明", effectZh: "机器执行更依赖结构化信息"}],
    [/(AI代理程式|AI代理)/i, {topic: "代理趋势", headline: "AI代理将重构访问入口", effectZh: "任务型搜索正在成为新变量"}],
    [/(真实人类观点|掰不出来|人类观点)/, {topic: "观点稀缺", headline: "真实观点无法被复制", effectZh: "AI更重视稀缺经验信号"}],
    [/(虚假的品牌|论坛刷|搜索红线)/, {topic: "风险控制", headline: "虚假提及触碰搜索红线", effectZh: "投机操作会积累长期风险"}],
  ];
  for (const [pattern, result] of rules) if (pattern.test(text)) return result;
  return null;
}
function specificBeatCopy(text) { const rules = [[/(Google.*(?:发布|文件|指南)|官方.*指南)/i, {topic: '搜索规则', headline: '谷歌文件划清边界', effectZh: '官方指南戳破优化泡沫'}], [/(过度炒作|残酷的现实)/, {topic: '搜索焦虑', headline: '搜索炒作需要降温', effectZh: '先把营销话术拉回现实'}], [/(砸大钱|请顾问|付钱给顾问)/, {topic: '预算决策', headline: '焦虑顾问正在收割预算', effectZh: '高价服务未必解决问题'}], [/(LLMS|LMS.*TXT|内容切块)/i, {topic: '无效偏方', headline: '切块偏方不必跟风', effectZh: '谷歌明确否定投机操作'}], [/(五大迷思|核心策略)/, {topic: '策略拆解', headline: '五大迷思逐一拆解', effectZh: '先分清焦虑与有效策略'}], [/(AIO|GEO|新名词)/i, {topic: '行业焦虑', headline: '新名词正在放大焦虑', effectZh: '概念包装不能替代增长'}], [/(SEO.*(?:死透|白费)|传统.*SEO)/i, {topic: 'SEO基础', headline: '传统SEO并未失效', effectZh: '搜索基础仍是核心资产'}], [/(排名.*系统|建立在Google.*搜索|生成.*功能.*核心)/i, {topic: '搜索机制', headline: '生成答案依赖排名', effectZh: 'AI引用仍受搜索机制约束'}], [/(RAG|索引.*(?:内容|收录)|没有被Google)/i, {topic: '索引能力', headline: '索引决定内容能否入选', effectZh: '未被收录就无法参与回答'}], [/(基础架构.*地基|基础架构还是)/, {topic: '技术基础', headline: '基础架构仍是内容地基', effectZh: '可抓取性决定后续机会'}], [/(引用.*情境|严格针对)/, {topic: '目标厘清', headline: '引用场景需要先厘清', effectZh: '别把优化目标混为一谈'}], [/(机器喜欢的格式|专属.*TXT|专属.*档)/i, {topic: '内容格式', headline: '专属文件不是捷径', effectZh: '迎合机器反而容易跑偏'}], [/(切碎分块|低品质内容)/, {topic: '内容质量', headline: '刻意切块反伤内容', effectZh: '系统理解完整文章结构'}], [/(虚假的品牌|论坛刷|搜索红线)/, {topic: '风险控制', headline: '虚假提及触碰搜索红线', effectZh: '投机操作会积累长期风险'}], [/(罐头内容|第一手.*经验)/, {topic: '内容价值', headline: '第一手经验才有价值', effectZh: '独特内容更容易被信任'}], [/(真实人类观点|掰不出来|人类观点)/, {topic: '观点稀缺', headline: '真实观点无法被复制', effectZh: 'AI更重视稀缺经验信号'}], [/(Search.*Console|Robots.*TXT|挡住.*爬虫)/i, {topic: '抓取能力', headline: '爬虫可达才有曝光机会', effectZh: '技术基础决定内容可见性'}], [/(语义化HTML|网站速度)/i, {topic: '网站体验', headline: '语义与速度才是王道', effectZh: '基础体验支撑搜索表现'}], [/(Merchant Center|商家档案)/i, {topic: '商业资料', headline: '商品资料应保持最新', effectZh: '准确信息才能进入商业搜索'}], [/(AI代理程式|AI代理)/i, {topic: '代理趋势', headline: 'AI代理将重构访问入口', effectZh: '任务型搜索正在成为新变量'}], [/(执行任务|比对.*规格|说明书)/, {topic: '任务执行', headline: '任务代理需要新说明', effectZh: '机器执行更依赖结构化信息'}], [/(行销预算.*砸|核心SEO比较实在|暂时.*押注)/, {topic: '投入节奏', headline: '代理趋势暂不值得押注', effectZh: '先守住核心搜索基本盘'}], [/(停止.*优化偏方|停止把钱)/, {topic: '行动指南', headline: '停止无效优化投入', effectZh: '预算应回到有效动作'}], [/(索引状态.*健康|深度.*独特观点)/, {topic: '行动指南', headline: '检查索引并深耕内容', effectZh: '技术与观点必须同步推进'}], [/(终极滤镜|访客.*收获|追着演算法)/, {topic: '用户价值', headline: '用户收获才是最终标准', effectZh: '所有优化都应服务真实价值'}], [/(不会被淘汰|唯一.*策略)/, {topic: '长期策略', headline: '长期策略回到用户价值', effectZh: '有用内容始终不会过时'}]]; for (const [pattern, result] of rules) if (pattern.test(text)) return result; return null; }

function genericHeadlineFor(text) {
  return localHeadlineFor(text);
}

function headlineFor(topic, text, index) {
  return localHeadlineFor(text);
}

function effectZhFor(topic, text, headline) {
  return localEffectFor(text, headline) || (headline ? ("围绕" + headline + "展开").slice(0, 16) : "提炼当前片段核心信息");
}

function effectEnFor(captions, topic) {
  const text = (captions ?? []).map((caption) => String(caption?.en ?? "").trim()).filter(Boolean).join(" ");
  if (text) return conciseEffectCopy(text, 72);
  if (topic === "活动服务") return "Sell the live custom experience, not just the sticker";
  if (topic === "内容传播") return "The making process turns custom work into shareable content";
  if (topic === "创意副业") return "Turn a simple sticker machine into a custom-event business";
  if (topic === "项目资源入口") return "Follow for the complete project library and practical playbook";
  if (topic === "案例引入") return "Start with a practical case and its business logic";
  if (topic === "管理层交接") return "Leadership transition centers on engineering capability";
  if (topic === "AI 战略") return "The product roadmap shifts toward on-device intelligence";
  if (topic === "内容变现") return "Turn audience attention into a repeatable business model";
  if (topic === "AI 创作工作流") return "Build the result through a practical AI workflow";
  return "Focus on the key idea behind this beat";
}

function deriveBeatText(captions, index) {
  const sentences = meaningfulSentences(captions);
  const text = sentences.join("。") || normalizeSimplifiedChinese((captions ?? []).map((caption) => caption?.zh).join(" "));
  const specific = priorityBeatCopy(text) || specificBeatCopy(text);
  const topic = specific?.topic || topicFor(text);
  const candidateHeadline = specific?.headline || headlineFor(topic, text, index);
  const candidateIsLegacy = legacyGenericCopy.has(compactEffectCopy(candidateHeadline));
  const headline = !candidateIsLegacy && isTitleQuality(candidateHeadline) ? candidateHeadline : localHeadlineFor(text);
  if (!headline) throw new Error("BeatExtractionError: no local headline could be derived from the caption window");
  const rawEffectZh = compactEffectCopy(specific?.effectZh || effectZhFor(topic, text, headline));
  if (!rawEffectZh) throw new Error("BeatExtractionError: no local effect copy could be derived from the caption window");
  const normalizedHeadline = compactEffectCopy(headline).replace(/[，,。！？；、\s]/g, "");
  const normalizedEffect = rawEffectZh.replace(/[，,。！？；、\s]/g, "");
  const effectZh = normalizedHeadline === normalizedEffect ? (topic === "核心观点" ? "突出这一拍的关键业务价值" : "呈现" + topic + "的关键变化") : rawEffectZh;
  return {
    chapter: String(index + 1).padStart(2, "0") + " · " + topic,
    headline: compactEffectCopy(headline),
    effectZh: compactEffectCopy(effectZh),
    effectEn: compactEffectCopy(effectEnFor(captions, topic)),
  };
}

module.exports = {deriveBeatText, meaningfulSentences, normalizeSimplifiedChinese};
