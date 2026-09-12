const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildProjectFromWhisper,
  hydrateBeatDrafts,
  rebuildProjectText,
  mergeWhisperCaptions,
  whisperToCaptions,
} = require("./project-onboarding.cjs");

test("converts whisper.cpp timestamps into editor captions", () => {
  const captions = whisperToCaptions({
    transcription: [
      {offsets: {from: 0, to: 1300}, text: "第一句"},
      {offsets: {from: 1300, to: 2450}, text: "第二句"},
    ],
  });

  assert.deepEqual(captions, [
    {id: "subtitle-001", start: 0, end: 1.3, zh: "第一句", en: ""},
    {id: "subtitle-002", start: 1.3, end: 2.45, zh: "第二句", en: ""},
  ]);
});

test("creates a variable-length project with auto-matched unlocked beats", () => {
  const project = buildProjectFromWhisper({
    projectId: "tesla-fsd",
    name: "Tesla FSD",
    videoSrc: "tesla-fsd.mp4",
    audioSrc: "tesla-fsd-audio.wav",
    duration: 25,
    transcript: {
      transcription: [
        {offsets: {from: 0, to: 12000}, text: "CEO 发布了新车"},
        {offsets: {from: 12000, to: 25000}, text: "100 万辆新车正在交付"},
      ],
    },
  });

  assert.equal(project.beats.length, 1);
  assert.equal(project.beats[0].layout, "chapter-card");
  assert.equal(project.targetBeatDuration, 30);
  assert.equal(project.beats.every((beat) => beat.layoutLocked === false), true);
  assert.equal(project.render.status, "idle");
  assert.equal(project.beats.every((beat) => beat.render.status === "idle"), true);
});

test("hydrates every beat draft from captions in its own time range", () => {
  const project = buildProjectFromWhisper({
    projectId: "caption-draft",
    name: "Caption Draft",
    videoSrc: "caption-draft.mp4",
    audioSrc: "caption-draft.wav",
    duration: 45,
    transcript: {
      transcription: [
        {offsets: {from: 0, to: 10000}, text: "库克正在交接苹果的领导权。"},
        {offsets: {from: 10000, to: 20000}, text: "董事会更看重工程能力。"},
        {offsets: {from: 20000, to: 25000}, text: "中段论点已经完整结束。"},
        {offsets: {from: 25000, to: 45000}, text: "新产品路线将转向端侧人工智能。"},
      ],
    },
    translation: {
      transcription: [
        {offsets: {from: 0, to: 25000}, text: "Cook is handing over Apple's leadership to an engineering-focused successor."},
        {offsets: {from: 25000, to: 45000}, text: "The product roadmap will pivot toward on-device AI."},
      ],
    },
  });

  assert.equal(project.beats.length, 2);
  assert.match(project.beats[0].zh, /董事会|中段论点/);
  assert.match(project.beats[0].en, /Cook/);
  assert.equal(project.beats.every((beat) => !/Key Point/.test(beat.subtitle)), true);
  assert.match(project.beats[1].en, /on-device AI/);
});
test("generates concise semantic chapter and headline copy for each beat", () => {
  const project = buildProjectFromWhisper({
    projectId: "semantic-copy",
    name: "Semantic Copy",
    videoSrc: "semantic.mp4",
    audioSrc: "semantic.wav",
    duration: 12,
    transcript: {transcription: [
      {offsets: {from: 0, to: 5000}, text: "董事会正在讨论新任CEO的交接方案"},
      {offsets: {from: 5000, to: 12000}, text: "工程能力将成为未来产品路线的核心"},
    ]},
  });

  assert.equal(project.beats[0].eyebrow, "01 · 管理层交接");
  assert.equal(project.beats[0].subtitle, "新任 CEO 交接");
  assert.equal(project.beats[0].subtitle.length <= 12, true);
  assert.match(project.beats[0].zh, /董事会/);
});
test("merges Whisper translation text into matching timecoded captions", () => {
  const captions = mergeWhisperCaptions(
    whisperToCaptions({transcription: [
      {offsets: {from: 0, to: 1300}, text: "中文第一句"},
      {offsets: {from: 1300, to: 2450}, text: "中文第二句"},
    ]}),
    {transcription: [
      {offsets: {from: 0, to: 1300}, text: "First English sentence."},
      {offsets: {from: 1300, to: 2450}, text: "Second English sentence."},
    ]},
  );
  assert.equal(captions[0].en, "First English sentence.");
  assert.equal(captions[1].en, "Second English sentence.");
});
test("extracts concise effect copy without ellipses", () => {
  const project = buildProjectFromWhisper({
    projectId: "concise-copy", name: "Concise Copy", videoSrc: "copy.mp4", audioSrc: "copy.wav", duration: 12,
    transcript: {transcription: [{offsets: {from: 0, to: 12000}, text: "这是一个非常长的观点说明，后面还有更多没有必要放进动效画面的描述。"}]},
    translation: {transcription: [{offsets: {from: 0, to: 12000}, text: "This is a long point for the motion graphic, followed by details that should stay out of the effect copy."}]},
  });
  assert.equal(/[.…]/.test(project.beats[0].zh), false);
  assert.equal(/[.…]/.test(project.beats[0].en), false);
  assert.equal(project.beats[0].zh.length <= 22, true);
  assert.equal(project.beats[0].en.length <= 72, true);
});

