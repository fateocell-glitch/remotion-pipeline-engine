"use strict";

const {createServer} = require("node:http");
const {createReadStream, createWriteStream, existsSync, readdirSync, readFileSync} = require("node:fs");
const {appendFile, readFile, writeFile, mkdir, rename, stat} = require("node:fs/promises");
const {dirname, join} = require("node:path");
const {spawn} = require("node:child_process");
const {autoMatchProject} = require("./layout-matcher.cjs");
const {stage1TranscribeToReview, stage2ProduceFromConfirmed} = require("./run-local-onboarding.cjs");
const {createProjectStorage, projectPaths} = require("./services/project-store.cjs");
const {createLogger} = require("./utils/logger.cjs");
const {hydrateBeatDrafts, rebuildProjectText, mergeShortCaptions, mergeWhisperCaptions} = require("./project-onboarding.cjs");
const {captionsToWhisperTranscript, runFasterTranscription} = require("./faster-transcription.cjs");
const {currentAssetPath, ensureProjectLifecycle, mergeProjectEdits, recoverOrphanedBeatRenders, reconcileProjectRenderCache, renderContentHash, updateBeatRender} = require("./project-render-assets.cjs");
const {renderProgress} = require("./render-progress.cjs");
const {mergeGlobalSettings} = require("./services/global-settings.cjs");
const {buildPage} = require("./project-studio-page.cjs");
const {normalizeBeatLayers, validEffectLayers} = require("./services/effect-layer-schema.cjs");
const {cleanProjectPreviews, deleteProject, listProjectSummaries, renameProject} = require("./services/project-management.cjs");
const {validateBeatIntegrity, shouldAbortForStall, diagnoseRenderFailure} = require("./services/beat-render-guard.cjs");
const {buildAdminComponentsPage} = require("./admin-components-page.cjs");
const {getComponentRegistrySync, moveComponentToFamily, updateComponentPreset} = require("./services/component-registry-store.cjs");

const root = process.cwd();
const projectsDir = join(root, "data", "projects");
const previewDir = join(root, "out", "project-editor-web-previews");
const componentAssetRegistry = getComponentRegistrySync(root);
const componentAssetsById = new Map(componentAssetRegistry.components.map((component) => [component.id, component]));
const layouts = ["person-rank","event-timeline","pivot-list","capital-dashboard","cook-machine","engineering-return","market-battlefield","finale-kinetic","reject-list","check-progress","diagonal-chips","floating-chips","bare-typography","chapter-card","logo-wordmark","ordered-sequence","org-chart","draw-line","progress-donut","avatar-handoff","bull-bear","opinion-hero","photo-wall","product-explosion","route-map","data-flow","screen-recording","zoom-statement","desktop-folders","time-rewind","clipboard-note","closing-checklist","platform-shift-line","tradeoff-reject-round","recovery-progress-bars","hud-glow-stack","briefing-poster","rewind-milestones","flying-paper-stack","checklist-editorial","spotlight-question"];
const layoutSet = new Set(layouts);
const jobs = new Map();
const activeBeatRenders = new Map();
const logger = createLogger({root});
const isLocalAdmin = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(String(req.socket?.remoteAddress || ""));
const logWork = (projectId, action, details = {}) => logger.info({traceId: `trace-${Date.now()}`, projectId, stage: action === "upload-started" ? "UPLOAD" : action.includes("render") ? "RENDER_FULL" : action.includes("progress") ? "TRANSCRIBE" : "SLICE_BEATS", message: action, context: details}).catch(() => {});
const checkboxColorField = {key: "boxColor", label: "确认框颜色", type: "select", options: [{value: "auto", label: "自动分配"}, {value: "purple", label: "紫色"}, {value: "blue", label: "蓝色"}, {value: "gold", label: "金色"}, {value: "white", label: "白色"}, {value: "green", label: "绿色"}, {value: "red", label: "红色"}]};
const layoutOverrides = {
  "platform-shift-line": {category: "data", label: "产品线增长", fields: [{key: "metricLabel", label: "增长指标标签", type: "text"}, {key: "count", label: "增长数量", type: "number"}, {key: "summary", label: "增长说明", type: "textarea"}, {key: "milestones", label: "产品线节点", type: "string-list"}, {key: "startLabel", label: "起点标签", type: "text"}, {key: "endLabel", label: "终点标签", type: "text"}], defaults: {count: 3, metricLabel: "产品线", milestones: ["基础能力", "产品扩展", "规模增长"]}},
  "tradeoff-reject-round": {category: "story", label: "圆形红色否定项", fields: [{key: "label", label: "否定项标签", type: "text"}, {key: "title", label: "否定项标题", type: "text"}, {key: "items", label: "圆形否定项", type: "string-list"}], defaults: {items: ["无效投入", "重复流程", "低效路径"]}},
  "recovery-progress-bars": {category: "data", label: "进度确认条", fields: [{key: "label", label: "进度标签", type: "text"}, {key: "title", label: "进度标题", type: "text"}, {key: "items", label: "进度项目", type: "string-list"}, {key: "values", label: "进度数值（%）", type: "string-list"}], defaults: {items: ["需求确认", "能力建设", "结果验证"], values: [68,54,42]}},
  "hud-glow-stack": {category: "interactive", label: "HUD 浮动发光", fields: [{key: "subLabel", label: "卡片辅助标签", type: "text"}, {key: "items", label: "HUD 卡片内容", type: "string-list"}], defaults: {subLabel: "LIVE SIGNAL", items: ["核心信号", "关键判断", "下一步动作"]}},
  "briefing-poster": {category: "story", label: "报纸简报二号", fields: [{key: "label", label: "简报标签", type: "text"}, {key: "bodyText", label: "正文内容", type: "textarea"}, {key: "items", label: "副文内容", type: "string-list"}], defaults: {bodyText: "展示可编辑的真实组件预设", items: ["核心判断", "产品路径", "下一步行动"]}},
  "rewind-milestones": {category: "story", label: "时间回溯宽版", fields: [{key: "label", label: "回溯标签", type: "text"}, {key: "title", label: "回溯标题", type: "text"}, {key: "years", label: "年份节点", type: "string-list"}, {key: "milestoneLabel", label: "节点说明", type: "text"}], defaults: {years: ["起点", "探索", "迭代", "现在", "下一步"]}},
  "flying-paper-stack": {category: "story", label: "飞入纸卡二号", fields: [{key: "headline", label: "主卡标题", type: "text"}, {key: "ghostTitle", label: "背景卡标题", type: "text"}, {key: "body", label: "卡片正文", type: "textarea"}], defaults: {ghostTitle: "阶段观察"}},
  "checklist-editorial": {category: "story", label: "编辑清单二号", fields: [{key: "label", label: "清单标签", type: "text"}, {key: "title", label: "清单标题", type: "text"}, {key: "items", label: "清单内容", type: "string-list"}], defaults: {items: ["核心价值", "执行路径", "结果验证"]}},
  "ordered-sequence": {category: "story", label: "顺序步骤", fields: [{key: "categoryTag", label: "阶段标签", type: "text"}, {key: "steps", label: "步骤列表", type: "string-list"}], defaults: {}},
  "photo-wall": {category: "story", label: "照片墙", fields: [{key: "items", label: "照片墙标签", type: "string-list"}], defaults: {}},
  "bull-bear": {category: "data", label: "多空对比", fields: [], defaults: {}},
  "data-flow": {category: "data", label: "数据分屏", fields: [{key: "leftLabel", label: "左侧标签", type: "text"}, {key: "leftValue", label: "左侧数值", type: "text"}, {key: "rightLabel", label: "右侧标签", type: "text"}, {key: "rightValue", label: "右侧数值", type: "text"}, {key: "from", label: "起始比例", type: "number"}, {key: "to", label: "结束比例", type: "number"}], defaults: {}},
  "event-timeline": {category: "data", label: "增长时间轴", fields: [{key: "years", label: "时间节点", type: "string-list"}], defaults: {years: ["起步", "迭代", "规模化", "目标"]}},
  "capital-dashboard": {category: "data", label: "资本仪表盘", fields: [{key: "marketLabel", label: "小标题1【标题内容】", type: "text"}, {key: "marketTo", label: "数值1【数字内容】", type: "number"}, {key: "marketSuffix", label: "数字单位", type: "text"}, {key: "engineeringLabel", label: "小标题2【标题内容】", type: "text"}, {key: "engineeringTo", label: "数值2【数字内容】", type: "number"}, {key: "engineeringSuffix", label: "数字单位", type: "text"}], defaults: {marketLabel: "市场规模", marketTo: 4600, marketSuffix: "亿", engineeringLabel: "增长率", engineeringTo: 25, engineeringSuffix: "%"}},
  "pivot-list": {category: "interactive", label: "规格打字机", fields: [{key: "text", label: "打字机文本", type: "textarea"}], defaults: {}},
  "reject-list": {category: "story", label: "错误清单", fields: [checkboxColorField], defaults: {boxColor: "auto"}},
  "check-progress": {category: "interactive", label: "进度确认", fields: [checkboxColorField], defaults: {boxColor: "auto"}},
  "clipboard-note": {category: "interactive", label: "剪贴板批注", fields: [checkboxColorField], defaults: {boxColor: "auto"}},
  "closing-checklist": {category: "story", label: "结尾清单", fields: [{key: "title", label: "清单标题（与核心大标题同步）", type: "text"}, {key: "items", label: "清单内容", type: "string-list"}, checkboxColorField], defaults: {title: "核心结论", boxColor: "auto"}},
  "diagonal-chips": {family: "chips", category: "interactive", label: "斜入标签", fields: [{key: "items", label: "Chip 文案", type: "string-list"}], defaults: {}},
  "floating-chips": {family: "chips", category: "interactive", label: "发光浮动标签", fields: [{key: "eyebrow", label: "芯片顶部标签", type: "text"}, {key: "chip1", label: "Chip 文案 1", type: "text"}, {key: "chip2", label: "Chip 文案 2", type: "text"}, {key: "chip3", label: "Chip 文案 3", type: "text"}], defaults: {eyebrow: "LIVE SIGNALS", chip1: "APPLE SILICON", chip2: "M-SERIES POWER", chip3: "PRO WORKFLOW"}},
  "zoom-statement": {category: "typography", label: "镜头推拉大字", fields: [{key: "headline", label: "冲击大字", type: "text"}], defaults: {}},
  "avatar-handoff": {category: "story", label: "头像交接", fields: [{key: "leftName", label: "交出方", type: "text"}, {key: "leftRole", label: "交出方头衔", type: "text"}, {key: "rightName", label: "接任方", type: "text"}, {key: "rightRole", label: "接任方头衔", type: "text"}], defaults: {}},
  "person-rank": {category: "story", label: "人物交接", fields: [{key: "leftName", label: "左侧人物", type: "text"}, {key: "rightName", label: "右侧人物", type: "text"}], defaults: {}},
  "spotlight-question": {category: "interactive", label: "浮动评论", fields: [{key: "comments", label: "评论内容", type: "text"}], defaults: {}},
};
const canonicalLayoutLabels = {"person-rank":"人物交接","event-timeline":"增长时间轴","pivot-list":"规格打字机","capital-dashboard":"资本仪表盘","cook-machine":"经营机器","engineering-return":"工程回归","market-battlefield":"市场对垒","finale-kinetic":"结尾冲击","reject-list":"错误清单","check-progress":"进度确认","diagonal-chips":"斜入标签","floating-chips":"发光浮动标签","bare-typography":"纯文字排版","chapter-card":"章节卡","logo-wordmark":"标志文字","ordered-sequence":"顺序步骤","org-chart":"组织架构","draw-line":"画线强调","progress-donut":"环形进度","avatar-handoff":"头像交接","bull-bear":"多空对比","opinion-hero":"观点主视觉","photo-wall":"照片墙","product-explosion":"产品爆炸图","route-map":"二维地图","data-flow":"数据分屏","screen-recording":"屏幕录制框","zoom-statement":"镜头推拉大字","desktop-folders":"桌面文件夹","time-rewind":"时间回溯","clipboard-note":"剪贴板批注","closing-checklist":"结尾清单","spotlight-question":"浮动评论","platform-shift-line":"产品线增长","tradeoff-reject-round":"圆形红色否定项","recovery-progress-bars":"进度确认条","hud-glow-stack":"HUD 浮动发光","briefing-poster":"报纸简报二号","rewind-milestones":"时间回溯宽版","flying-paper-stack":"飞入纸卡二号","checklist-editorial":"编辑清单二号"};
const layoutMetadata = layouts.map((key) => ({key, label: canonicalLayoutLabels[key] ?? layoutOverrides[key]?.label ?? key, category: layoutOverrides[key]?.category ?? "story", family: componentAssetsById.get(key)?.family ?? layoutOverrides[key]?.family ?? null, fields: layoutOverrides[key]?.fields ?? [], defaults: layoutOverrides[key]?.defaults ?? {}, editorSchema: componentAssetsById.get(key)?.editorSchema ?? null}));

