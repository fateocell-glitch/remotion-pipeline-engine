const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync} = require("node:fs");

const host = readFileSync("scripts/project-editor-web.cjs", "utf8");
const page = readFileSync("scripts/project-studio-page.cjs", "utf8");
const effectLayers = readFileSync("src/JasonWu/effectLayers.ts", "utf8");
const composition = readFileSync("src/JasonWu/JasonWuComposition.tsx", "utf8");
const motionWrapper = readFileSync("src/JasonWu/components/common/MotionWrapper.tsx", "utf8");
const layoutRegistry = readFileSync("src/JasonWu/layoutRegistry.ts", "utf8");
const projectLoader = readFileSync("src/JasonWu/projectLoader.ts", "utf8");
const demoEffects = readFileSync("src/JasonWu/DemoEffectComponents.tsx", "utf8");
const incompleteEffects = readFileSync("src/JasonWu/IncompleteEffectComponents.tsx", "utf8");
const layoutMatcher = readFileSync("scripts/layout-matcher.cjs", "utf8");
const studioLivePreview = readFileSync("src/JasonWu/StudioLivePreview.tsx", "utf8");
const recoveredEffects = readFileSync("src/JasonWu/RecoveredEffectComponents.tsx", "utf8");
const effectLayerRuntime = readFileSync("src/JasonWu/effectLayers.ts", "utf8");
const adminSandboxClient = readFileSync("src/design/admin-components-client.tsx", "utf8");
const adminComponentsPage = readFileSync("scripts/admin-components-page.cjs", "utf8");

test("studio provides timeline inspector and persistent preview regions", () => {
  assert.match(page, /class="timeline"/);
  assert.match(page, /class="inspector"/);
  assert.match(page, /preview-column/);
});

test("studio exposes layout selection, subtitle proofreading, and render actions", () => {
  assert.match(page, /auto-match/);
  assert.match(page, /render-all/);
  assert.match(page, /proofread/);
});

test("studio uses the agreed subtitle labels and fixed two-line editor fields", () => {
  assert.match(page, /中文字幕/);
  assert.match(page, /英文字幕/);
  assert.match(page, /核心短观点/);
  assert.match(page, /rows="3"/);
});

test("studio exposes a same-category layout replacement control", () => {
  assert.match(page, /同类效果替换/);
  assert.match(page, /same-category-layout/);
  assert.match(page, /sameCategoryLayouts/);
});
test("host serves durable current beat assets and project lifecycle state", () => {
  assert.match(host, /project-asset/);
  assert.match(host, /currentAssetPath/);
  assert.match(host, /mergeProjectEdits/);
  assert.match(host, /render-status/);
});

test("host accepts video and wav source uploads", () => {
});

test("new project transcription progress shows audio timestamp instead of only caption count", () => {
  assert.match(host, /transcriptionProgressText/);
  assert.match(host, /正在提取音频字幕，进度：/);
  assert.match(page, /transcriptionProgressText/);
  assert.match(host, /message:"正在提取音频字幕，进度： "\+timeText/);
});
test("studio exposes unified button tiers and lifecycle feedback", () => {
  assert.match(page, /button--primary/);
  assert.match(page, /button--ai/);
  assert.match(page, /button--render/);
  assert.match(page, /button--toggle/);
  assert.match(page, /is-loading/);
  assert.match(page, /渲染完成/);
  assert.match(page, /渲染失败/);
  assert.match(page, /actionLock/);
});

test("studio exposes editable labels for diagonal chip layers", () => {
  assert.match(host, /"diagonal-chips"/);
  assert.match(host, /芯片顶部标签/);
  assert.match(host, /Chip 文案 1/);
  assert.match(host, /Chip 文案 2/);
  assert.match(host, /Chip 文案 3/);
  assert.match(page, /data-prop/);
});

test("studio passes only compact Chinese effect copy into each rendered layer", () => {
  assert.match(effectLayers, /effectZh/);
  assert.doesNotMatch(effectLayers, /effectEn/);
});

test("studio keeps a single compact Chinese effect-copy field", () => {
  assert.match(page, /效果中文文案/);
  assert.doesNotMatch(page, /效果英文文案/);
});