test("cleans ellipses from a persisted effect headline", () => {
  const {ensureProjectLifecycle} = require("./project-render-assets.cjs");
  const project = ensureProjectLifecycle({projectId: "headline-clean", beats: [{id: "beat-001", start: 0, end: 12, subtitle: "这是一个标题...", zh: "观点…", en: "Point..."}]});
  assert.equal(project.beats[0].subtitle, "这是一个标题");
  assert.equal(project.beats[0].zh, "观点");
  assert.equal(project.beats[0].en, "Point");
});

test("splits long Whisper rows into sequential two-line subtitle cues", () => {
  const captions = whisperToCaptions({transcription: [
    {offsets: {from: 0, to: 12000}, text: "她卖的根本不是贴纸，她卖的是活动现场的及时惊喜。同一台机器，换个场景就变成生意。"},
  ]});
  assert.equal(captions.length > 2, true);
  assert.equal(captions.every((caption) => caption.zh.length <= 22), true);
  assert.equal(captions[0].start, 0);
  assert.equal(captions.at(-1).end, 12);
  assert.equal(captions.every((caption, index) => index === 0 || caption.start >= captions[index - 1].end), true);
});


test("normalizes Whisper Chinese to simplified characters before captions are persisted", () => {
  const captions = whisperToCaptions({transcription: [{offsets: {from: 0, to: 2000}, text: "我們這個項目賺麻了，關注公眾號。"}]});
  assert.equal(captions[0].zh, "我们这个项目赚麻了，");
  assert.equal(captions[1].zh, "关注公众号。");
});

test("derives a semantic headline from the full beat instead of a spoken fragment", () => {
  const beats = hydrateBeatDrafts([{id: "beat-001", start: 0, end: 15, eyebrow: "CHAPTER 01", subtitle: "Key Point 1", zh: "文案要点 1", en: "Core point 1"}], [{id: "a", start: 0, end: 4, zh: "主持人：这个项目我跟你们讲，真的是赚麻了。", en: ""}, {id: "b", start: 4, end: 9, zh: "核心逻辑是满足大家想看古人复活的好奇心。", en: ""}, {id: "c", start: 9, end: 15, zh: "抓住这种内容流量后，还能通过带货和项目库变现。", en: ""}], {force: true});
  assert.equal(beats[0].eyebrow, "01 · 内容变现");
  assert.equal(beats[0].subtitle, "猎奇内容的变现逻辑");
  assert.equal(beats[0].zh, "古人复活内容满足猎奇需求");
  assert.equal(/主持人|这个项目我跟你/.test(beats[0].subtitle), false);
});


test("rebuilds automatic legacy beat text while preserving locked manual text", () => {
  const project = rebuildProjectText({projectId: "legacy-copy", captions: [{id: "a", start: 0, end: 15, zh: "主持人：這個項目我跟你們講，古人復活內容靠流量變現。", en: ""}], beats: [{id: "beat-001", start: 0, end: 15, eyebrow: "01 · 核心观点", subtitle: "主持人：這個項目我跟你", zh: "這個項目我跟你們講", en: "", layoutLocked: false}, {id: "beat-002", start: 15, end: 30, eyebrow: "手工章节", subtitle: "手工大标题", zh: "手工效果短句", en: "Manual effect copy", layoutLocked: true}]});
  assert.equal(project.captions[0].zh.includes("這"), false);
  assert.equal(project.beats[0].subtitle, "猎奇内容的变现逻辑");
  assert.equal(project.beats[0].zh, "古人复活内容满足猎奇需求");
  assert.equal(project.beats[1].subtitle, "手工大标题");
  assert.equal(project.beats[1].zh, "手工效果短句");
});