const send = (res, status, body, type = "application/json; charset=utf-8") => {res.writeHead(status, {"Content-Type": type, "Cache-Control": "no-store"}); res.end(body);};
const projectPath = (id) => projectPaths(root, id).projectFile;
let projectWriteSerial = 0;
const writeProjectAtomically = async (id, project) => {
  const file = projectPath(id);
  const nextProject = typeof project === "string" ? JSON.parse(project) : project;
  const tempFile = file + ".tmp-" + process.pid + "-" + Date.now() + "-" + (++projectWriteSerial);
  await writeFile(tempFile, JSON.stringify(nextProject, null, 2) + "\n");
  await rename(tempFile, file);
};
const withNormalizedLayers = (project) => ({
  ...project,
  beats: project.beats.map((beat) => {
    const layers = normalizeBeatLayers(beat);
    return {...beat, layout: layers[0].layout, effectProps: layers[0].effectProps, layers};
  }),
});
const getProject = async (id) => {
  const source = JSON.parse(await readFile(projectPath(id), "utf8"));
  const storage = projectPaths(root, id);
  const captions = source.state !== "CAPTIONS_REVIEW" && existsSync(storage.captionsConfirmedFile)
    ? JSON.parse(await readFile(storage.captionsConfirmedFile, "utf8"))
    : (Array.isArray(source.captions) ? source.captions : []);
  const normalizedBase = withNormalizedLayers(ensureProjectLifecycle({...source, captions, captionReviewMerged: source.captionReviewMerged === true || source.state !== "CAPTIONS_REVIEW"}));
  const recovered = recoverOrphanedBeatRenders(normalizedBase, (beat) => [...jobs.values()].some((job) => job.kind === "beat" && job.projectId === id && job.beatId === beat.id && job.state === "running"));
  const cache = reconcileProjectRenderCache(recovered.project, (relativePath) => existsSync(join(root, relativePath)));
  const normalized = cache.project;
  if (JSON.stringify(source) !== JSON.stringify(normalized)) {
    await writeProjectAtomically(id, JSON.stringify(normalized, null, 2) + "\n");
  }
  return normalized;
};
const canonicalCaptionFile = (storage, project) => {
  if (project.state !== "CAPTIONS_REVIEW" && existsSync(storage.captionsConfirmedFile)) return storage.captionsConfirmedFile;
  if (existsSync(storage.captionsDraftFile)) return storage.captionsDraftFile;
  if (existsSync(storage.captionsConfirmedFile)) return storage.captionsConfirmedFile;
  return storage.captionsCleanedFile;
};
const readCaptionReview = async (projectId) => {
  const storage = projectPaths(root, projectId);
  const project = JSON.parse(await readFile(projectPath(projectId), "utf8"));
  const file = canonicalCaptionFile(storage, project);
  if (!existsSync(file)) throw new Error("字幕核对草稿不存在。");
  const sourceCaptions = JSON.parse(await readFile(file, "utf8"));
  const captions = project.state === "CAPTIONS_REVIEW"
    ? (project.captionReviewMerged === true ? sourceCaptions : mergeShortCaptions(sourceCaptions))
    : sourceCaptions;
  if (project.state === "CAPTIONS_REVIEW" && (project.captionReviewMerged !== true || JSON.stringify(sourceCaptions) !== JSON.stringify(captions))) {
    await writeFile(storage.captionsDraftFile, JSON.stringify(captions, null, 2) + "\n");
  }
  if (JSON.stringify(project.captions) !== JSON.stringify(captions) || project.captionReviewMerged !== true) {
    project.captions = captions;
    project.captionReviewMerged = true;
    project.updatedAt = new Date().toISOString();
    await writeProjectAtomically(projectId, project);
  }
  return {projectId, state: project.state, bilingual: project.language === "en" || project.bilingual === true || project.subtitleMode === "bilingual" || project.captionsMode === "bilingual", captions};
};
const writeCaptionDraft = async (projectId, captions) => {
  if (!Array.isArray(captions)) throw new Error("字幕草稿格式无效。");
  const storage = projectPaths(root, projectId);
  const project = JSON.parse(await readFile(projectPath(projectId), "utf8"));
  if (project.state !== "CAPTIONS_REVIEW") throw new Error("当前项目不在字幕核对阶段。");
  const normalized = captions.map((caption, index) => ({id: String(caption?.id || "subtitle-" + String(index + 1).padStart(3, "0")), start: Number(caption?.start), end: Number(caption?.end), zh: String(caption?.zh || "").trim(), en: String(caption?.en || "").trim()})).filter((caption) => Number.isFinite(caption.start) && Number.isFinite(caption.end) && caption.end > caption.start);
  await writeFile(storage.captionsDraftFile, JSON.stringify(normalized, null, 2) + "\n");
  project.captions = normalized;
  project.updatedAt = new Date().toISOString();
  await writeProjectAtomically(projectId, project);
  return normalized;
};
const confirmCaptionReview = async (projectId, mode) => {
  const storage = projectPaths(root, projectId);
  const captions = await writeCaptionDraft(projectId, (await readCaptionReview(projectId)).captions);
  await writeFile(storage.captionsConfirmedFile, JSON.stringify(captions, null, 2) + "\n");
  const jobId = "caption-confirm-" + projectId + "-" + Date.now();
  jobs.set(jobId, {state: "running", kind: "caption-confirm", projectId, stage: "semantic_slicing", progress: 60, message: "正在按已确认字幕生成分拍…"});
  stage2ProduceFromConfirmed({projectId, onProgress: (progress) => { const current = jobs.get(jobId) || {}; jobs.set(jobId, {...current, state: "running", kind: "caption-confirm", projectId, ...progress}); }}).then(async () => {
    if (mode === "auto") {
      const fullJobId = await startFullRender(projectId);
      jobs.set(jobId, {state: "done", kind: "caption-confirm", projectId, stage: "rendering_beats", progress: 100, nextJobId: fullJobId, message: "字幕已确认，正在全自动渲染成片…"});
      return;
    }
    jobs.set(jobId, {state: "done", kind: "caption-confirm", projectId, stage: "done", progress: 100, message: "字幕已确认，智能分拍已完成。"});
  }).catch((error) => jobs.set(jobId, {state: "failed", kind: "caption-confirm", projectId, error: error.stack || error.message}));
  return jobId;
};
const isProjectRunning = (projectId) => [...jobs.values()].some((job) => job.projectId === projectId && ["running", "uploading"].includes(job.state));
const listProjects = (options) => listProjectSummaries(root, options);
const validProject = (project) => project && typeof project.projectId === "string" && Number.isFinite(project.fps) && Array.isArray(project.beats) && Array.isArray(project.captions) && project.beats.every((beat) => typeof beat.id === "string" && Number.isFinite(beat.start) && Number.isFinite(beat.end) && beat.end > beat.start && layouts.includes(beat.layout) && (beat.layers === undefined || validEffectLayers(beat.layers, layoutSet)));
const segmentCount = (projectId) => {const dir = join(root, "out", `project-segments-${projectId}`); if (!existsSync(dir)) return 0; return readdirSync(dir).filter((file) => file.endsWith(".mp4") && file !== "merged-video.mp4").length;};