test("studio keeps diagonal chips replacements inside the chip effect family", () => {
  assert.match(host, /floating-chips/);
  assert.match(host, /family: "chips"/);
  assert.match(page, /family/);
  assert.match(page, /sameFamilyLayouts/);
});


test("studio exposes the project management library controls", () => {
  assert.match(page, /项目管理/);
  assert.match(page, /project-library-modal/);
  assert.match(page, /previews\/clean/);
  assert.match(host, /project-management.cjs/);
  assert.match(host, /req.method === \"DELETE\"/);
});


test("studio exposes selectable checkbox colors and composition honors zero background settings", () => {
  assert.match(host, /boxColor/);
  assert.match(page, /data-prop/);
  assert.match(composition, /resolveCheckboxColor/);
  assert.match(composition, /filter: settings.background.blurRadius > 0/);
  assert.doesNotMatch(composition, /ReferenceMask/);
});


test("checkbox layouts expose the shared color selector through the layout registry", () => {
  assert.match(layoutRegistry, /const checkboxColorField/);
  assert.match(layoutRegistry, /item\("reject-list"[\s\S]*checkboxColorField/);
  assert.match(layoutRegistry, /item\("check-progress"[\s\S]*checkboxColorField/);
  assert.match(layoutRegistry, /item\("clipboard-note"[\s\S]*checkboxColorField/);
  assert.match(layoutRegistry, /item\("closing-checklist"[\s\S]*checkboxColorField/);
});


test("pivot-list uses the unified registry typewriter without retired badges", () => {
  const sceneModules=composition.slice(composition.indexOf("const SceneModules"),composition.indexOf("const EffectLayerStack"));
  assert.match(sceneModules, /LayoutEffectRenderer/);
  assert.equal(sceneModules.includes("PivotListLayout"), false);
  assert.match(demoEffects, /stringProp\(props, "text", stringProp\(props, "effectZh", cue\.caption\.zh/);
  const typewriter=demoEffects.slice(demoEffects.indexOf("export const SpecBadgeAndTypewriter"),demoEffects.indexOf("export const KineticTypographyAccent"));
  assert.doesNotMatch(typewriter, /badges/);
});

test("dynamic list props are registered, editable, and do not use ordered mock steps", () => {
  assert.match(layoutRegistry, /type: "string-list"/);
  assert.match(layoutRegistry, /item\("ordered-sequence"[\s\S]*key: "steps"/);
  assert.match(page, /data-list-item/);
  assert.match(page, /addListItem/);
  assert.match(page, /moveListItem/);
  const updateListDraft = page.slice(page.indexOf("function updateListDraft"), page.indexOf("function addListItem"));
  const addKeyValueItem = page.slice(page.indexOf("function addKeyValueItem"), page.indexOf("function removeKeyValueItem"));
  assert.match(updateListDraft, /pushLayerHistory\(beat\)/);
  assert.match(addKeyValueItem, /pushLayerHistory\(beat\)/);
  assert.match(incompleteEffects, /export const OrderedSequence[\s\S]*props/);
  assert.doesNotMatch(incompleteEffects, /rows\(cue,\["芯片架构","产品定义","供应链重构"\]\)/);
  assert.match(layoutMatcher, /steps:/);
});

test("project cues preserve effect layers and common motion props for Remotion", () => {
  assert.ok(projectLoader.replace(/\r/g, "").includes("effectProps: beat.effectProps,\n    layers: beat.layers"));
});

test("each effect layer renders through one visual dispatcher", () => {
  assert.match(composition, /<SceneModules cue={scopedCue} \/>/);
  assert.doesNotMatch(composition, /<DemoEffectAdditions cue={scopedCue} \/>/);
});


test("Studio exposes layout metadata for external editor clients", () => {
  assert.match(host, /url\.pathname === "\/api\/layouts"/);
  assert.match(host, /JSON\.stringify\(layoutMetadata\)/);
});



test("Studio replaces transcript summary with a live layout component preview", () => {
  assert.match(page, /当前效果组件预览/);
  assert.match(page, /layout-preview-card/);
  assert.match(page, /renderLayoutPreview/);
  assert.match(page, /studio-live-preview.js/);
  assert.match(page, /StudioLayoutPreview\.render/);
  assert.doesNotMatch(page, /<iframe/);
  assert.match(page, /跳转字幕校对/);
  assert.doesNotMatch(page, /当前 Beat 对应底部字幕/);
});


test("live layout preview reads unsaved layer props before rendering", () => {
  assert.match(page, /function syncLivePreview\(\){readForm\(true\);refreshMotionTimingUI\(\);markDirty\(\);renderLayoutPreview/);
});


test("checkbox component previews reflect their selected box color", () => {
  assert.match(page, /CHECKBOX_PREVIEW_COLORS/);
  assert.match(page, /props\.boxColor/);
});


test("layout preview cards include lightweight motion cues without a render job", () => {
  assert.match(page, /previewPayload/);
  assert.match(page, /preview-canvas-container/);
  assert.doesNotMatch(page, /postMessage/);
});


test("full render uses sandbox project data and validated beat previews", () => {
  assert.match(host, /projectPath\(projectId\)/);
  assert.match(host, /render-project-full.cjs/);
});

test("value verdict is driven by current beat copy instead of Apple demo content", () => {
  assert.match(composition, /const ValueVerdictLayout/);
  assert.match(composition, /cue.section.subtitle/);
  assert.match(composition, /cue.caption.zh/);
  assert.doesNotMatch(composition, /JOHN TERNUS TAKES OVER AS APPLE CEO/);
  assert.doesNotMatch(composition, /超复合型/);
  assert.doesNotMatch(composition, /资本市场认可/);
});

test("common motion panel keeps only the five focused controls", () => {
  assert.match(page, /进场延迟 \(s\)/);
  assert.match(page, /挂载位置/);
  assert.match(page, /缩放比例/);
  assert.match(page, /横向微调 X/);
  assert.match(page, /纵向微调 Y/);
  assert.doesNotMatch(page, /退场提前量/);
  assert.doesNotMatch(page, /自定义时长/);
  assert.doesNotMatch(page, /进场动效/);
  assert.doesNotMatch(page, /音效触发/);
});

test("studio separates common motion controls from component-specific fields", () => {
  assert.match(page, /基础动效与时空参数/);
  assert.match(page, /组件专属内容/);
  assert.match(page, /class="props-card inspector-accordion"/);
  assert.match(page, /commonProps/);
});

test("composition applies the shared motion wrapper and optional contrast system", () => {
  assert.match(effectLayers, /commonProps/);
  assert.match(composition, /<MotionWrapper/);
  assert.match(composition, /getContrastStyle/);
  assert.match(page, /gs-auto-contrast-stroke/);
});

test("Inspector template does not leave an unjoined action bar", () => {
  assert.doesNotMatch(page, /<\/details>'<div class=\"actions\">/);
});

test("generated Studio script is syntactically valid", () => {
  const {buildPage} = require("./project-studio-page.cjs");
  const html = buildPage([]);
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(script, "Studio page must include a script");
  assert.doesNotThrow(() => new Function(script));
});

test("motion wrapper applies contrast only to white or dark rendered text", () => {
  assert.match(motionWrapper, /motion-auto-contrast/);
  assert.match(motionWrapper, /--contrast-white-stroke/);
  assert.equal(motionWrapper.includes("[style*=\\\"color: rgb(255, 255, 255)\\\"]"), true);
  assert.equal(motionWrapper.includes("getContrastStyle(\"#FFFFFF\", autoContrastStroke)"), true);
  assert.doesNotMatch(motionWrapper, /transformOrigin: "center center", ...getContrastStyle/);
});

test("timeline keeps the user scroll position when selecting a beat", () => {
  assert.match(page, /const scrollTop=list\.scrollTop/);
  assert.match(page, /requestAnimationFrame\(\(\)=>\{list\.scrollTop=scrollTop\}\)/);
});

test("ordered sequence uses the two-stage preview bridge without Player payload coupling", () => {
  assert.doesNotMatch(composition, /index < 3 \? <div style=\{\{flex: 1, height: 2, background: "rgba\(255,255,255,0\.2\)"\}\} \/> : null/);
  assert.match(page, /previewPayload\(beat,layer,mode="library"\)/);
  assert.match(page, /previewPayload\(beat,layer,"custom"\)/);
});

test("Studio uses the exact Player preview bridge and limits preview motion to two loops", () => {
  assert.doesNotMatch(page, /LAYOUT_PREVIEW_RENDERERS/);
  assert.match(page, /StudioLayoutPreview\.render/);
  assert.doesNotMatch(page, /postMessage/);
});

test("Inspector orders component props, motion controls, then the layer stack", () => {
  const inspector=page.slice(page.indexOf("function renderInspector"),page.indexOf("function renderProofreader"));
  const componentProps=inspector.indexOf("componentSpecificPanel");
  const motion=inspector.indexOf("commonMotionFields");
  const stack=inspector.indexOf("layerManager");
  assert.ok(componentProps >= 0 && motion > componentProps && stack > motion);
});

test("Studio persists manual Inspector edits, keeps blank added list rows, and exposes actual Player preview", () => {
  assert.match(page, /textSource="manual"/);
  assert.match(page, /effectCopySource="manual"/);
  const updateListDraft = page.slice(page.indexOf("function updateListDraft"), page.indexOf("function addListItem"));
  assert.doesNotMatch(updateListDraft, /next\.filter/);
  assert.match(page, /studio-live-preview\.js/);
  assert.match(page, /StudioLayoutPreview\.render/);
  assert.match(host, /studio-live-preview\.js/);
  assert.match(page, /<div id="layout-preview-player" class="preview-canvas-container"><\/div>/);
});

test("composition uses the registry renderer for every visual layer and typewriter has no badges", () => {
  const sceneModules = composition.slice(composition.indexOf("const SceneModules"), composition.indexOf("const EffectLayerStack"));
  assert.match(sceneModules, /=> <LayoutEffectRenderer cue={cue} \/>;/);
  assert.doesNotMatch(sceneModules, /V1NewEffectLayout/);
  assert.doesNotMatch(sceneModules, /CustomEffectLayout/);
  assert.doesNotMatch(layoutRegistry, /item\("pivot-list"[\s\S]*key: "badges"/);
  const typewriter = demoEffects.slice(demoEffects.indexOf("export const SpecBadgeAndTypewriter"), demoEffects.indexOf("export const KineticTypographyAccent"));
  assert.doesNotMatch(typewriter, /badges/);
});

test("single beat render failures are written to structured project logs", () => {
  assert.match(host, /stage: "RENDER_BEAT"/);
  assert.match(host, /single-beat-render-failed/);
  assert.match(host, /single-beat-render-completed/);
});

test("single beat silent watchdog terminates only stalled process trees", () => {
  assert.match(host, /single-beat-watchdog-stalled/);
  assert.match(host, /taskkill/);
  assert.match(host, /terminateProcessTree/);
  assert.match(host, /currentFrame > lastFrame/);
});

test("single beat render uses bilingual integrity gates and a one-retry silent-stall watchdog", () => {
  assert.match(host, /validateBeatIntegrity/);
  assert.match(host, /PRE_RENDER_GATE_BLOCKED/);
  assert.match(host, /shouldAbortForStall/);
  assert.match(host, /stallMs: 45000/);
  assert.match(host, /attempt < 1/);
  assert.match(host, /single-beat-watchdog-retry/);
  assert.match(host, /diagnoseRenderFailure/);
});

test("single beat render uses a 45-second idle timeout instead of an absolute runtime cutoff", () => {
  assert.match(host, /stallMs: 45000/);
  assert.match(host, /--concurrency=2/);
  assert.doesNotMatch(host, /setTimeout\([\s\S]{0,100}90000/);
});

test("Studio provides a searchable layer gallery and 15-step undo redo history", () => {
  assert.match(page, /add-effect-modal/);
  assert.match(page, /openAddEffectGallery/);
  assert.match(page, /renderAddEffectGallery/);
  assert.match(page, /selectGalleryLayout/);
  assert.match(page, /MAX_LAYER_HISTORY\s*=\s*15/);
  assert.match(page, /pushLayerHistory/);
  assert.match(page, /undoLayers/);
  assert.match(page, /redoLayers/);
  assert.match(page, /撤销/);
});


test("Studio formats pre-render gate failures into a readable message", () => {
  assert.match(page, /function friendlyRenderError\(message\)/);
  assert.match(page, /PRE_RENDER_GATE_BLOCKED/);
  assert.match(page, /diagnostics/);
});

test("single beat response and project persistence avoid partial JSON reads", () => {
  assert.match(host, /writeProjectAtomically/);
  assert.match(host, /rename\(tempFile, file\)/);
  assert.doesNotMatch(host, /await writeFile\(projectPath\(/);
});

test("common enter delay shifts component-local chip stagger and right mount is visibly distinct", () => {
  assert.match(effectLayers, /start: motionEnterOffset/);
  assert.match(motionWrapper, /"center-right": \[520, 0\]/);
});

test("closing checklist is controlled by headline, editable items, and selected box color", () => {
  assert.match(layoutRegistry, /item\("closing-checklist"[\s\S]*key: "items"/);
  const checklist = incompleteEffects.slice(incompleteEffects.indexOf("export const ClosingChecklist"));
  assert.match(checklist, /props/);
  assert.match(checklist, /listProp\(cue, props, "items"\)/);
  assert.match(checklist, /boxColor/);
  assert.match(checklist, /cue\.section\.subtitle/);
});

test("isolated layout preview uses a dark DOM canvas with error protection and responsive scaling", () => {
  assert.match(studioLivePreview, /PreviewErrorBoundary/);
  assert.match(studioLivePreview, /StandardLayoutPreview/);
  assert.match(studioLivePreview, /background:"#090d16"/);
  assert.match(studioLivePreview, /transform:"scale\("\+scale\+"\)"/);
  assert.doesNotMatch(studioLivePreview, /@remotion\/player/);
  assert.doesNotMatch(studioLivePreview, /MotionWrapper/);
  assert.match(page, /刷新预览/);
  assert.match(page, /refreshLayoutPreview/);
  assert.match(page, /预览已更新/);
});

test("diagonal chips enter sequentially from invisible and use a true eight-pixel vertical gap", () => {
  const chips = incompleteEffects.slice(incompleteEffects.indexOf("export const DiagonalChips"), incompleteEffects.indexOf("export const FloatingChips"));
  assert.match(chips, /opacity: progress/);
  assert.match(chips, /Number\(designTokens\.gap\) \|\| 8/);
  assert.doesNotMatch(chips, /top: 64 \+ i \* 90/);
});

test("top-right preview uses a two-mode DOM React preview library without Remotion Player startup", () => {
  assert.match(studioLivePreview, /mode: "library" \| "custom"/);
  assert.match(studioLivePreview, /StandardLayoutPreview/);
  assert.match(studioLivePreview, /commonPreviewStyle/);
  assert.doesNotMatch(studioLivePreview, /@remotion\/player/);
  assert.doesNotMatch(studioLivePreview, /MotionWrapper/);
  assert.match(page, /previewApplied/);
  assert.match(page, /参数已修改，点击刷新预览/);
});


test("subtitle proofreader opens the selected beat and focuses its local caption list", () => {
  assert.match(page, /function openProofreader\(\)\{const beat=selectedBeat\(\)/);
  assert.match(page, /\(APP\.project\.captions\|\|\[\]\)\.filter\(\(caption\)=>caption\.end>beat\.start&&caption\.start<beat\.end\)/);
  assert.match(page, /caption-list.*scrollIntoView/);
});

test("standard layout preview plays once by default and replays once only while hovered", () => {
  const preview = page.slice(page.indexOf("function bindAnimatedLayoutPreview"), page.indexOf("function refreshLayoutPreview"));
  assert.match(preview, /hover-preview-pill/);
  assert.match(preview, /hover to play/);
  assert.match(preview, /pointerenter/);
  assert.match(preview, /pointerleave/);
  assert.match(preview, /video\.play\(\)/);
  assert.match(preview, /video\.pause\(\)/);
  assert.match(preview, /video\.currentTime=0/);
  assert.doesNotMatch(preview, /previewLoops/);
  assert.match(page, /\.hover-preview-pill\{/);
  assert.match(page, /\.hover-preview-pill\.active\{/);
});

test("Inspector changes debounce into a custom DOM preview refresh", () => {
  assert.match(page, /function schedulePreviewRefresh\(\).*300/);
  assert.match(page, /syncLivePreview\(\).*schedulePreviewRefresh/);
  assert.match(page, /payload\.mode==="custom"/);
  assert.match(page, /StudioLayoutPreview\.render\(host,\{\.\.\.payload,nonce:\+\+APP\.previewNonce\}\)/);
});


test("full render status recovers a completed output after the Studio service restarts", () => {
  assert.match(host, /recoverCompletedFullRender/);
  assert.match(host, /outputInfo.mtimeMs/);
  assert.match(host, /full-render-recovered/);
  assert.match(host, /status: "completed", progress: 100/);
});


test("Studio uses Layer Tabs and settled preview timing for timed layers", () => {
  assert.match(page, /function layerTabs\(beat\)/);
  assert.match(page, /layer-tabs/);
  assert.match(page, /function previewSettledTime\(beat,layer\)/);
  assert.match(page, /previewTimeSeconds/);
  assert.match(page, /selectLayer\(index\).*previewPayload\(beat,layer,"custom"\)/);
  assert.match(studioLivePreview, /定格预览/);
});


test("Layer Tabs expose each layer visual type without opening the Inspector", () => {
  const layerTabs = page.slice(page.indexOf("function layerTabs(beat)"), page.indexOf("function layerManager(beat)"));
  assert.match(layerTabs, /definition\(layer\.layout\)\.label/);
  assert.match(layerTabs, /Layer .*layout/);
  assert.match(layerTabs, /layer-tab-layout/);
});

test("full render exposes transparent beat-level pipeline progress without a fixed 55 percent tick", () => {
  assert.match(host, /FULL_PROGRESS/);
  assert.match(host, /currentBeatProgress/);
  assert.match(host, /cachedBeats/);
  assert.match(readFileSync("scripts/render-project-full.cjs", "utf8"), /rendering_beats/);
  assert.match(readFileSync("scripts/render-project-full.cjs", "utf8"), /injecting_audio_subs/);
  assert.doesNotMatch(host, /progress: 55/);
  assert.match(page, /global-pipeline/);
  assert.match(page, /renderGlobalPipeline/);
  assert.match(page, /当前/);
});


test("single beat rendering updates the left Beat card with live frame progress", () => {
  const list = page.slice(page.indexOf("function renderBeatList"), page.indexOf("function renderStateLabel"));
  assert.match(list, /singleBeatActive/);
  assert.match(list, /正在渲染/);
  assert.match(list, /currentFrame/);
  assert.match(list, /totalFrames/);
  assert.match(list, /percentage/);
  const polling = page.slice(page.indexOf("async function pollBeat"), page.indexOf("async function renderAll"));
  assert.match(polling, /renderBeatList\(\)/);
  assert.match(polling, /preserveLayoutPreview:true/);
  const player = page.slice(page.indexOf("function setPlayerAsset"), page.indexOf("function renderBeatList"));
  assert.match(player, /if\(!options\.preserveLayoutPreview\)renderLayoutPreview\(beat\)/);
});

test("full render refreshes three-stage copy and marks the active Beat with a blue spinner", () => {
  assert.match(host, /\[1\/3\] 检查缓存/);
  assert.match(host, /\[2\/3\] 正在逐拍渲染/);
  assert.match(host, /\[3\/3\] FFmpeg 正在拼接全片音视频轨/);
  assert.match(host, /elapsedSeconds/);
  assert.match(page, /full-rendering/);
  assert.match(page, /fullRenderStatus/);
  assert.match(page, /render-spin/);
  assert.match(page, /全片合成中/);
});



test("formal layered renders hide recovered component internal section headers", () => {
  assert.match(effectLayerRuntime, /__externalSectionLabel: true/);
  assert.match(recoveredEffects, /props\?\.__externalSectionLabel \? null :/);
  assert.match(composition, /<SectionLabel key=\{activeLayer\.layerId\}/);
});
test("subtitle proofreader groups timed cues into readable sentence-sized blocks and preserves bilingual editing", () => {
  assert.match(page, /groupProofreadingCaptions/);
  assert.match(page, /约 30 字\/句组/);
  assert.match(page, /data-caption-group/);
  assert.match(page, /splitProofreadText/);
  assert.match(page, /ensureEnglishCaptions/);
});

test("server persists a hash-bound beat render cache in the project render directory", () => {
  assert.match(host, /renderContentHash/);
  assert.match(host, /reconcileProjectRenderCache/);
  assert.match(host, /renderedVideoPath/);
  assert.match(host, /currentAssetPath/);
});

test("caption review gate exposes draft, confirmation, automatic render, and modal controls", () => {
  assert.match(host, /captions-review/);
  assert.match(host, /captions-draft/);
  assert.match(host, /confirm-captions/);
  assert.match(host, /stage1TranscribeToReview/);
  assert.match(host, /stage2ProduceFromConfirmed/);
  assert.match(host, /mode === \"auto\"/);
  assert.match(page, /caption-review-modal/);
  assert.match(page, /id="caption-review-actions" class="caption-review-actionbar"/);
  assert.doesNotMatch(page, /id="caption-review-actions" class="actions"/);
  assert.match(page, /caption-review-actionbar\{display:flex/);
  assert.match(page, /max-height:500px/);
  assert.match(page, /id="caption-confirm-studio"/);
  assert.match(page, /确认字幕.*智能分拍/);
  assert.match(page, /setCaptionConfirmBusy/);
  assert.match(page, /正在智能分拍/);
  assert.match(page, /正在智能分拍进入工作台/);
  assert.match(page, /智能分拍任务未启动/);
  assert.match(page, /mode:\"studio\"|mode,"/);
  assert.match(page, /确认字幕.*一键全自动成片/);
  assert.match(page, /find-replace/);
  assert.match(page, /queueCaptionDraftSave/);
});



test("studio caption confirmation never uses automatic full-render progress copy", () => {
  const progressStart = page.indexOf("function renderBatchProgress");
  const progressEnd = page.indexOf("function setCaptionConfirmBusy");
  const progress = page.slice(progressStart, progressEnd);
  assert.match(progress, /studioOnly\?\(state\.state===\"done\"\?\"智能分拍完成，正在进入工作台\":\"正在智能分拍进入工作台\"\)/);
  assert.match(progress, /studioOnly\?"正在准备工作台/);
  const pollStart = page.indexOf("async function pollCaptionConfirmation");
  const pollEnd = page.indexOf("async function pollCaptionAutoRender");
  const poll = page.slice(pollStart, pollEnd);
  assert.match(poll, /state\.state===\"idle\"&&mode===\"studio\"/);
  assert.match(poll, /project\.state===\"READY\"/);
  assert.match(poll, /智能分拍任务未启动/);
});



test("studio caption confirmation uses slicing-only fallback progress copy", () => {
  const progressStart = page.indexOf("function renderBatchProgress");
  const progressEnd = page.indexOf("function setCaptionConfirmBusy");
  const progress = page.slice(progressStart, progressEnd);
  assert.match(progress, /state\.message/);
  assert.match(progress, /studioOnly/);
});
test("automatic caption rendering exposes a batch progress board and render-folder bridge", () => {
  assert.match(host, /open-renders/);
  assert.match(host, /explorer(?:\.exe)?/);
  assert.match(host, /finalRenderFile/);
  assert.match(page, /batch-render-progress/);
  assert.match(page, /已完成/);
  assert.match(page, /进入工作台/);
  assert.match(page, /打开成片目录/);
  assert.match(page, /renderBatchProgress/);
  assert.match(page, /正在准备成片/);
  assert.match(page, /pollCaptionProjectRenderStatus/);
  assert.match(page, /currentBeatId\?1:0/);
});


test("project loading preserves merged caption review rows", () => {
  assert.doesNotMatch(host, /splitCaptionCues\(source\.captions\)/);
  assert.match(host, /Array\.isArray\(source\.captions\) \? source\.captions : \[\]/);
});
test("caption review projects keep the center workspace usable before beats exist", () => {
  assert.match(page, /renderCaptionReviewWorkspace/);
  assert.match(page, /APP\.project\?\.state===\"CAPTIONS_REVIEW\"/);
  assert.match(page, /打开字幕核对/);
  assert.match(page, /CAPTIONS_REVIEW/);
});
test("super-admin component studio exposes local gate, registry APIs, Player sandbox, and registry-family replacement", () => {
  assert.match(host, /admin\/components/);
  assert.match(host, /api\/admin\/components/);
  assert.match(host, /isLocalAdmin/);
  assert.match(host, /buildAdminComponentsPage/);
  assert.match(host, /getComponentRegistrySync/);
  assert.match(page, /layout.family/);
  assert.match(page, /sameFamilyLayouts/);
});

test("diagonal chips consumes global design tokens for count, gap, and stagger", () => {
  const chips = incompleteEffects.slice(incompleteEffects.indexOf("export const DiagonalChips"), incompleteEffects.indexOf("export const FloatingChips"));
  assert.match(chips, /designTokens/);
  assert.match(chips, /defaultItemCount/);
  assert.match(chips, /staggerFrames/);
});

test("component mount tokens provide five visual-edge presets", () => {
  assert.match(motionWrapper, /mountMode/);
  assert.match(motionWrapper, /mountX/);
  assert.match(motionWrapper, /mountY/);
  assert.match(motionWrapper, /left/);
  assert.match(motionWrapper, /right/);
  assert.match(motionWrapper, /top/);
  assert.match(motionWrapper, /bottom/);
  assert.match(motionWrapper, /top-left/);
  assert.match(motionWrapper, /76/);
  assert.match(motionWrapper, /156/);
  assert.match(page, /挂载方式/);
  assert.match(page, /章节下方/);
  assert.match(page, /中间/);
});

test("admin sandbox starts from a settled visible frame", () => {
  assert.match(adminSandboxClient, /initialFrame=\{60\}/);
});

test("admin component studio centers the sandbox and supports accordion family drag and drop", () => {
  assert.match(adminComponentsPage, /260px/);
  assert.match(adminComponentsPage, /380px/);
  assert.match(adminComponentsPage, /admin-preview/);
  assert.match(adminSandboxClient, /collapsedFamilies/);
  assert.match(adminSandboxClient, /onDragStart/);
  assert.match(adminSandboxClient, /onDrop/);
  assert.match(adminSandboxClient, /family/);
  assert.match(host, /moveComponentToFamily/);
});



test("admin component studio keeps normal assets readable and gives Player a stable 16:9 stage", () => {
  assert.match(adminComponentsPage, /\.asset\{display:grid;grid-template-columns:16px minmax\(0,1fr\);width:100%;gap:8px;margin:4px 0;padding:9px 10px;/);
  assert.match(adminComponentsPage, /\.player-frame\{[\s\S]*aspect-ratio:16 \/ 9/);
  assert.match(adminComponentsPage, /\.player-frame>div\{width:100%!important;height:100%!important\}/);
  assert.doesNotMatch(adminComponentsPage, /\.player-frame>div\{width:100%!important;height:auto!important\}/);
});




test("admin studio pins the sandbox at desktop top and stages family moves before saving", () => {
  assert.match(adminComponentsPage, /.admin-shell\{[\s\S]*height:100vh;overflow:hidden/);
  assert.match(adminComponentsPage, /\.admin-tree,\.admin-inspector,\.admin-preview\{min-width:0;height:100vh\}/);
  assert.match(adminComponentsPage, /\.admin-tree\{[\s\S]*overflow:hidden/);
  assert.match(adminComponentsPage, /\.tree-scroll\{[\s\S]*overflow-y:auto/);
  assert.match(adminComponentsPage, /\.admin-preview\{[\s\S]*position:sticky;top:0;[\s\S]*height:100vh/);
  assert.match(adminSandboxClient, /saveFamilyMoves/);
  assert.match(adminSandboxClient, /确认保存拖拽修改/);
});