test("uses complete semantic fallback copy for an intro plug and an incomplete host cue", () => {
  const beats = hydrateBeatDrafts([{id: "beat-001", start: 0, end: 15, eyebrow: "CHAPTER 01", subtitle: "Key Point 1", zh: "文案要点 1", en: "Core point 1"}, {id: "beat-002", start: 15, end: 30, eyebrow: "CHAPTER 02", subtitle: "Key Point 2", zh: "文案要点 2", en: "Core point 2"}], [{id: "a", start: 0, end: 15, zh: "我們公眾號是大東實戰，關注公眾號可以查看更多的內部玩法和項目庫。", en: ""}, {id: "b", start: 15, end: 30, zh: "主持人：這個項目我跟你們講，", en: ""}], {force: true});
  assert.equal(beats[0].subtitle, "获取完整项目资料");
  assert.equal(beats[0].zh, "关注公众号获取完整项目资料");
  assert.equal(beats[1].subtitle, "重新组合资源创造价值");
  assert.equal(beats[1].zh, "从案例开始拆解赚钱逻辑");
});


test("keeps a content-propagation headline distinct from its effect copy", () => {
  const beats = hydrateBeatDrafts([{id: "beat-001", start: 0, end: 12, eyebrow: "CHAPTER 01", subtitle: "Key Point 1", zh: "文案要点 1", en: "Core point 1"}], [{id: "a", start: 0, end: 3, zh: "就摆在店里闲着时候印点贴纸，赚点零花钱。", en: ""}, {id: "b", start: 3, end: 7, zh: "姐姐结婚时，她做了专属定制贴纸。", en: ""}, {id: "c", start: 7, end: 12, zh: "制作过程发到网上后，这条视频火了。", en: ""}], {force: true});
  assert.equal(beats[0].eyebrow, "01 · 内容传播");
  assert.equal(beats[0].subtitle, "定制内容为何能快速走红");
  assert.equal(beats[0].zh, "制作过程放大定制服务需求");
  assert.notEqual(beats[0].subtitle, beats[0].zh);
});

test("derives distinct story beats across a multi-stage creative business narrative", () => {
  const beats = hydrateBeatDrafts([{id: "beat-001", start: 0, end: 12, eyebrow: "CHAPTER 01", subtitle: "Key Point 1", zh: "文案要点 1", en: "Core point 1"}, {id: "beat-002", start: 12, end: 24, eyebrow: "CHAPTER 02", subtitle: "Key Point 2", zh: "文案要点 2", en: "Core point 2"}, {id: "beat-003", start: 24, end: 36, eyebrow: "CHAPTER 03", subtitle: "Key Point 3", zh: "文案要点 3", en: "Core point 3"}], [{id: "a", start: 0, end: 12, zh: "机器闲置在店里，只能印点贴纸赚零花钱。", en: ""}, {id: "b", start: 12, end: 24, zh: "姐姐婚礼需要定制贴纸，她把制作过程发到网上后视频火了。", en: ""}, {id: "c", start: 24, end: 36, zh: "看视频的人不是来买贴纸，而是请她把机器带到活动现场。", en: ""}], {force: true});
  assert.deepEqual(beats.map((beat) => beat.subtitle), ["贴纸机如何从副业走红", "定制内容为何能快速走红", "从卖贴纸到卖现场服务"]);
  assert.equal(new Set(beats.map((beat) => beat.zh)).size, 3);
  assert.equal(beats.every((beat) => beat.subtitle !== beat.zh), true);
});