const startEnglishCaptionTranslation = async (projectId) => {
  const active = [...jobs.values()].find((job) => job.kind === "subtitle-translation" && job.projectId === projectId && job.state === "running");
  if (active) return active.jobId;
  const project = await getProject(projectId);
  if (!project.captions?.length) throw new Error("当前项目没有可翻译的字幕。");
  if (project.captions.every((caption) => String(caption.en || "").trim())) {
    const jobId = "subtitle-translation-ready-" + projectId + "-" + Date.now();
    jobs.set(jobId, {state: "done", kind: "subtitle-translation", projectId, jobId, message: "英文字幕已就绪"});
    return jobId;
  }
  const storage = projectPaths(root, projectId);
  if (!existsSync(storage.audioFile)) throw new Error("项目音频缺失，无法生成英文字幕。");
  const jobId = "subtitle-translation-" + projectId + "-" + Date.now();
  const outputFile = join(storage.sourceDir, "captions.en.json");
  jobs.set(jobId, {state: "running", kind: "subtitle-translation", projectId, jobId, progress: 1, message: "正在用 faster-whisper 生成英文字幕..."});
  logWork(projectId, "subtitle-translation-started", {engine: "faster-whisper"});
  runFasterTranscription({
    audioPath: storage.audioFile,
    outputPath: outputFile,
    language: "zh",
    task: "translate",
    onProgress: ({count}) => {
      const current = jobs.get(jobId);
      if (current?.state === "running") jobs.set(jobId, {...current, progress: Math.min(95, Number(current.progress || 1) + 1), captionCount: count, message: "正在用 faster-whisper 生成英文字幕... 已生成 " + count + " 句"});
    },
  }).then(async (translatedRows) => {
    try {
      const translated = captionsToWhisperTranscript(translatedRows, "en");
      const merged = mergeWhisperCaptions(project.captions, translated, "zh");
      const latest = await getProject(projectId);
      latest.captions = latest.captions.map((caption, index) => ({...caption, en: String(caption.en || "").trim() || String(merged[index]?.en || "").trim()}));
      latest.subtitleTranslation = {status: "ready", completedAt: new Date().toISOString(), source: "faster-whisper-translate"};
      latest.updatedAt = new Date().toISOString();
      if (latest.state !== "CAPTIONS_REVIEW") await writeFile(storage.captionsConfirmedFile, JSON.stringify(latest.captions, null, 2) + "\n");
      await writeProjectAtomically(projectId, latest);
      jobs.set(jobId, {state: "done", kind: "subtitle-translation", projectId, jobId, progress: 100, message: "英文字幕已补齐"});
      logWork(projectId, "subtitle-translation-completed", {captionCount: latest.captions.length});
    } catch (error) {
      jobs.set(jobId, {state: "failed", kind: "subtitle-translation", projectId, jobId, error: error.stack || error.message});
      logWork(projectId, "subtitle-translation-failed", {error: error.message});
    }
  }).catch((error) => {
    jobs.set(jobId, {state: "failed", kind: "subtitle-translation", projectId, jobId, error: error.stack || error.message});
    logWork(projectId, "subtitle-translation-failed", {error: error.message});
  });
  return jobId;
};

const openProjectRenders = async (projectId) => {
  const storage = await createProjectStorage(root, projectId);
  const explorer = spawn("explorer.exe", [storage.rendersDir], {detached: true, stdio: "ignore", windowsHide: true});
  explorer.on("error", (error) => logger.error({traceId: "open-renders-" + projectId + "-" + Date.now(), projectId, stage: "RENDER_FULL", message: "open-renders-failed", errorStack: error.stack || error.message}).catch(() => {}));
  explorer.unref();
  return storage.rendersDir;
};

const recoverCompletedFullRender = async (projectId, project) => {
  const currentProject = project || await getProject(projectId);
  const storage = projectPaths(root, projectId);
  const legacyOutput = join(root, "out", projectId + "-initial.mp4");
  const output = existsSync(storage.finalRenderFile) ? storage.finalRenderFile : legacyOutput;
  if (!existsSync(output)) return null;
  const outputInfo = await stat(output);
  if (!outputInfo.isFile() || outputInfo.size <= 0) return null;
  const allBeatsReady = currentProject.beats.length > 0 && currentProject.beats.every((beat) => beat.render?.status === "ready" && Number.isFinite(Date.parse(beat.render?.renderedAt || "")));
  const latestBeatRenderMs = allBeatsReady ? Math.max(...currentProject.beats.map((beat) => Date.parse(beat.render.renderedAt))) : 0;
  const projectUpdatedMs = Number.isFinite(Date.parse(currentProject.updatedAt || "")) ? Date.parse(currentProject.updatedAt) : 0;
  if (!allBeatsReady || outputInfo.mtimeMs < Math.max(projectUpdatedMs, latestBeatRenderMs)) return null;
  const renderedAt = new Date(outputInfo.mtimeMs).toISOString();
  const alreadyCompleted = currentProject.render?.status === "completed" && currentProject.render?.outputPath === output && currentProject.render?.progress === 100;
  if (!alreadyCompleted) {
    const latest = await getProject(projectId);
    latest.render = {...latest.render, status: "completed", progress: 100, outputPath: output, renderedAt, error: null};
    await writeProjectAtomically(projectId, latest);
    await logger.info({traceId: "full-recovery-" + projectId + "-" + Date.now(), projectId, stage: "RENDER_FULL", message: "full-render-recovered", context: {output, size: outputInfo.size, renderedAt}});
  }
  return {state: "done", kind: "full", projectId, progress: 100, message: "已恢复已完成的全片合成", output: "/recovered-output/" + projectId, file: output};
};

const fullRenderMessage = (status, elapsedSeconds = 0) => {
  const cached = Number(status.cachedBeats) || 0;
  const pending = Number(status.pendingBeats) || 0;
  if (status.stage === "checking_cache") return "[1/3] 检查缓存：已复用 " + cached + " 个单拍，待渲染 " + pending + " 个单拍";
  if (status.stage === "rendering_beats") return "[2/3] 正在逐拍渲染：" + (status.currentBeatId || "准备中") + " (" + (Number(status.currentBeatIndex) || 0) + "/" + pending + ") · 耗时 " + elapsedSeconds + "s...";
  if (status.stage === "concatenating" || status.stage === "injecting_audio_subs") return "[3/3] FFmpeg 正在拼接全片音视频轨...";
  return status.message || "正在合成全片...";
};

const startFullRender = async (projectId) => {
  const project = await getProject(projectId);
  const recovered = await recoverCompletedFullRender(projectId, project);
  if (recovered) {
    const jobId = "full-recovered-" + projectId + "-" + Date.now();
    jobs.set(jobId, {...recovered, jobId});
    return jobId;
  }
  const jobId = "full-" + projectId + "-" + Date.now();
  const storage = await createProjectStorage(root, projectId);
  const output = storage.finalRenderFile;
  const cachedBeatIds = project.beats.filter((beat) => beat.render?.status === "ready" && beat.render?.previewPath && existsSync(join(root, beat.render.previewPath))).map((beat) => beat.id);
  const pendingBeatIds = project.beats.filter((beat) => !cachedBeatIds.includes(beat.id)).map((beat) => beat.id);
  const cachedBeats = cachedBeatIds.length;
  const pendingBeats = pendingBeatIds.length;
  jobs.set(jobId, {
    state: "running", kind: "full", projectId, stage: "checking_cache",
    totalBeats: project.beats.length, cachedBeats, pendingBeats,
    currentBeatIndex: 0, currentBeatId: null, currentBeatProgress: 0,
    beatIds: project.beats.map((beat) => beat.id), cachedBeatIds, pendingBeatIds,
    overallProgress: project.beats.length ? Math.round(5 + cachedBeats / project.beats.length * 75) : 5, progress: project.beats.length ? Math.round(5 + cachedBeats / project.beats.length * 75) : 5,
    startedAt: Date.now(),
    message: "[1/3] 检查缓存：已复用 " + cachedBeats + " 个单拍，待渲染 " + pendingBeats + " 个单拍",
    output: "/output/" + jobId, file: output,
  });
  await logger.info({traceId: jobId, projectId, stage: "RENDER_FULL", message: "full-assembly-started", context: {beatCount: project.beats.length, cachedBeats, pendingBeats, projectFile: projectPath(projectId)}});
  const child = spawn(process.execPath, [join(root, "scripts", "render-project-full.cjs"), projectPath(projectId), output], {cwd: root, windowsHide: true});
  let log = "";
  let stdoutBuffer = "";
  const absorbProgress = (chunk) => {
    const text = String(chunk);
    log = (log + text).slice(-8000);
    stdoutBuffer += text;
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("FULL_PROGRESS ")) continue;
      try {
        const progress = JSON.parse(line.slice("FULL_PROGRESS ".length));
        const current = jobs.get(jobId) || {};
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - Number(current.startedAt || Date.now())) / 1000));
        jobs.set(jobId, {...current, ...progress, state: "running", kind: "full", projectId, elapsedSeconds, message: fullRenderMessage(progress, elapsedSeconds), progress: Number(progress.overallProgress) || current.progress || 0, output: "/output/" + jobId, file: output});
      } catch (_) {}
    }
  };
  child.stdout.on("data", absorbProgress);
  child.stderr.on("data", (chunk) => log = (log + String(chunk)).slice(-8000));
  child.on("error", async (error) => {jobs.set(jobId, {...jobs.get(jobId), state: "failed", error: error.message}); await logger.error({traceId: jobId, projectId, stage: "RENDER_FULL", message: "full-assembly-failed", errorStack: error.stack, command: "node render-project-full.cjs"});});
  child.on("close", async (code) => {
    if (code === 0) {
      const latest = await getProject(projectId);
      latest.render = {...latest.render, status: "completed", progress: 100, outputPath: output, renderedAt: new Date().toISOString(), error: null};
      await writeProjectAtomically(projectId, JSON.stringify(latest, null, 2) + "\n");
      jobs.set(jobId, {...jobs.get(jobId), state: "done", kind: "full", stage: "done", currentBeatProgress: 100, overallProgress: 100, progress: 100, message: "全片已完成拼接与音频封装", output: "/output/" + jobId, file: output});
      await logger.info({traceId: jobId, projectId, stage: "RENDER_FULL", message: "full-assembly-completed", context: {output}});
      return;
    }
    const error = log || "Full assembly exited with " + code;
    jobs.set(jobId, {...jobs.get(jobId), state: "failed", error});
    await logger.error({traceId: jobId, projectId, stage: "RENDER_FULL", message: "full-assembly-failed", errorStack: error, command: "node render-project-full.cjs"});
  });
  return jobId;
};

const renderPreviewCatalog = () => "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>组件动效验收库</title><style>body{margin:0;background:#090d16;color:#f3f4f6;font:14px Inter,Microsoft YaHei,Arial,sans-serif}main{max-width:1480px;margin:auto;padding:34px}h1{margin:0;font-size:26px}.sub{margin:9px 0 28px;color:#94a3b8}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px}.card{overflow:hidden;border:1px solid #26384f;border-radius:8px;background:#0d1520}.card video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#000}.meta{padding:12px 14px}.meta strong{display:block;font-size:15px}.meta span{display:block;margin-top:4px;color:#8fa2b9;font-family:ui-monospace,monospace;font-size:12px}.tag{display:inline-block;margin-top:9px;padding:3px 7px;border:1px solid #00f2fe;color:#bdf7ff;font-size:11px}</style></head><body><main><h1>组件动效验收库</h1><p class=\"sub\">每张卡片均为真实 Remotion 导出的 4 秒短动画：自动播放两轮，悬停或点击重播。</p><section class=\"grid\">"+layoutMetadata.map((item)=>"<article class=\"card\"><video src=\"/preview-catalog-animation/"+item.key+".mp4?v=20260912-headerfix\" muted playsinline preload=\"metadata\" data-preview-loop=\"0\"></video><div class=\"meta\"><strong>"+item.label+"</strong><span>"+item.key+"</span><i class=\"tag\">Real Remotion · 2 loops</i></div></article>").join("")+"</section><script>document.querySelectorAll('video[data-preview-loop]').forEach(function(video){function replay(){video.dataset.previewLoop='0';video.currentTime=0;video.play().catch(function(){});}video.addEventListener('loadeddata',replay,{once:true});video.addEventListener('ended',function(){var count=Number(video.dataset.previewLoop||0);if(count<1){video.dataset.previewLoop=String(count+1);video.currentTime=0;video.play().catch(function(){});return;}video.currentTime=Math.max(0,(video.duration||0)-.04);});video.addEventListener('pointerenter',replay);video.addEventListener('click',replay);});</script></main></body></html>";