test("replaces incomplete ASR fragments with complete narrative titles", () => {
  const beats = hydrateBeatDrafts([{id: "beat-003", start: 0, end: 12, eyebrow: "CHAPTER 03", subtitle: "Key Point 3", zh: "文案要点 3", en: "Core point 3"}, {id: "beat-005", start: 12, end: 24, eyebrow: "CHAPTER 05", subtitle: "Key Point 5", zh: "文案要点 5", en: "Core point 5"}, {id: "beat-007", start: 24, end: 36, eyebrow: "CHAPTER 07", subtitle: "Key Point 7", zh: "文案要点 7", en: "Core point 7"}, {id: "beat-008", start: 36, end: 48, eyebrow: "CHAPTER 08", subtitle: "Key Point 8", zh: "文案要点 8", en: "Core point 8"}], [{id: "a", start: 0, end: 12, zh: "火到什么程度，看视频的人开始一个个找上门来，请她把机器带到活动现场。", en: ""}, {id: "b", start: 12, end: 24, zh: "一年跑了美国二十多场活动，最终跑成了自己的品牌。", en: ""}, {id: "c", start: 24, end: 36, zh: "有时候一门好生意不需要新发明，只要换个场景和用法。", en: ""}, {id: "d", start: 36, end: 48, zh: "也能变成一门生意。", en: ""}], {force: true});
  assert.deepEqual(beats.map((beat) => beat.subtitle), ["内容爆火带来主动询单", "二十场活动跑出个人品牌", "换个场景就是新生意", "旧工具也能创造新收入"]);
  assert.equal(beats.every((beat) => !/^(也能|有时候|她|他|这|那|火到|就|然后)/.test(beat.subtitle)), true);
  assert.equal(beats.every((beat) => beat.subtitle.length >= 8 && beat.subtitle.length <= 14), true);
  assert.equal(beats.every((beat) => beat.subtitle !== beat.zh), true);
});


test("creates semantic 20-to-30-second windows from Whisper punctuation", () => {
  const project = buildProjectFromWhisper({
    projectId:"semantic-windows", name:"Semantic Windows", videoSrc:"semantic.mp4", audioSrc:"semantic.wav", duration:45,
    transcript:{transcription:[
      {offsets:{from:0,to:6000},text:"开场铺垫"},
      {offsets:{from:6000,to:12000},text:"继续说明"},
      {offsets:{from:12000,to:18000},text:"关键论点"},
      {offsets:{from:18000,to:22500},text:"第一段完整结束。"},
      {offsets:{from:22500,to:33000},text:"第二段展开说明"},
      {offsets:{from:33000,to:44000},text:"第二段完整结束。"},
    ]},
  });
  assert.deepEqual(project.beats.map((beat) => ({start:beat.start,end:beat.end})), [{start:0,end:22.5},{start:22.5,end:45}]);
  assert.equal(project.targetBeatDuration,30);
});

test("starts semantic beat windows at the first spoken caption after a long intro silence", () => {
  const project = buildProjectFromWhisper({
    projectId:"intro-silence", name:"Intro Silence", videoSrc:"intro.mp4", audioSrc:"intro.wav", duration:191.43,
    transcript:{transcription:[
      {offsets:{from:14700,to:19060},text:"大家好，这里是大东实战，然后继续给大家更新这个最近特别火的玩法。"},
      {offsets:{from:30020,to:33660},text:"这个项目我跟你们讲，真的是赚麻了，知道吧？"},
      {offsets:{from:54100,to:59670},text:"具体怎么做呢？非常简单，我都帮大家把流程跑通了。"},
      {offsets:{from:87470,to:92430},text:"把词粘贴进去，记得把画像两个字删掉。"},
      {offsets:{from:122060,to:128470},text:"生成好了之后，你把它拖到剪映里面。"},
      {offsets:{from:148150,to:154590},text:"第一种就是带货，卖那种历史书，佣金很高的。"},
      {offsets:{from:178590,to:185990},text:"这一节就先分享到这里吧，感谢大家收看。"},
    ]},
  });
  assert.equal(project.beats[0].start, 14.7);
  assert.ok(project.beats.length > 0);
});
test("caption confirmation tolerates a greeting-only opening layer", () => {
  const project = buildProjectFromWhisper({
    projectId: "greeting-only-opening",
    name: "Greeting Only Opening",
    videoSrc: "source/raw.mp4",
    audioSrc: "source/audio.wav",
    duration: 45,
    targetBeatDuration: 30,
    transcript: {
      transcription: [
        {offsets: {from: 0, to: 15000}, text: "大家好，"},
        {offsets: {from: 15000, to: 22000}, text: "今天这个项目我们继续拆一个普通人也能操作的流量玩法。"},
        {offsets: {from: 22000, to: 31000}, text: "第一种就是带货，卖那种历史书，佣金很高。"},
        {offsets: {from: 31000, to: 45000}, text: "第二种就是收图，有人问就把教程整理成项目库。"},
      ],
    },
  });
  assert.ok(project.beats.length >= 1);
  assert.ok(project.beats[0].layers.length >= 1);
  assert.match(project.beats[0].layers[0].effectProps.headline, /核心观点|项目|流量|内容|带货|资料/);
});