const page = buildPage(layoutMetadata);

createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  try {
    if (req.method === "GET" && url.pathname === "/admin/components") {if(!isLocalAdmin(req)) return send(res,403,"Local super-admin access required.","text/plain"); return send(res,200,buildAdminComponentsPage(),"text/html; charset=utf-8");}
    if (req.method === "GET" && url.pathname === "/admin-components.js") {if(!isLocalAdmin(req)) return send(res,403,"Local super-admin access required.","text/plain"); const file=join(root,"public","admin-components.js");if(!existsSync(file))return send(res,404,"Admin bundle missing","text/plain");return send(res,200,await readFile(file),"application/javascript; charset=utf-8");}
    if (req.method === "GET" && url.pathname === "/api/admin/components") {if(!isLocalAdmin(req))return send(res,403,"Local super-admin access required.","text/plain");return send(res,200,JSON.stringify(getComponentRegistrySync(root)));}
    const adminComponentFamilyRoute = url.pathname.match(/^\/api\/admin\/components\/([a-z0-9-]+)\/family$/);
    if (adminComponentFamilyRoute && req.method === "PUT") {if(!isLocalAdmin(req))return send(res,403,"Local super-admin access required.","text/plain");let body="";for await(const chunk of req)body+=chunk;const payload=body?JSON.parse(body):{};const component=await moveComponentToFamily(root,adminComponentFamilyRoute[1],payload.family);componentAssetsById.set(component.id,component);const metadata=layoutMetadata.find((entry)=>entry.key===component.id);if(metadata)metadata.family=component.family;await logger.info({traceId:"component-family-"+component.id+"-"+Date.now(),projectId:"design-system",stage:"DESIGN_SYSTEM",message:"component-family-moved",context:{componentId:component.id,family:component.family}});return send(res,200,JSON.stringify(component));}
    const adminComponentRoute = url.pathname.match(/^\/api\/admin\/components\/([a-z0-9-]+)$/);
    if (adminComponentRoute && req.method === "GET") {if(!isLocalAdmin(req))return send(res,403,"Local super-admin access required.","text/plain");const component=getComponentRegistrySync(root).components.find((entry)=>entry.id===adminComponentRoute[1]);return component?send(res,200,JSON.stringify(component)):send(res,404,"Unknown component","text/plain");}
    if (adminComponentRoute && req.method === "PUT") {if(!isLocalAdmin(req))return send(res,403,"Local super-admin access required.","text/plain");let body="";for await(const chunk of req)body+=chunk;const payload=body?JSON.parse(body):{};const component=await updateComponentPreset(root,adminComponentRoute[1],payload);await logger.info({traceId:"component-preset-"+component.id+"-"+Date.now(),projectId:"design-system",stage:"DESIGN_SYSTEM",message:"component-preset-updated",context:{componentId:component.id,version:component.version}});return send(res,200,JSON.stringify(component));}
    if (req.method === "GET" && url.pathname === "/preview-catalog") return send(res, 200, renderPreviewCatalog(), "text/html; charset=utf-8");
    const animatedCatalogAsset = url.pathname.match(/^\/preview-catalog-animation\/([a-z0-9-]+)\.mp4$/);
    if (animatedCatalogAsset && req.method === "GET") {
      const layout = animatedCatalogAsset[1];
      if (!layoutSet.has(layout)) return send(res, 404, "Unknown preview layout", "text/plain");
      const file = join(root, "public", "preview-catalog-animation", layout + ".mp4");
      if (!existsSync(file)) return send(res, 404, "Preview not rendered", "text/plain");
      const info = await stat(file);
      res.writeHead(200, {"Content-Type": "video/mp4", "Content-Length": info.size, "Accept-Ranges": "bytes", "Cache-Control": "no-store"});
      return createReadStream(file).pipe(res);
    }
    if (req.method === "GET" && url.pathname === "/") return send(res, 200, page, "text/html; charset=utf-8");
    if (req.method === "GET" && url.pathname === "/studio-live-preview.html") return send(res, 200, "<!doctype html><html><body style=\"margin:0;background:#000\"><div id=\"root\"></div><script src=\"/studio-live-preview.js\"></script></body></html>", "text/html; charset=utf-8");
    if (req.method === "GET" && url.pathname === "/studio-live-preview.js") {const file=join(root,"public","studio-live-preview.js"); if(!existsSync(file)) return send(res,404,"Preview bundle missing","text/plain"); return send(res,200,await readFile(file),"application/javascript; charset=utf-8");}
    const projectMedia=url.pathname.match(/^\/project-media\/([a-z0-9-]+)\/(raw\.mp4|audio\.wav)$/);
    if(projectMedia&&req.method==="GET"){const file=join(root,"public","project-media",projectMedia[1],projectMedia[2]);if(!existsSync(file))return send(res,404,"Not found","text/plain");const info=await stat(file);const range=req.headers.range;if(!range){res.writeHead(200,{"Content-Type":projectMedia[2].endsWith("mp4")?"video/mp4":"audio/wav","Content-Length":info.size,"Accept-Ranges":"bytes"});return createReadStream(file).pipe(res)}const match=/bytes=(\d*)-(\d*)/.exec(range);const start=Number(match?.[1]||0),end=Math.min(Number(match?.[2]||info.size-1),info.size-1);res.writeHead(206,{"Content-Type":projectMedia[2].endsWith("mp4")?"video/mp4":"audio/wav","Content-Length":end-start+1,"Content-Range":`bytes ${start}-${end}/${info.size}`,"Accept-Ranges":"bytes"});return createReadStream(file,{start,end}).pipe(res)}
    if (req.method === "GET" && url.pathname === "/api/layouts") return send(res, 200, JSON.stringify(layoutMetadata));
    if (req.method === "GET" && url.pathname === "/api/projects") return send(res, 200, JSON.stringify(await listProjects({sortBy: url.searchParams.get("sortBy") || "updatedAt", order: url.searchParams.get("order") || "desc"})));
    const captionReviewRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/captions-review$/);
    if (captionReviewRoute && req.method === "GET") return send(res, 200, JSON.stringify(await readCaptionReview(captionReviewRoute[1])));
    const captionDraftRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/captions-draft$/);
    if (captionDraftRoute && req.method === "PUT") {let body=""; for await(const chunk of req) body += chunk; return send(res, 200, JSON.stringify({captions: await writeCaptionDraft(captionDraftRoute[1], JSON.parse(body))}));}
    const confirmCaptionsRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/confirm-captions$/);
    if (confirmCaptionsRoute && req.method === "POST") {let body=""; for await(const chunk of req) body += chunk; const payload=body ? JSON.parse(body) : {}; const mode=payload.mode === "auto" ? "auto" : "studio"; return send(res,202,JSON.stringify({jobId:await confirmCaptionReview(confirmCaptionsRoute[1],mode),mode}));}
    const abandonRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/unconfirmed$/);
    if (abandonRoute && req.method === "DELETE") {const project=JSON.parse(await readFile(projectPath(abandonRoute[1]),"utf8")); if(project.state !== "CAPTIONS_REVIEW") return send(res,409,"Only an unconfirmed project can be abandoned.","text/plain"); await deleteProject(root,abandonRoute[1],{isRunning:isProjectRunning}); return send(res,200,JSON.stringify({projectId:abandonRoute[1],abandoned:true}));}
    const projectMatch = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)$/);
    if (projectMatch && req.method === "GET") return send(res, 200, JSON.stringify(await getProject(projectMatch[1])));
    if (projectMatch && req.method === "PUT") {let body=""; for await(const chunk of req) body += chunk; const incoming = JSON.parse(body); if(!validProject(incoming)) return send(res,400,"Invalid project.","text/plain"); const project = mergeProjectEdits(await getProject(projectMatch[1]), incoming); if(project.state !== "CAPTIONS_REVIEW") await writeFile(projectPaths(root, projectMatch[1]).captionsConfirmedFile, JSON.stringify(project.captions, null, 2) + "\n"); await writeProjectAtomically(projectMatch[1], `${JSON.stringify(project,null,2)}\n`); return send(res,200,JSON.stringify(project));}
    if (projectMatch && req.method === "PATCH") {let body=""; for await(const chunk of req) body += chunk; const payload=JSON.parse(body); const project=await renameProject(root, projectMatch[1], payload.name); await logger.info({traceId: "trace-"+Date.now(), projectId: projectMatch[1], stage: "UPLOAD", message: "project-renamed", context: {name: project.name}}); return send(res,200,JSON.stringify(project));}
    if (projectMatch && req.method === "DELETE") {await deleteProject(root, projectMatch[1], {isRunning: isProjectRunning}); await logger.info({traceId: "trace-"+Date.now(), projectId: projectMatch[1], stage: "UPLOAD", message: "project-deleted"}); return send(res,200,JSON.stringify({projectId: projectMatch[1]}));}
    const cleanupMatch = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/previews\/clean$/);
    if (cleanupMatch && req.method === "POST") {const result=await cleanProjectPreviews(root, cleanupMatch[1]); await logger.info({traceId: "trace-"+Date.now(), projectId: cleanupMatch[1], stage: "RENDER_BEAT", message: "project-previews-cleaned"}); return send(res,200,JSON.stringify(result));}
    const settingsMatch = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/settings$/);
    if (settingsMatch && req.method === "GET") {
      const project = await getProject(settingsMatch[1]);
      return send(res, 200, JSON.stringify(project.globalSettings));
    }
    if (settingsMatch && req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const current = await getProject(settingsMatch[1]);
      const settings = mergeGlobalSettings(JSON.parse(body));
      const changed = JSON.stringify(current.globalSettings) !== JSON.stringify(settings);
      const beats = changed ? current.beats.map((beat) => ({...beat, render: {...beat.render, revision: beat.render.revision + 1, status: "stale", previewPath: null, renderedAt: null, error: null}})) : current.beats;
      const project = {...current, globalSettings: settings, beats, render: changed ? {...current.render, status: "stale", progress: 0, outputPath: null, renderedAt: null, error: null} : current.render};
      await writeProjectAtomically(settingsMatch[1], `${JSON.stringify(project, null, 2)}\n`);
      await logger.info({traceId: `trace-${Date.now()}`, projectId: settingsMatch[1], stage: "AUTO_LAYOUT", message: "global-settings-updated", context: {changed, settings}});
      return send(res, 200, JSON.stringify(project));
    }
    const auto = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/auto-match$/);
    if (auto && req.method === "POST") {const current = await getProject(auto[1]); const project = autoMatchProject({...current, beats: hydrateBeatDrafts(current.beats, current.captions)}); await writeProjectAtomically(auto[1], `${JSON.stringify(project,null,2)}
`); return send(res,200,JSON.stringify(project));}
    const preflight = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/beats\/([a-z0-9-]+)\/preflight$/);
    if (preflight && req.method === "POST") {
      const project = await getProject(preflight[1]);
      const beat = project.beats.find((item) => item.id === preflight[2]);
      if (!beat) return send(res, 404, "Unknown beat.", "text/plain");
      const integrity = validateBeatIntegrity(beat, project);
      return send(res, 200, JSON.stringify({valid: integrity.valid, beatId: beat.id, diagnostics: integrity.errors}));
    }
    const render = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/render\/([a-z0-9-]+)$/);
    if (render && req.method === "POST") {
      let project = await getProject(render[1]);
      const beat = project.beats.find((item) => item.id === render[2]);
      if (!beat) return send(res, 404, "Unknown beat.", "text/plain");
      const renderSlot = render[1] + ":" + render[2];
      const activeJobId = activeBeatRenders.get(renderSlot);
      if (activeJobId) return send(res, 202, JSON.stringify({jobId: activeJobId, reused: true}));

      const integrity = validateBeatIntegrity(beat, project);
      if (!integrity.valid) {
        const reason = integrity.errors.map((item) => item.message).join("；");
        const error = "预渲染质检未通过：" + reason;
        project = updateBeatRender(project, beat.id, beat.render.revision, {status: "failed", previewPath: null, renderedAt: null, error});
        await writeProjectAtomically(render[1], JSON.stringify(project, null, 2) + "\n");
        await logger.error({traceId: "gate-" + Date.now(), projectId: render[1], stage: "PRE_RENDER_GATE", beatId: beat.id, message: "single-beat-gate-blocked", errorStack: error, context: {language: integrity.isEn ? "en" : "zh", errors: integrity.errors}});
        return send(res, 422, JSON.stringify({error, code: "PRE_RENDER_GATE_BLOCKED", diagnostics: integrity.errors}));
      }

      const revision = beat.render.revision;
      const contentHash = renderContentHash(project, beat);
      const canonicalOutput = currentAssetPath(render[1], beat);
      const relativeOutput = existsSync(join(root, canonicalOutput)) ? canonicalOutput.replace(/\.mp4$/i, "-" + Date.now() + ".mp4") : canonicalOutput;
      const output = join(root, relativeOutput);
      const frames = Math.floor(beat.start * project.fps) + "-" + (Math.ceil(beat.end * project.fps) - 1);
      const totalFrames = Math.ceil(beat.end * project.fps) - Math.floor(beat.start * project.fps);
      const command = "remotion render src/index.ts ProjectEditor " + output + " --frames=" + frames;
      const jobId = "beat-" + render[1] + "-" + render[2] + "-" + revision + "-" + Date.now();
      const remotionArgs = ["render", "src/index.ts", "ProjectEditor", output, "--props=" + projectPath(render[1]), "--frames=" + frames, "--codec=h264", "--crf=20", "--pixel-format=yuv420p", "--concurrency=2", "--x264-preset=veryfast"];
      activeBeatRenders.set(renderSlot, jobId);
      try {
        await mkdir(dirname(output), {recursive: true});
        project = updateBeatRender(project, beat.id, revision, {status: "rendering", previewPath: null, renderedAt: null, error: null});
        await writeProjectAtomically(render[1], JSON.stringify(project, null, 2) + "\n");
      } catch (error) {
        if (activeBeatRenders.get(renderSlot) === jobId) activeBeatRenders.delete(renderSlot);
        throw error;
      }
      jobs.set(jobId, {state: "running", kind: "beat", projectId: render[1], beatId: beat.id, progress: 0, percentage: 0, currentFrame: 0, totalFrames, fps: 0, startedAt: Date.now(), message: "正在初始化单拍渲染...", attempt: 0, maxRetries: 1});
      await logger.info({traceId: jobId, projectId: render[1], stage: "RENDER_BEAT", beatId: beat.id, frames, message: "single-beat-render-started", command, context: {revision, layout: beat.layout, effectProps: beat.effectProps}});

      const terminateProcessTree = (child) => {
        if (!child) return;
        if (process.platform === "win32" && child.pid) {
          const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {windowsHide: true});
          killer.unref();
          return;
        }
        child.kill();
      };
      const sampleCpuSeconds = (pid) => new Promise((resolve) => {
        if (process.platform !== "win32" || !pid) return resolve(null);
        const cpu = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "(Get-Process -Id " + pid + " -ErrorAction SilentlyContinue).CPU"], {windowsHide: true});
        let outputText = "";
        cpu.stdout.on("data", (chunk) => { outputText += String(chunk); });
        cpu.on("close", () => { const value = Number.parseFloat(outputText); resolve(Number.isFinite(value) ? value : null); });
        cpu.on("error", () => resolve(null));
      });
      let settled = false;
      const releaseRenderSlot = () => { if (activeBeatRenders.get(renderSlot) === jobId) activeBeatRenders.delete(renderSlot); };
      const finishFailure = async (error, message) => {
        if (settled) return;
        settled = true;
        const latest = await getProject(render[1]);
        const saved = updateBeatRender(latest, beat.id, revision, {status: "failed", previewPath: null, renderedAt: null, error});
        await writeProjectAtomically(render[1], JSON.stringify(saved, null, 2) + "\n");
        releaseRenderSlot();
        jobs.set(jobId, {...(jobs.get(jobId) || {}), state: "failed", kind: "beat", projectId: render[1], beatId: beat.id, error, message});
        await logger.error({traceId: jobId, projectId: render[1], stage: "RENDER_BEAT", beatId: beat.id, frames, message: "single-beat-render-failed", errorStack: error, command});
      };
      const launchAttempt = (attempt) => {
        if (settled) return;
        const child = spawn(join(root, "node_modules", ".bin", "remotion.CMD"), remotionArgs, {cwd: root, windowsHide: true, shell: true});
        let log = "";
        let lastFrame = 0;
        let lastFrameAt = Date.now();
        let lastProgressAt = Date.now();
        let previousCpuSeconds = null;
        let stalled = false;
        let sampling = false;
        const watchdog = setInterval(async () => {
          if (settled || stalled || sampling) return;
          sampling = true;
          const currentCpuSeconds = await sampleCpuSeconds(child.pid);
          sampling = false;
          if (shouldAbortForStall({now: Date.now(), lastProgressAt, previousCpuSeconds, currentCpuSeconds, stallMs: 45000})) {
            stalled = true;
            jobs.set(jobId, {...(jobs.get(jobId) || {}), state: "running", attempt, message: "45 秒无新增帧输出，正在启动自动恢复..."});
            await logger.error({traceId: jobId, projectId: render[1], stage: "RENDER_BEAT", beatId: beat.id, frames, message: "single-beat-watchdog-stalled", errorStack: log, command, context: {attempt, previousCpuSeconds, currentCpuSeconds}});
            terminateProcessTree(child);
            return;
          }
          if (Number.isFinite(currentCpuSeconds)) previousCpuSeconds = currentCpuSeconds;
        }, 5000);
        child.stdout.on("data", (chunk) => {
          if (settled || stalled) return;
          const outputText = String(chunk);
          log = (log + outputText).slice(-4000);
          const match = outputText.match(/(?:rendered|rendering|frames?)[^\d]*(\d+)\s*\/\s*(\d+)/i) || outputText.match(/(\d+)\s*\/\s*(\d+)\s*(?:frames?|fr)/i);
          if (!match) return;
          const currentFrame = Number(match[1]);
          const renderedFrames = Number(match[2]);
          const now = Date.now();
          if (currentFrame > lastFrame) lastProgressAt = now;
          const elapsed = Math.max(0.1, (now - (jobs.get(jobId)?.startedAt || now)) / 1000);
          const fps = Math.max(0, (currentFrame - lastFrame) / Math.max(0.1, (now - lastFrameAt) / 1000));
          lastFrame = currentFrame;
          lastFrameAt = now;
          const percentage = Math.min(99, Math.floor(currentFrame / Math.max(1, renderedFrames) * 100));
          const remainingSeconds = fps > 0 ? Math.max(0, Math.round((renderedFrames - currentFrame) / fps)) : null;
          jobs.set(jobId, {...(jobs.get(jobId) || {}), state: "running", attempt, currentFrame, totalFrames: renderedFrames, percentage, progress: percentage, fps: Math.round(fps), elapsedSeconds: Math.floor(elapsed), remainingSeconds, message: "正在生成帧: " + currentFrame + " / " + renderedFrames});
        });
        child.stderr.on("data", (chunk) => { log = (log + String(chunk)).slice(-4000); });
        child.on("error", async (error) => {
          clearInterval(watchdog);
          if (stalled) return;
          await finishFailure(error.stack || error.message, "单拍渲染失败");
        });
        child.on("close", async (code) => {
          clearInterval(watchdog);
if (stalled) {
            if (attempt < 1) {
              jobs.set(jobId, {...(jobs.get(jobId) || {}), state: "running", attempt: attempt + 1, message: "检测到静默卡死，正在自动重试（1/1）..."});
              await logger.info({traceId: jobId, projectId: render[1], stage: "RENDER_BEAT", beatId: beat.id, frames, message: "single-beat-watchdog-retry", command, context: {attempt: attempt + 1}});
              launchAttempt(attempt + 1);
              return;
            }
            const diagnosis = diagnoseRenderFailure(log);
            await finishFailure("连续 30 秒无新增帧，自动重试后仍失败。\n" + log, diagnosis);
            return;
          }
          try {
            if (code === 0) {
              const latest = await getProject(render[1]);
              const saved = updateBeatRender(latest, beat.id, revision, {status: "ready", previewPath: relativeOutput, renderedVideoPath: relativeOutput, contentHash, renderedAt: new Date().toISOString(), error: null});
              await writeProjectAtomically(render[1], JSON.stringify(saved, null, 2) + "\n");
              settled = true;
              releaseRenderSlot();
              jobs.set(jobId, {...(jobs.get(jobId) || {}), state: "done", kind: "beat", projectId: render[1], beatId: beat.id, progress: 100, percentage: 100, message: "当前 beat 预览完成", output: "/project-asset/" + render[1] + "/" + beat.id});
              await logger.info({traceId: jobId, projectId: render[1], stage: "RENDER_BEAT", beatId: beat.id, frames, message: "single-beat-render-completed", command, context: {output: relativeOutput, revision, attempt}});
              return;
            }
            await finishFailure(log || "Remotion exited with " + code, diagnoseRenderFailure(log));
          } catch (error) {
            await finishFailure(error.stack || error.message || String(error), "渲染完成后缓存核验失败");
          }
        });
      };
      launchAttempt(0);
      return send(res, 202, JSON.stringify({jobId}));
    }
    const asset = url.pathname.match(/^\/project-asset\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
    if (asset && req.method === "GET") {
      const project = await getProject(asset[1]);
      const beat = project.beats.find((item) => item.id === asset[2]);
      const relativePath = beat?.render?.renderedVideoPath || beat?.renderedVideoPath || beat?.render?.previewPath;
      const file = relativePath ? join(root, relativePath) : null;
      if (!file || !existsSync(file)) return send(res, 404, "Not found", "text/plain");
      const info = await stat(file);
      const range=req.headers.range;
      if(!range){
        res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":info.size,"Accept-Ranges":"bytes","Cache-Control":"no-store"});
        return createReadStream(file).pipe(res);
      }
      const match=/bytes=(\d*)-(\d*)/.exec(range);
      const start=Number(match?.[1]||0);
      const end=Math.min(Number(match?.[2]||info.size-1),info.size-1);
      if(!match||!Number.isFinite(start)||start<0||start>=info.size||end<start){
        res.writeHead(416,{"Content-Range":"bytes */"+info.size,"Accept-Ranges":"bytes"});
        return res.end();
      }
      res.writeHead(206,{"Content-Type":"video/mp4","Content-Length":end-start+1,"Content-Range":`bytes ${start}-${end}/${info.size}`,"Accept-Ranges":"bytes","Cache-Control":"no-store"});
      return createReadStream(file,{start,end}).pipe(res);
    }
    const statusRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/render-status$/);
    if (statusRoute && req.method === "GET") {const matches=[...jobs.values()].filter((job)=>job.kind==="full"&&job.projectId===statusRoute[1]);const latest=matches.at(-1);if(latest)return send(res,200,JSON.stringify(latest));const project=await getProject(statusRoute[1]);const recovered=await recoverCompletedFullRender(statusRoute[1],project);if(recovered)return send(res,200,JSON.stringify(recovered));const complete=Math.min(project.beats.length,segmentCount(statusRoute[1]));if(complete>0)return send(res,200,JSON.stringify({state:"running",kind:"full",projectId:statusRoute[1],stage:"checking_cache",totalBeats:project.beats.length,cachedBeats:complete,pendingBeats:Math.max(0,project.beats.length-complete),currentBeatIndex:0,currentBeatId:null,currentBeatProgress:0,overallProgress:renderProgress(complete,project.beats.length),progress:renderProgress(complete,project.beats.length),message:`检测到已完成 ${complete} / ${project.beats.length} 个单拍，正在恢复生产状态…`}));return send(res,200,JSON.stringify({state:"idle"}));}
    const translationRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/translate-captions$/);
    if (translationRoute && req.method === "POST") return send(res,202,JSON.stringify({jobId:await startEnglishCaptionTranslation(translationRoute[1])}));
    const full = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/render-all$/);
    if (full && req.method === "POST") return send(res,202,JSON.stringify({jobId:await startFullRender(full[1])}));
    const openRendersRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/open-renders$/);
    if (openRendersRoute && req.method === "POST") {const renderDir=await openProjectRenders(openRendersRoute[1]);return send(res,200,JSON.stringify({opened:true,renderDir}));}
    if (req.method === "POST" && url.pathname === "/api/onboard") {const id=url.searchParams.get("id")||"",name=url.searchParams.get("name")||id,extension=(url.searchParams.get("extension")||"").toLowerCase(),target=Number(url.searchParams.get("target")||30);if(!Number.isFinite(target)||target<25||target>35)return send(res,400,"Target semantic window must be between 25 and 35 seconds.","text/plain");if(!/^[a-z0-9-]+$/.test(id)||!["mp4","mov","m4v","wav"].includes(extension))return send(res,400,"Only MP4, MOV, M4V, or WAV files are supported.","text/plain");if(existsSync(projectPath(id)))return send(res,409,"This project ID already exists. Choose a new ID.","text/plain");logWork(id,"upload-started",{name,extension,target});const jobId=`onboard-${id}-${Date.now()}`,storage=await createProjectStorage(root,id),isAudio=extension==="wav",file=isAudio?storage.audioFile:storage.rawVideo;if(isAudio)await require("node:fs/promises").copyFile(join(root,"public","test.mp4"),storage.rawVideo);jobs.set(jobId,{state:"uploading",step:1,progress:8,message:"正在上传文件…"});const stream=createWriteStream(file);req.pipe(stream);stream.on("finish",()=>{logWork(id,"upload-finished",{file:"source/raw.mp4"});const startedAt=Date.now();jobs.set(jobId,{state:"running",step:2,stage:"transcribing",progress:10,startedAt,message:"正在提取音频字幕，进度： 正在捕获台词"});const heartbeat=setInterval(()=>{const current=jobs.get(jobId);if(!current||current.state!=="running"||current.stage!=="transcribing")return;let captionCount=Number(current.captionCount||0);try{if(!captionCount){const parsed=JSON.parse(readFileSync(storage.captionsFile,"utf8"));captionCount=Array.isArray(parsed.transcription)?parsed.transcription.length:Array.isArray(parsed)?parsed.length:0}}catch(_){}const elapsed=Math.floor((Date.now()-startedAt)/1000);const timeText=current.transcriptionProgressText||((captionCount?"已捕获 "+captionCount+" 句台词":"正在捕获台词")+" · 已耗时 "+elapsed+"s");jobs.set(jobId,{...current,elapsedSeconds:elapsed,captionCount,message:"正在提取音频字幕，进度： "+timeText,transcriptionProgressText:current.transcriptionProgressText||timeText})},1000);stage1TranscribeToReview({projectId:id,name,targetBeatDuration:target,audioAlreadyPrepared:isAudio,onProgress:p=>{logWork(id,"onboarding-progress",p);const current=jobs.get(jobId)||{};jobs.set(jobId,{...current,state:"running",...p})}}).then(()=>{clearInterval(heartbeat);logWork(id,"captions-review-ready");jobs.set(jobId,{state:"done",step:3,stage:"captions_review",progress:100,nextAction:"captions_review",message:"转录完成，请先核对字幕内容。"})}).catch(error=>{clearInterval(heartbeat);logWork(id,"onboarding-failed",{error:error.message});jobs.set(jobId,{state:"failed",error:error.message})})});stream.on("error",error=>jobs.set(jobId,{state:"failed",error:error.message}));return send(res,202,JSON.stringify({jobId}));}
    const diagnosticRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/diagnostic-report$/);
    if (diagnosticRoute && req.method === "GET") {const project=await getProject(diagnosticRoute[1]);const file=projectPaths(root,diagnosticRoute[1]).executionLog;const rows=existsSync(file)?(await readFile(file,"utf8")).trim().split("\n").filter(Boolean).map((line)=>JSON.parse(line)):[];const errors=rows.filter((row)=>row.level==="ERROR");const stale=project.beats.filter((beat)=>beat.render?.status==="failed"||beat.render?.status==="stale").map((beat)=>({id:beat.id,status:beat.render?.status,error:beat.render?.error}));const last=errors.at(-1);const report=[`# Video Studio Diagnostic Report`,`- Project: ${project.projectId}`,`- State: ${project.state ?? "READY"}`,`- Beats: ${project.beats.length}`,`- Failed or stale beats: ${JSON.stringify(stale)}`,`- Last error: ${last ? last.message : "None"}`,last?.errorStack ? `\n\`\`\`\n${last.errorStack}\n\`\`\`` : ""].filter(Boolean).join("\n");return send(res,200,report,"text/markdown; charset=utf-8");}
    const logsRoute = url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/logs$/);
    if (logsRoute && req.method === "GET") {const file=projectPaths(root,logsRoute[1]).executionLog;const level=url.searchParams.get("level"),stage=url.searchParams.get("stage");const rows=existsSync(file)?(await readFile(file,"utf8")).trim().split("\n").filter(Boolean).map((line)=>JSON.parse(line)).filter((row)=>(!level||row.level===level)&&(!stage||row.stage===stage)).slice(-80):[];return send(res,200,JSON.stringify(rows));}
    const job = url.pathname.match(/^\/api\/jobs\/([\w-]+)$/); if(job && req.method === "GET") return send(res,200,JSON.stringify(jobs.get(job[1])||{state:"idle"}));
    const preview=url.pathname.match(/^\/preview\/([\w-]+)$/);if(preview&&req.method==="GET"){const file=join(previewDir,`${preview[1]}.mp4`);if(!existsSync(file))return send(res,404,"Not found","text/plain");const info=await stat(file);res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":info.size});return createReadStream(file).pipe(res);}
    const recovered=url.pathname.match(/^\/recovered-output\/([a-z0-9-]+)$/);if(recovered&&req.method==="GET"){const storage=projectPaths(root,recovered[1]),legacy=join(root,"out",recovered[1]+"-initial.mp4"),file=existsSync(storage.finalRenderFile)?storage.finalRenderFile:legacy;if(!existsSync(file))return send(res,404,"Not found","text/plain");const info=await stat(file);res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":info.size});return createReadStream(file).pipe(res);}
    const output=url.pathname.match(/^\/output\/([\w-]+)$/);if(output&&req.method==="GET"){const record=jobs.get(output[1]);if(!record?.file||!existsSync(record.file))return send(res,404,"Not found","text/plain");const info=await stat(record.file);res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":info.size});return createReadStream(record.file).pipe(res);}
    return send(res,404,"Not found","text/plain");
  } catch (error) {return send(res,500,JSON.stringify({error:error.message}));}
}).listen(4318,"127.0.0.1",()=>console.log("Project Editor Web ready at http://127.0.0.1:4318"));







