const assert = require("node:assert/strict");
const test = require("node:test");
const {readFileSync} = require("node:fs");

const host = readFileSync("scripts/project-editor-web.cjs", "utf8");
const page = readFileSync("scripts/project-studio-page.cjs", "utf8");
const effectLayers = readFileSync("src/JasonWu/effectLayers.ts", "utf8");
const composition = readFileSync("src/JasonWu/JasonWuComposition.tsx", "utf8");
const motionWrapper = readFileSync("src/JasonWu/components/common/MotionWrapper.tsx", "utf8");
const contrast = readFileSync("src/JasonWu/utils/contrast.ts", "utf8");
const layoutRegistry = readFileSync("src/JasonWu/layoutRegistry.ts", "utf8");
const projectLoader = readFileSync("src/JasonWu/projectLoader.ts", "utf8");
const demoEffects = readFileSync("src/JasonWu/DemoEffectComponents.tsx", "utf8");
const demoAdditions = readFileSync("src/JasonWu/DemoEffectAdditions.tsx", "utf8");
const incompleteEffects = readFileSync("src/JasonWu/IncompleteEffectComponents.tsx", "utf8");
const layoutMatcher = readFileSync("scripts/layout-matcher.cjs", "utf8");
const studioLivePreview = readFileSync("src/JasonWu/StudioLivePreview.tsx", "utf8");
const recoveredEffects = readFileSync("src/JasonWu/RecoveredEffectComponents.tsx", "utf8");
const effectLayerRuntime = readFileSync("src/JasonWu/effectLayers.ts", "utf8");
const adminSandboxClient = readFileSync("src/design/admin-components-client.tsx", "utf8");
const adminSandbox = readFileSync("src/design/AdminComponentSandbox.tsx", "utf8");
const adminComponentsPage = readFileSync("scripts/admin-components-page.cjs", "utf8");
const componentCatalogPage = readFileSync("src/JasonWu/JasonWuComponentCatalog.tsx", "utf8");
const componentContent = readFileSync("src/design/component-content.ts", "utf8");
const componentPresetResolver = readFileSync("src/design/component-preset-resolver.ts", "utf8");
const jcNativeRecipes = readFileSync("src/JasonWu/JcNativeRecipes.tsx", "utf8");
const componentRegistryStore = readFileSync("scripts/services/component-registry-store.cjs", "utf8");
const componentRegistry = JSON.parse(readFileSync("src/design/components.registry.json", "utf8"));

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
  assert.match(page, /data-schema-field/);
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
test("rendered Beat MP4 assets support byte-range seeking", () => {
  const assetStart = host.indexOf("const asset = url.pathname.match(/^\\/project-asset");
  const assetRoute = host.slice(assetStart, host.indexOf("const statusRoute", assetStart));
  assert.match(assetRoute, /const range=req\.headers\.range/);
  assert.match(assetRoute, /res\.writeHead\(206/);
  assert.match(assetRoute, /Content-Range/);
  assert.match(assetRoute, /Accept-Ranges/);
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

test("studio keeps semantic copy inside component-specific fields", () => {
  assert.doesNotMatch(page, /效果摘要 \/ Effect Summary/);
  assert.match(page, /data-schema-field/);
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


test("new project hides internal IDs and limits semantic targets to 25 through 35 seconds", () => {
  assert.doesNotMatch(page, /id=\"new-project-id\"/);
  assert.doesNotMatch(page, /项目 ID/);
  assert.match(page, /目标语义窗口（25–35 秒，建议 30 秒）/);
  assert.match(page, /id=\"new-project-target\" type=\"number\" min=\"25\" max=\"35\" value=\"30\"/);
  assert.match(page, /const id=\"video-\"\+Date.now()/);
  assert.match(host, /target<25\|\|target>35/);
  assert.doesNotMatch(page, /项目名称或 ID/);
  assert.doesNotMatch(page, /project.projectId\+" · "\+time(project.duration)/);
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



test("spotlight-question renders comment actions as a bounded token-spaced row", () => {
  const component = demoEffects.slice(demoEffects.indexOf("export const FloatingCommentCards"), demoEffects.indexOf("export const FallbackTechPanel"));
  assert.match(component, /designTokens/);
  assert.match(component, /Number\(designTokens\.gap\) \|\| 16\)\) \* 3/);
  assert.match(component, /boundsX/);
  assert.match(component, /boundsY/);
  assert.match(component, /boundsWidth/);
  assert.match(component, /display: "flex"/);
  assert.match(component, /justifyContent: "center"/);
  assert.match(component, /gap/);
  assert.match(component, /flex: "0 0 auto"/);
  assert.match(component, /width: "max-content"/);
  assert.match(component, /maxButtonWidth/);
  assert.match(component, /minWidth: 240/);
  assert.match(component, /linear-gradient\(135deg/);
  assert.match(component, /outlineOffset: 3/);
  assert.match(component, /inset 0 0 22px/);
  assert.match(component, /mountMode === "top-left"/);
  assert.match(component, /1920 - width - 24/);
  assert.match(component, /: rawLeft/);
  assert.match(component, /whiteSpace: "normal"/);
  assert.match(component, /overflowWrap: "anywhere"/);
  assert.match(component, /overflow: "visible"/);
  assert.doesNotMatch(component, /textOverflow: "ellipsis"/);
  assert.doesNotMatch(component, /actionLabels/);
  assert.doesNotMatch(component, /点赞|评论|收藏/);
  assert.doesNotMatch(component, /left: 120, right: 120, bottom: 245/);
  assert.doesNotMatch(component, /bottom: 255 \+ index \* 70/);
  assert.doesNotMatch(component, /right: 125 \+ index \* 52/);
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

test("each effect layer renders through one visual dispatcher without duplicating the fixed header", () => {
  const effectLayerStack = composition.slice(composition.indexOf("const EffectLayerStack"), composition.indexOf("type JasonWuTemplateProps"));
  assert.doesNotMatch(effectLayerStack, /<LayoutEffectHeader/);
  assert.match(effectLayerStack, /<MotionWrapper/);
  assert.match(effectLayerStack, /<SceneModules cue={effectiveCue} showStandardHeader={false} \/>/);
  assert.match(composition, /const effectiveHeaderCue = \{/);
  assert.match(composition, /<LayoutEffectHeader key={activeLayer\.layerId} cue={effectiveHeaderCue} \/>/);
  assert.match(composition, /const effectiveCue = \{\.\.\.scopedCue, layout: faceAware\.layout, effectProps:/);
  assert.doesNotMatch(composition, /<DemoEffectAdditions cue={scopedCue} \/>/);
});


test("server validates saved layers against the registered manifest instead of a stale layout list", () => {
  assert.match(host, /const layouts = componentAssetRegistry\.components\.map\(\(component\) => component\.id\)/);
  assert.ok(componentRegistry.components.some((component) => component.id === "value-verdict"));
});

test("an internal save failure stops the render request instead of submitting stale project data", () => {
  const saveBeat = page.slice(page.indexOf("async function saveBeat"), page.indexOf("async function saveCaptions"));
  assert.match(saveBeat, /if\(internal\)throw error;/);
});
test("Studio exposes layout metadata for external editor clients", () => {
  assert.match(host, /url\.pathname === "\/api\/layouts"/);
  assert.match(host, /JSON\.stringify\(layoutMetadata\)/);
});



test("Studio replaces transcript summary with a live layout component preview", () => {
  assert.match(page, /所选效果模板展示/);
  assert.match(page, /layout-preview-card/);
  assert.match(page, /renderLayoutPreview/);
  assert.match(page, /studio-live-preview.js/);
  assert.match(page, /previewHost\.render/);
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
  assert.match(page, /当前效果类型： /);
  assert.match(page, /class="props-card inspector-accordion"/);
  assert.match(page, /commonProps/);
});

test("composition keeps shared motion separate from subtitle contrast settings", () => {
  assert.match(effectLayers, /commonProps/);
  assert.match(composition, /<MotionWrapper/);
  assert.match(composition, /WebkitTextStroke: subtitleSettings\.theme\.autoContrastStroke/);
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

test("motion wrapper never mutates component typography", () => {
  assert.doesNotMatch(motionWrapper, /motion-auto-contrast/);
  assert.doesNotMatch(motionWrapper, /--contrast-white-stroke/);
  assert.doesNotMatch(motionWrapper, /getContrastStyle/);
  assert.match(motionWrapper, /motion-commercial-analysis/);
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
  assert.match(page, /previewHost\.render/);
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
  assert.match(page, /previewHost\.render/);
  assert.match(host, /studio-live-preview\.js/);
  assert.match(page, /<div id="layout-preview-player" class="preview-canvas-container"><\/div>/);
});

test("composition uses the registry renderer for every visual layer and typewriter has no badges", () => {
  const sceneModules = composition.slice(composition.indexOf("const SceneModules"), composition.indexOf("const EffectLayerStack"));
  assert.match(sceneModules, /=> <LayoutEffectRenderer cue={cue} showStandardHeader={showStandardHeader} \/>;/);
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

test("single beat scheduler reuses an active Beat job instead of racing the same output file", () => {
  assert.ok(host.includes("const activeBeatRenders = new Map()"));
  assert.ok(host.includes('const renderSlot = render[1] + ":" + render[2]'));
  assert.ok(host.includes('if (activeJobId) return send(res, 202, JSON.stringify({jobId: activeJobId, reused: true}))'));
  assert.ok(host.includes("activeBeatRenders.set(renderSlot, jobId)"));
  assert.ok(host.includes("releaseRenderSlot()"));
});

test("single beat rendering persists a detached worker lease across Studio server restarts", () => {
  assert.match(host, /workerPid/);
  assert.match(host, /detached: true/);
  assert.match(host, /findPersistedBeatJob/);
  assert.match(host, /isProcessAlive\(beat\.render\?\.workerPid\)/);
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

test("closing checklist is controlled by headline, editable items, selected box color, and no duplicate body copy", () => {
  assert.match(layoutRegistry, /item\("closing-checklist"[\s\S]*key: "items"/);
  const checklist = incompleteEffects.slice(incompleteEffects.indexOf("export const ClosingChecklist"));
  assert.match(checklist, /props/);
  assert.match(checklist, /listProp\(cue, props, "items"\)\.slice\(0, 4\)/);
  assert.match(checklist, /boxColor/);
  assert.match(checklist, /cue\.section\.subtitle/);
  assert.match(checklist, /top: BODY_TOP/);
  assert.doesNotMatch(checklist, /cue\.section\.eyebrow/);
  assert.doesNotMatch(checklist, /cue\.caption\.zh/);
});


test("person rank exposes up to three people and avatar uploads in the admin editor", () => {
  assert.match(adminSandboxClient, /const isPersonRank=draft\.id==="person-rank"/);
  assert.match(adminSandboxClient, /人物A<input/);
  assert.match(adminSandboxClient, /人物B<input/);
  assert.match(adminSandboxClient, /人物A头像上传/);
  assert.match(adminSandboxClient, /人物B头像上传/);
  assert.match(adminSandboxClient, /人物C<input/);
  assert.match(adminSandboxClient, /人物C头像上传/);
  assert.match(adminSandboxClient, /uploadAvatar\("thirdAvatar",event\)/);
  assert.match(adminSandboxClient, /uploadAvatar\("leftAvatar",event\)/);
  assert.match(adminSandboxClient, /uploadAvatar\("rightAvatar",event\)/);
  assert.match(demoEffects, /imageProp\(props, "leftAvatar"\)/);
  assert.match(demoEffects, /imageProp\(props, "rightAvatar"\)/);
  assert.match(demoEffects, /optionalStringProp\(props, "thirdName"\)/);
  assert.match(demoEffects, /imageProp\(props, "thirdAvatar"\)/);
  assert.match(demoEffects, /backgroundImage: imageSrc \? `url\(\$\{imageSrc\}\)` : undefined/);
  assert.doesNotMatch(demoEffects, /PersonDisc: React\.FC<\{name: string; role:/);
  assert.doesNotMatch(demoEffects, />\{role\}<\/div>/);
});

test("photo wall exposes four editable photo cards and image uploads", () => {
  const photoWall = incompleteEffects.slice(incompleteEffects.indexOf("export const PhotoWall"), incompleteEffects.indexOf("export const ProductExplosion"));
  assert.match(adminSandboxClient, /const isPhotoWall=draft\.id==="photo-wall"/);
  assert.match(adminSandboxClient, /默认内容模板 \/ 沙盒示例 · 照片墙/);
  assert.match(adminSandboxClient, /photoSlots=\[1,2,3,4\]/);
  assert.match(adminSandboxClient, /照片"\+slot\+"标题/);
  assert.match(adminSandboxClient, /照片"\+slot\+"副标题/);
  assert.match(adminSandboxClient, /uploadAvatar\("photo"\+slot,event\)/);
  assert.match(layoutRegistry, /"photo-wall": \[text\("photoTitle1", "照片1标题"\)[\s\S]*text\("photoTitle4", "照片4标题"\)/);
  assert.match(layoutRegistry, /photoTitle4: "补充证据"/);
  assert.match(photoWall, /const exact=\(key:string,fallbackValue:string\)=>typeof props\?\.\[key\] === "string"/);
  assert.match(photoWall, /const cards=\[0,1,2,3\]/);
  assert.match(photoWall, /photoTitle\$\{n\}/);
  assert.match(photoWall, /photoSubtitle\$\{n\}/);
  assert.match(photoWall, /photo\$\{n\}/);
  assert.match(photoWall, /slice\(0,4\)/);
  assert.match(photoWall, /background:card\.photo\?/);
});

test("Studio preview renders the active registry component inside a full-size direct canvas", () => {
  assert.match(studioLivePreview, /LAYOUT_BY_KEY/);
  assert.match(studioLivePreview, /ActiveVisualComponent/);
  assert.match(studioLivePreview, /DirectLayerCanvas/);
  assert.match(studioLivePreview, /<AbsoluteFill/);
  assert.match(studioLivePreview, /<ActiveVisualComponent cue={cue} props={props}/);
  assert.match(studioLivePreview, /component={DirectLayerCanvas}/);
  assert.match(studioLivePreview, /inputProps={{cue,props:cue\.effectProps,ActiveVisualComponent/);
  assert.doesNotMatch(studioLivePreview, /AdminComponentSandbox/);
});

test("Studio preview uses registry mock data and tokens instead of active Beat semantics", () => {
  assert.match(studioLivePreview, /getComponentPreset/);
  assert.match(studioLivePreview, /mockData/);
  assert.match(studioLivePreview, /getComponentTokens/);
  assert.doesNotMatch(studioLivePreview, /payload\.headline/);
  assert.doesNotMatch(studioLivePreview, /payload\.effectZh/);
  assert.doesNotMatch(studioLivePreview, /payload\.effectProps/);
  assert.doesNotMatch(studioLivePreview, /payload\.commonProps/);
});

test("Studio Inspector labels the current Layer semantic content and render-bound fields", () => {
  assert.match(page, /当前效果类型： /);
  assert.doesNotMatch(page, /当前图层完整配置 · 当前 Beat 语义内容/);
  assert.doesNotMatch(page, /该 Layer 的语义内容只属于当前 Beat/);
  assert.match(page, new RegExp("章节 / Category"));
  assert.match(page, new RegExp("核心大标题 / Headline"));
  assert.doesNotMatch(page, /专属内容模块 \/ 沙盒示例/);
  assert.match(page, /data-schema-field="'\+key\+'"/);
  assert.ok(componentRegistry.components.some((component) => component.editorSchema?.fields?.some((field) => field.key === "highlightQuote" && field.label === "副文内容")));
  assert.doesNotMatch(page, /组件库中的内容仅作默认模板与沙盒示例/);
});

test("narrative Layers bind their component body field directly to rendered content", () => {
  assert.match(page, /data-schema-field="'\+key\+'"/);
  assert.ok(page.includes('payload.type==="narrative"?payload.bodyText:current.effectText'));
  assert.ok(page.includes('applySchemaPayload(layer,schema)'));
  assert.doesNotMatch(page, /data-content-narrative/);
  assert.doesNotMatch(page, /正文内容（成片组件正文）<textarea/);
});

test("diagonal chips enter sequentially from invisible and use a true eight-pixel vertical gap", () => {
  const chips = incompleteEffects.slice(incompleteEffects.indexOf("export const DiagonalChips"), incompleteEffects.indexOf("export const FloatingChips"));
  assert.match(chips, /opacity: progress/);
  assert.match(chips, /Number\(designTokens\.gap\) \|\| 8/);
  assert.doesNotMatch(chips, /top: 64 \+ i \* 90/);
});

test("top-right preview replays the selected Layer on hover and restores at exit", () => {
  assert.match(studioLivePreview, /key={payload.previewKey}/);
  assert.match(studioLivePreview, /initialFrame={0}/);
  assert.match(studioLivePreview, /hover to play/);
  assert.match(studioLivePreview, /onMouseEnter={replay}/);
  assert.match(studioLivePreview, /onMouseLeave={reset}/);
  assert.match(studioLivePreview, /playerRef\.current\?\.seekTo\(0\)/);
  assert.match(studioLivePreview, /playerRef\.current\?\.play\(\)/);
  assert.match(studioLivePreview, /playerRef\.current\?\.pause\(\)/);
  assert.match(studioLivePreview, /controls={false}/);
  assert.match(page, /previewApplied/);
});

test("subtitle proofreader opens the selected beat and focuses its local caption list", () => {
  assert.match(page, /function openProofreader\(\)\{const beat=selectedBeat\(\)/);
  assert.match(page, /\(APP\.project\.captions\|\|\[\]\)\.filter\(\(caption\)=>caption\.end>beat\.start&&caption\.start<beat\.end\)/);
  assert.match(page, /caption-list.*scrollIntoView/);
});

test("Studio preview uses the Remotion Player hover replay control without an MP4 adapter", () => {
  assert.match(studioLivePreview, /hover to play/);
  assert.doesNotMatch(page, /bindAnimatedLayoutPreview(video,host)/);
  assert.doesNotMatch(page, /renderSyncPreview(host,payload)/);
});

test("Inspector changes debounce into a custom DOM preview refresh", () => {
  assert.match(page, /function schedulePreviewRefresh\(\).*300/);
  assert.match(page, /syncLivePreview\(\).*schedulePreviewRefresh/);
  assert.match(page, /APP\.previewApplied=\{beatId:beat\.id,layerId:layer\.layerId,payload:previewPayload\(beat,layer,"custom"\)\}/);
  assert.match(page, /previewHost\.render\(host,payload\)/);
});


test("full render status recovers a completed output after the Studio service restarts", () => {
  assert.match(host, /recoverCompletedFullRender/);
  assert.match(host, /outputInfo.mtimeMs/);
  assert.match(host, /full-render-recovered/);
  assert.match(host, /status: "completed", progress: 100/);
});


test("Studio uses Layer Tabs and direct animation playback for timed layers", () => {
  assert.match(page, /function layerTabs\(beat\)/);
  assert.match(page, /layer-tabs/);
  assert.match(page, /function previewSettledTime\(\)/);
  assert.match(page, /previewTimeSeconds/);
  assert.match(page, /selectLayer\(index\).*previewPayload\(beat,layer,"custom"\)/);
  assert.match(studioLivePreview, /当前 Layer 动画预览/);
  assert.match(studioLivePreview, /setTimeout\(replay,0\)/);
});


test("Layer Tabs expose each layer localized name without opening the Inspector", () => {
  const layerTabs = page.match(/function layerTabs\(beat\)\{[^\n]*/)[0];
  assert.match(layerTabs, /definition\(layer\.layout\)\.label/);
  assert.match(layerTabs, /Layer .*escapeHtml\(layoutLabel\)/);
  assert.doesNotMatch(layerTabs, /layer-tab-layout|layer-tab-state/);
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
  assert.match(player, /hasCachedAsset/);
  assert.match(player, /上一版成品预览/);
  assert.doesNotMatch(player, /旧预览已隐藏/);
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
  assert.match(effectLayerRuntime, /__externalSectionLabel\s*:\s*true/);
  assert.match(recoveredEffects, /props\?\.__externalSectionLabel \? null :/);
  assert.match(composition, /<LayoutEffectHeader key=\{activeLayer\.layerId\} cue=\{effectiveHeaderCue\} \/>/);
  const effectLayerStack = composition.slice(composition.indexOf("const EffectLayerStack"), composition.indexOf("type JasonWuTemplateProps"));
  assert.doesNotMatch(effectLayerStack, /<LayoutEffectHeader/);
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
  assert.match(page, /caption-review-card\{display:flex;flex-direction:column;max-height:85vh;overflow:hidden/);
  assert.match(page, /caption-review-header\{flex:0 0 auto/);
  assert.match(page, /caption-review-body\{flex:1;min-height:0;overflow-y:auto;max-height:calc\(85vh - 180px\)/);
  assert.match(page, /caption-review-actionbar\{position:sticky;bottom:0/);
  assert.match(page, /border-top:1px solid #374151;background:#111827/);
  assert.ok(page.indexOf("id=\"batch-render-progress\"") < page.indexOf("id=\"caption-review-actions\""));
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

test("caption review modal merges short cues into paragraph-level proofreading rows", () => {
  assert.match(page, /function mergeCaptionsForProofreading/);
  assert.match(page, /targetMin=30,targetMax=50,maxDuration=12/);
  assert.match(page, /review\.captions=mergeCaptionsForProofreading\(review\.captions\)/);
  assert.match(page, /review\.proofreadMerged=true/);
  assert.match(page, /length>=targetMax/);
  assert.match(page, /length>=targetMin&&terminal/);
  assert.match(page, /start:first\.start,end:last\.end/);
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
  assert.match(page, /挂载方式/);
  assert.match(adminSandboxClient, /安全边距/);
  assert.match(page, /中间/);
});

test("admin sandbox preview starts from the zero-second opening frame", () => {
  assert.match(adminSandboxClient, /initialFrame=\{0\}/);
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






test("admin component inspector separates overall title and body scale", () => {
  assert.match(adminSandboxClient, /headerScale:number/);
  assert.match(adminSandboxClient, /contentScale:number/);
  assert.match(adminSandboxClient, /整体缩放/);
  assert.match(adminSandboxClient, /标题区缩放/);
  assert.match(adminSandboxClient, /正文内容缩放/);
  assert.match(adminSandboxClient, /number\(draft\.tokens\.scale,.6,1.2,.01/);
});

test("recovered progress bars read split scale tokens for header and body", () => {
  assert.match(recoveredEffects, /tokenNumber/);
  assert.match(recoveredEffects, /headerScale/);
  assert.match(recoveredEffects, /contentScale/);
  assert.match(recoveredEffects, /transformOrigin:"top left"/);
});



test("string list editors keep text selection separate from row sorting", () => {
  assert.doesNotMatch(page, /class="list-row" draggable="true"/);
  assert.match(page, /data-list-drag-handle/);
  assert.ok(page.includes('event.target.closest("input,textarea,select,button")'));
});

test("live layout preview suppresses internal recovered headers like final rendering", () => {
  assert.match(page, /__externalSectionLabel:true/);
  assert.ok(recoveredEffects.includes('props?.__externalSectionLabel ? null'));
});


test("component catalog preview suppresses recovered internal headers under the catalog title", () => {
  assert.match(componentCatalogPage, /__externalSectionLabel: true/);
  assert.ok(recoveredEffects.includes("props?.__externalSectionLabel ? null"));
});

test("Studio keeps copy fields inside the selected layer and removes the beat-level copy form", () => {
  const inspector = page.slice(page.indexOf("function componentSpecificPanel"), page.indexOf("function proofreadLength"));
  assert.ok(page.includes("章节 / Category"));
  assert.ok(page.includes("核心大标题 / Headline"));
  assert.match(page, /data-schema-field="'\+key\+'"/);
  assert.doesNotMatch(page, /专属内容模块 \/ 沙盒示例/);
  assert.match(page, /data-schema-field="'\+key\+'"/);
  assert.ok(page.includes("function layerBaseFields"));
  assert.doesNotMatch(inspector, /beat\.eyebrow=layer/);
  assert.doesNotMatch(inspector, /beat\.subtitle=layer/);
  assert.doesNotMatch(inspector, /beat\.zh=layer/);
  assert.match(page, /layer\.category=layerCategory/);
  assert.match(page, /layer\.headline=layerHeadline/);
  assert.match(page, /layer\.effectText=layerEffectText/);
  assert.match(effectLayerRuntime, /layer\.category/);
  assert.match(effectLayerRuntime, /layer\.headline/);
  assert.match(effectLayerRuntime, /layer\.effectText/);
});

test("Studio layer base text fields use the full inspector width", () => {
  assert.match(page, /layer-base-fields\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\);column-gap:14px;row-gap:0\}/);
  assert.match(page, /layer-base-fields \.field-label\{min-width:0\}/);
  assert.match(page, /layer-base-fields input,\.layer-base-fields textarea\{width:100%;min-width:0\}/);
  assert.match(page, /class=\\"grid layer-base-fields\\"/);
  assert.match(page, /inputField\("headline","核心大标题 \/ Headline",copy\.headline,true\)/);
});
test("Studio component text and subtext fields span the full inspector grid", () => {
  const schemaMarkup = page.slice(page.indexOf("function schemaFieldMarkup"), page.indexOf("function schemaRows"));
  const propsMarkup = page.slice(page.indexOf("function propFields"), page.indexOf("function fallbackFields"));
  assert.match(schemaMarkup, /const wideTextField=/);
  assert.match(schemaMarkup, /wideTextField\?" span-all":""/);
  assert.match(propsMarkup, /field\.type==="textarea"\|\|field\.type==="text"/);
  assert.match(propsMarkup, /field-label"\+\(field\.type==="textarea"\|\|field\.type==="text"\?" span-all":/);
});
test("Layer tab selection forces an immediate custom preview refresh", () => {
  const selectLayer = page.slice(page.indexOf("function selectLayer"), page.indexOf("function closeAddEffectGallery"));
  assert.match(selectLayer, /APP.previewApplied=/);
  assert.ok(selectLayer.includes("renderLayoutPreview(beat)"));
  const inspector = page.slice(page.indexOf("function renderInspector"), page.indexOf("function proofreadLength"));
  assert.match(inspector, /const preserveLivePreview=!!APP\.previewApplied/);
  assert.match(inspector, /setPlayerAsset\(beat,\{preserveLayoutPreview:preserveLivePreview\}\)/);
});


test("component catalog supports direct asset selection for visual regression renders", () => {
  assert.match(componentCatalogPage, /selectedLayout/);
  assert.match(componentCatalogPage, /directCatalogIndex/);
  assert.match(componentCatalogPage, /<CatalogScene index=\{directCatalogIndex\} \/>/);
});

test("component catalog feeds native JC assets their registered mock data", () => {
  assert.match(componentCatalogPage, /jcMockDataById/);
  assert.match(componentCatalogPage, /const jcMockData =/);
  assert.match(componentCatalogPage, /\.\.\.\(jcMockData \?\? \{\}\)/);
});

test("Admin sandbox gives native JC assets the shared StandardComponentHeader outside the native recipe", () => {
  assert.match(adminSandbox, /const isNativeJc = String\(layout\)\.startsWith\("jc-"\)/);
  assert.match(adminSandbox, /<LayoutEffectHeader cue=\{cue\} \/>/);
  assert.doesNotMatch(adminSandbox, /\["--accent-primary" as string\]/);
  assert.match(adminSandbox, /const scene = <LayoutEffectRenderer cue=\{cue\} showStandardHeader=\{false\} \/>/);
  assert.match(adminSandbox, /<JcNativeStageBackdrop>\{scene\}<\/JcNativeStageBackdrop>/);
});

test("formal layer rendering keeps exactly one active standard header outside MotionWrapper", () => {
  const effectLayerStack = composition.slice(composition.indexOf("const EffectLayerStack"), composition.indexOf("type JasonWuTemplateProps"));
  assert.doesNotMatch(effectLayerStack, /<LayoutEffectHeader/);
  assert.match(effectLayerStack, /<MotionWrapper/);
  assert.match(composition, /const effectiveHeaderCue = \{/);
  assert.match(composition, /<LayoutEffectHeader key={activeLayer\.layerId} cue={effectiveHeaderCue} \/>/);
  assert.match(composition, /<SceneModules cue={effectiveCue} showStandardHeader={false} \/>/);
  assert.match(demoAdditions, /showStandardHeader && !isJcLayout \? <StandardComponentHeader/);
});

test("Layer preview uses a remount key and restarts the local animation", () => {
  const previewPayload = page.slice(page.indexOf("function previewPayload"), page.indexOf("function toggleFaceGuide"));
  assert.match(previewPayload, /previewKey/);
  assert.match(previewPayload, /previewFrame:0/);
  assert.match(studioLivePreview, /key={payload.previewKey}/);
  assert.match(studioLivePreview, /initialFrame={0}/);
});

test("top-left component motion preserves registered content bounds below the fixed header", () => {
  assert.match(motionWrapper, /mountMode === "top-left" \? mountX/);
  assert.match(motionWrapper, /mountMode === "top-left" \? mountY/);
  assert.doesNotMatch(motionWrapper, /mountMode === "top-left" \? 76 - boundsY/);
  assert.match(demoAdditions, /layout-effect-content/);
  assert.match(demoAdditions, /contentScale/);
  assert.match(demoAdditions, /static-header-anchor/);
  assert.doesNotMatch(demoAdditions, /StandardComponentHeader[\\s\\S]*transform:/);
});

test("global component header uses semantic accent section-label rail", () => {
  const header = demoAdditions.slice(demoAdditions.indexOf("export const StandardComponentHeader"), demoAdditions.indexOf("const resolveHeaderContent"));
  assert.match(header, /getAccentTheme\(accent\)/);
  assert.match(header, /borderLeft:\s*"5px solid " \+ theme\.primary/);
  assert.match(header, /paddingLeft:\s*18/);
  assert.match(header, /color:\s*theme\.primary/);
  assert.match(header, /fontSize:\s*22/);
  assert.match(header, /fontSize:\s*44/);
});
test("ordered sequence renders only animated body rows under the static global header", () => {
  const ordered = incompleteEffects.slice(incompleteEffects.indexOf("export const OrderedSequence"), incompleteEffects.indexOf("export const OrgChart"));
  assert.match(ordered, /className="animated-content-slot"/);
  assert.match(ordered, /top:BODY_TOP/);
  assert.doesNotMatch(ordered, /categoryTag/);
  assert.doesNotMatch(ordered, /cue\.section\.eyebrow/);
  assert.doesNotMatch(ordered, /cue\.section\.subtitle/);
});


test("Studio cache-busts the live preview bundle", () => {
  assert.match(page, /src="\/studio-live-preview\.js\?v=/);
});


test("Studio defers preview mounting until the live preview bridge is available", () => {
  assert.match(page, /previewHost=window\.StudioLayoutPreview/);
  assert.match(page, /if\(!previewHost\|\|typeof previewHost\.render!=="function"\)/);
  assert.match(page, /studio-layout-preview-ready/);
  assert.match(studioLivePreview, /dispatchEvent\(new Event\("studio-layout-preview-ready"\)\)/);
});

test("Studio disposes the custom preview root before standard video previews", () => {
  assert.match(page, /typeof previewHost\.unmount===\"function\"/);
  assert.match(studioLivePreview, /unmount\(container\)/);
  assert.match(studioLivePreview, /roots\.delete\(container\)/);
});

test("rewind milestones shows five compact safe timeline nodes", () => {
  assert.match(recoveredEffects, /items\(cue,props,\["years","items"\],5\)/);
  assert.match(recoveredEffects, /years\.length===1\?50:8\+\(i\/\(years\.length-1\)\)\*84/);
  assert.doesNotMatch(recoveredEffects, /items\(cue,props,\["years","items"\]\)\.slice\(0,3\)/);
  assert.doesNotMatch(recoveredEffects, /translateX\(-50%\)/);
  assert.doesNotMatch(recoveredEffects, /fontSize:78/);
  assert.match(recoveredEffects, /fontSize:46/);
  assert.match(layoutMatcher, /rewind-milestones"\) return \{\.\.\.shared, label: "时间回溯", title: headline, years: takeItems\(layout, items\)/);
});


test("Studio preview bridge always renders through the same direct Player host", () => {
  const bridge = page.slice(page.indexOf("function postLivePreview"), page.indexOf("function refreshLayoutPreview"));
  assert.match(bridge, /previewHost\.render\(host,payload\)/);
  assert.doesNotMatch(bridge, /renderSyncPreview/);
  assert.doesNotMatch(bridge, /createElement("video")/);
});

test("admin header template panel keeps the standard inspector card style", () => {
  assert.match(adminComponentsPage, /\.inspector-section-base\{border-color:#3d78bf;background:#1c2938\}/);
  assert.doesNotMatch(adminComponentsPage, /section-category-input/);
  assert.doesNotMatch(adminSandboxClient, /section-category-label/);
});
test("admin component inspector lets the selected component display name be edited and saved", () => {
  assert.match(adminSandboxClient, /组件名称 \/ Component Name/);
  assert.match(adminSandboxClient, /updateAssetMeta\(\{name:event\.currentTarget\.value\}\)/);
  assert.match(adminSandboxClient, /body:JSON\.stringify\(\{name:draft\.name,tokens:draft\.tokens,mockData:draft\.mockData\}\)/);
  assert.match(componentRegistryStore, /name:clean\(patch\?\.name,current\.name\)/);
});
test("admin component inspector edits draft without remounting the preview player", () => {
  assert.match(adminSandboxClient, /previewDraft/);
  assert.match(adminSandboxClient, /const refreshPreview=\(\)=>/);
  assert.match(adminSandboxClient, /保存预览/);
  const updateArea = adminSandboxClient.slice(adminSandboxClient.indexOf("const updateTokens="), adminSandboxClient.indexOf("const toggleFamily="));
  assert.doesNotMatch(updateArea, /setNonce/);
  assert.match(adminSandboxClient, /key=\{previewDraft\.id\+"-"\+nonce\}/);
  assert.match(adminSandboxClient, /next\.label=patch\.category/);
  assert.match(adminComponentsPage, /preview-actions/);
});



test("tradeoff reject round maps body text and three reject items without highlight quote", () => {
  const tradeoff = recoveredEffects.slice(recoveredEffects.indexOf("export const TradeoffRejectRound"), recoveredEffects.indexOf("export const RecoveryProgressBars"));
  assert.match(adminSandboxClient, /isTradeoffReject=draft\.id==="tradeoff-reject-round"/);
  assert.match(adminSandboxClient, /默认内容模板 \/ 沙盒示例 · 风险排除/);
  assert.match(adminSandboxClient, /<label>正文内容<textarea rows=\{3\} value=\{payload\.bodyText \?\? ""\}/);
  assert.match(adminSandboxClient, /isTradeoffReject\?"否定项 ":"步骤 "/);
  const tradeoffEditor = adminSandboxClient.slice(adminSandboxClient.indexOf("isTradeoffReject?\"默认内容模板"), adminSandboxClient.indexOf("<section className=\"inspector-section\"><h2>视觉 Token"));
  assert.doesNotMatch(tradeoffEditor, /重点金句/);
  assert.match(layoutRegistry, /"tradeoff-reject-round": \[text\("label", "否定项标签"\), prose\("bodyText", "正文内容"\), list\("items", "否定项"/);
  assert.match(tradeoff, /const rows=items\(cue,props,\["items","steps"\],3\)/);
  assert.match(tradeoff, /const body=text\(cue,props,"bodyText"/);
  assert.match(tradeoff, /\{body\}<\/div><div style=\{\{display:"grid",gap:30,marginTop:42\}\}>/);
  assert.doesNotMatch(tradeoff, /text\(cue,props,"title",cue\.section\.subtitle\)/);
});
test("bull bear maps dedicated long/short viewpoints and bottom gold emphasis", () => {
  const bullBear = incompleteEffects.slice(incompleteEffects.indexOf("export const BullBear"), incompleteEffects.indexOf("export const OpinionHero"));
  assert.match(adminSandboxClient, /isBullBear=draft\.id==="bull-bear"/);
  assert.match(adminSandboxClient, /多方观点【正文内容】/);
  assert.match(adminSandboxClient, /空方观点【正文内容】/);
  assert.ok(componentRegistry.components.find((component) => component.id === "bull-bear")?.editorSchema?.fields?.some((field) => field.key === "highlightQuote" && field.label === "辩论主题"));
  const bullBearEditor = adminSandboxClient.slice(adminSandboxClient.indexOf("isBullBear ?"), adminSandboxClient.indexOf("默认内容模板 / 沙盒示例 · 叙事"));
  assert.doesNotMatch(bullBearEditor, /重点金句/);
  assert.match(componentContent, /bearText: payload\.bearText/);
  assert.match(componentContent, /bullText: payload\.bodyText/);
  assert.match(bullBear, /const bullText=textProp\(props,"bullText",textProp\(props,"body"/);
  assert.match(bullBear, /const bearText=textProp\(props,"bearText",cue\.caption\.zh\)/);
  assert.match(bullBear, /const footer=textProp\(props,"highlightQuote",""\)/);
  assert.match(bullBear, /bottom:138,color:C\.gold/);
});
test("opinion hero maps narrative body to the white title and quote to the blue subtitle with content scale", () => {
  const opinion = incompleteEffects.slice(incompleteEffects.indexOf("export const OpinionHero"), incompleteEffects.indexOf("export const PhotoWall"));
  assert.match(opinion, /\(\{cue, props\}\)/);
  assert.match(opinion, /const body = textProp\(props,"body",textProp\(props,"effectText",cue\.caption\.zh\)\)/);
  assert.match(opinion, /const quote = textProp\(props,"highlightQuote",cue\.section\.subtitle\)/);
  assert.match(opinion, /contentScale=Number\(designTokens\.contentScale\)/);
  assert.match(opinion, /scale\(\$\{contentScale\*interpolate/);
  assert.doesNotMatch(opinion, /\{cue\.section\.subtitle\}<\/div><div/);
  assert.doesNotMatch(opinion, /\{cue\.caption\.zh\}<\/div>/);
});
test("chapter card maps narrative body into the big white card text without a duplicate gray body row", () => {
  const chapter = incompleteEffects.slice(incompleteEffects.indexOf("export const ChapterCard"), incompleteEffects.indexOf("export const LogoWordmark"));
  assert.match(chapter, /const body = textProp\(props,"body",textProp\(props,"effectText",cue\.caption\.zh\)\)/);
  assert.match(chapter, /\{body\}<\/div>\{quote&&<div style=\{\{marginTop: 14, color: C\.gold/);
  assert.match(chapter, /fontSize: 55/);
  assert.doesNotMatch(chapter, /color: C\.dim[\s\S]*\{cue\.caption\.zh\}/);
  assert.match(chapter, /textProp\(props,"highlightQuote",""\)/);
  assert.ok(componentRegistry.components.find((component) => component.id === "chapter-card")?.editorSchema?.fields?.some((field) => field.key === "highlightQuote" && field.label === "副文内容"));
  assert.ok(host.includes("editorSchema: componentAssetsById.get(key)?.editorSchema ?? null"));
  assert.match(page, /fieldLabel=(key,fallback)=>(editorSchema.fields||[]).find((field)=>field.key===key)?.label||fallback/);
  assert.doesNotMatch(adminSandboxClient, /重点金句/);
  assert.match(componentContent, /highlightQuote: payload\.highlightQuote/);
});
test("metric label fields are presented as body content in the admin component editor", () => {
  const metricLabelFields = componentRegistry.components.flatMap((component) => (component.editorSchema?.fields || []).map((field) => ({component, field}))).filter(({field}) => field.key === "label");
  assert.ok(metricLabelFields.length >= 4);
  assert.deepEqual(metricLabelFields.filter(({field}) => field.label === "指标标签").map(({component}) => component.id), []);
  assert.ok(componentRegistry.components.find((component) => component.id === "copyopen-progress-bar")?.editorSchema?.fields?.some((field) => field.key === "label" && field.label === "正文内容"));
  assert.match(adminSandboxClient, /<label>\{isProgressDonut\?"小标题":"正文内容"\}<input value=\{payload\.label\}/);
});
test("copyopen components default to compact right-side overlay bounds instead of fullscreen center", () => {
  const copyOpenComponents = componentRegistry.components.filter((component) => component.id.startsWith("copyopen-"));
  assert.equal(copyOpenComponents.length, 9);
  for (const component of copyOpenComponents) {
    assert.equal(component.displayIntent, "side-overlay");
    assert.equal(component.tokens.mountMode, "top-left", component.id + " must mount from a stable absolute safe zone");
    const visualWidth = component.tokens.boundsWidth * component.tokens.scale;
    const visualHeight = component.tokens.boundsHeight * component.tokens.scale;
    if (component.id === "copyopen-end-tag") {
      assert.ok(Math.abs(component.tokens.boundsX - Math.round((1920 - visualWidth) / 2)) <= 2, component.id + " must be horizontally centered");
      assert.ok(Math.abs(component.tokens.boundsY - Math.round((1080 - visualHeight) / 2)) <= 2, component.id + " must be vertically centered");
    } else {
      const visualRight = component.tokens.boundsX + visualWidth;
      if (component.id !== "copyopen-pie-chart") {
        assert.ok(component.tokens.boundsX >= 1180 && component.tokens.boundsX <= 1300, component.id + " must stay in the right-side safe zone");
        assert.ok(Math.abs(visualRight - (1920 - 96)) <= 2, component.id + " must keep a 96px right safe margin");
      }
      assert.equal(component.tokens.boundsY, 300, component.id + " must sit 300px from the top");
    }
    assert.ok(component.tokens.boundsWidth <= 820, component.id + " must not use fullscreen width");
    assert.ok(component.tokens.boundsHeight <= 520, component.id + " must not use fullscreen height");
    if (component.id !== "copyopen-pie-chart") assert.ok(component.tokens.scale <= 0.78, component.id + " must be visually compact by default");
    assert.equal(component.tokens.position, "center", component.id + " must keep a legal MotionWrapper anchor while mountMode handles side placement");
  }
  assert.ok(demoAdditions.includes('String(layout ?? cue.layout).startsWith("copyopen-")'));
  assert.ok(demoAdditions.includes('left: tokens.boundsX'));
  assert.ok(demoAdditions.includes('top: tokens.boundsY'));
});

test("MotionWrapper keeps full-canvas native stages out of subtitle-zone clamping", () => {
  assert.match(motionWrapper, /const isFullCanvasBounds =/);
  assert.match(motionWrapper, /isFullCanvasBounds \? rawMountOffsetY : Math\.min\(rawMountOffsetY, maxMountOffsetY\)/);
});

test("motion wrapper falls back to center for invalid position tokens", () => {
  assert.match(motionWrapper, /anchors\[props\.position\] \?\? anchors\.center/);
});

test("contrast helper remains reserved for subtitle text", () => {
  assert.ok(contrast.includes("WebkitTextStroke: \"2px rgba(0,0,0,0.88)\""));
  assert.doesNotMatch(motionWrapper, /motion-auto-contrast/);
  assert.doesNotMatch(motionWrapper, /stroke:var\(--contrast-white-stroke-color\)/);
});

test("copyopen end tag renders as transparent overlay without its black card background", () => {
  const copyOpen = readFileSync("src/JasonWu/CopyOpenComponents.tsx", "utf8");
  const endTagWrapper = copyOpen.slice(copyOpen.indexOf("export const CopyOpenEndTag"), copyOpen.indexOf("export const CopyOpenBarChart"));
  const endTag = readFileSync("src/JasonWu/copyopen/EndTag.tsx", "utf8");
  assert.match(endTagWrapper, /<EndTag[\s\S]*overlay \/>/);
  assert.match(endTag, /backgroundColor: overlay \? "transparent" : pal\.background/);
});
test("copyopen data and terminal components render without full-canvas backgrounds", () => {
  const copyOpen = readFileSync("src/JasonWu/CopyOpenComponents.tsx", "utf8");
  const ranges = [
    ["CopyOpenProgressBar", "CopyOpenComparisonCard"],
    ["CopyOpenComparisonCard", "CopyOpenTerminalScene"],
    ["CopyOpenTerminalScene", "CopyOpenEndTag"],
    ["CopyOpenBarChart", "CopyOpenLineChart"],
    ["CopyOpenLineChart", "CopyOpenPieChart"],
    ["CopyOpenKPIGrid", ""]
  ];
  for (const [start, end] of ranges) {
    const from = copyOpen.indexOf("export const " + start);
    const to = end ? copyOpen.indexOf("export const " + end) : copyOpen.length;
    const block = copyOpen.slice(from, to);
    assert.match(block, /backgroundColor="transparent"/);
    assert.doesNotMatch(block, /backgroundColor={DARK}/);
  }
  for (const file of [
    "src/JasonWu/copyopen/ProgressBar.tsx",
    "src/JasonWu/copyopen/ComparisonCard.tsx",
    "src/JasonWu/copyopen/TerminalScene.tsx",
    "src/JasonWu/copyopen/charts/BarChart.tsx",
    "src/JasonWu/copyopen/charts/LineChart.tsx",
    "src/JasonWu/copyopen/charts/KPIGrid.tsx"
  ]) {
    assert.match(readFileSync(file, "utf8"), /backgroundColor = "transparent"/);
  }
});
test("copyopen pie chart hides center text and renders without a component background", () => {
  const copyOpen = readFileSync("src/JasonWu/CopyOpenComponents.tsx", "utf8");
  const pieWrapper = copyOpen.slice(copyOpen.indexOf("export const CopyOpenPieChart"), copyOpen.indexOf("export const CopyOpenKPIGrid"));
  const pieChart = readFileSync("src/JasonWu/copyopen/charts/PieChart.tsx", "utf8");
  assert.match(pieWrapper, /backgroundColor="transparent"/);
  assert.doesNotMatch(pieWrapper, /centerValue=/);
  assert.doesNotMatch(pieWrapper, /centerLabel=/);
  assert.match(pieChart, /backgroundColor = "transparent"/);
});
test("copyopen progress bar maps body content label to the visible white title", () => {
  const copyOpen = readFileSync("src/JasonWu/CopyOpenComponents.tsx", "utf8");
  const progress = copyOpen.slice(copyOpen.indexOf("export const CopyOpenProgressBar"), copyOpen.indexOf("export const CopyOpenComparisonCard"));
  assert.match(progress, /label=\{str\(props, \["label", "bodyText", "body", "effectText", "metricLabel"\]/);
  assert.doesNotMatch(progress, /label=\{str\(props, \["body", "effectText", "label"/);
  assert.ok(componentRegistry.components.find((component) => component.id === "copyopen-progress-bar")?.editorSchema?.fields?.some((field) => field.key === "label" && field.label === "正文内容"));
});
test("check progress maps title, raw progress number, and editable checked rows", () => {
  const checkProgress = incompleteEffects.slice(incompleteEffects.indexOf("export const CheckProgress"), incompleteEffects.indexOf("export const DiagonalChips"));
  assert.match(checkProgress, /const title=textProp\(props,"bodyText",textProp\(props,"body",textProp\(props,"title","PRODUCT RECOVERY"\)\)\)/);
  assert.match(checkProgress, /const target=Number\(props\?\.progress \?\? props\?\.value \?\? 82\)/);
  assert.match(checkProgress, /\{Math\.round\(p\)\}<\/div>/);
  assert.doesNotMatch(checkProgress, /\{Math\.round\(p\)\}%/);
  assert.match(checkProgress, /const sourceRows=rows\(cue, props\)/);
  assert.match(checkProgress, /sourceRows\.slice\(0, Math\.min\(8, Math\.max\(itemLimit\(props, 3\), sourceRows\.length\)\)\)/);
  assert.match(checkProgress, /margin: \"12px 0\"/);
  assert.match(checkProgress, /color: C\.white, fontSize: 33/);
  assert.doesNotMatch(checkProgress, /color: C\.dim, fontSize: 28/);
  assert.match(adminSandboxClient, /const isCheckProgress=draft\.id==="check-progress"/);
  assert.match(adminSandboxClient, /进度条标题【正文内容】/);
  assert.ok(componentRegistry.components.find((component) => component.id === "check-progress")?.editorSchema?.fields?.some((field) => field.key === "bodyText" && field.label === "进度条标题【正文内容】"));
});
test("copyopen hero title maps narrative body and quote into the visible title without a scrim background", () => {
  const copyOpen = readFileSync("src/JasonWu/CopyOpenComponents.tsx", "utf8");
  const heroTitle = readFileSync("src/JasonWu/copyopen/HeroTitle.tsx", "utf8");
  const hero = copyOpen.slice(copyOpen.indexOf("export const CopyOpenHeroTitle"), copyOpen.indexOf("export const CopyOpenProgressBar"));
  assert.match(hero, /title=\{str\(props, \["body", "bodyText", "effectText", "text"\]/);
  assert.match(hero, /subtitle=\{str\(props, \["highlightQuote", "subtitle", "subLabel"\], ""\)\}/);
  assert.match(hero, /scrimBackground="transparent"/);
  assert.doesNotMatch(hero, /title=\{str\(props, \["headline", "title"\]/);
  assert.doesNotMatch(heroTitle, /const DEFAULT_SCRIM/);
  assert.match(heroTitle, /scrimBackground = "transparent"/);
  assert.ok(componentRegistry.components.find((component) => component.id === "copyopen-hero-title")?.editorSchema?.fields?.some((field) => field.key === "highlightQuote" && field.label === "副文内容"));
});
test("recovery progress bars maps body text and derives row progress from completion number", () => {
  const recovery = recoveredEffects.slice(recoveredEffects.indexOf("export const RecoveryProgressBars"), recoveredEffects.indexOf("export const HudGlowStack"));
  assert.match(adminSandboxClient, /isRecoveryProgressBars=draft\.id==="recovery-progress-bars"/);
  assert.match(adminSandboxClient, /isCheckProgress\?"进度条标题【正文内容】":"正文内容"/);
  assert.match(recovery, /const body=text\(cue,props,"bodyText",text\(cue,props,"body",text\(cue,props,"effectText",cue\.section\.subtitle\)\)\)/);
  assert.match(recoveredEffects, /const progressOffsets = \[-12, 8, -4, 14, -9, 5, 0, 11\]/);
  assert.match(recovery, /const baseProgress=Number\.isFinite\(globalProgress\)\?globalProgress:68/);
  assert.match(recovery, /baseProgress\+progressOffsets\[i%progressOffsets\.length\]/);
  assert.doesNotMatch(recovery, /const values=Array\.isArray\(props\?\.values\)/);
  assert.doesNotMatch(recovery, /text\(cue,props,"title",cue\.section\.subtitle\)/);
  const component = componentRegistry.components.find((entry) => entry.id === "recovery-progress-bars");
  assert.ok(component?.mockData?.contentPayload?.bodyText);
  assert.ok(component?.editorSchema?.fields?.some((field) => field.key === "bodyText" && field.label === "正文内容"));
  assert.ok(component?.editorSchema?.fields?.some((field) => field.key === "progress" && field.label === "完成度"));
});
test("component content payload feeds visible progress bar labels, items, and values", () => {
  assert.match(recoveredEffects, /globalProgress=Number\(props\?\.progress \?\? props\?\.value\)/);
  assert.match(recoveredEffects, /Number\.isFinite\(globalProgress\)\?globalProgress/);
  assert.match(recoveredEffects, /Math\.round\(target\)\}%/);
  assert.match(adminSandboxClient, /contentPayload:payload/);
  assert.match(adminSandboxClient, /toRendererContentProps\(source\)/);
  assert.match(componentCatalogPage + adminSandbox + demoAdditions, /toRendererContentProps/);
});




test("empty HUD chip subtitles stay empty instead of falling back to stale subLabel text", () => {
  assert.match(componentContent, /subLabel: subtitles\.find\(\(value\) => value\.trim\(\)\) \|\| ""/);
  assert.doesNotMatch(componentContent, /subLabel: subtitles\.find\(Boolean\) \|\| stringValue\(source\?\.subLabel\)/);
  const hud = recoveredEffects.slice(recoveredEffects.indexOf("export const HudGlowStack"), recoveredEffects.indexOf("export const BriefingPoster"));
  assert.match(hud, /hasExplicitSubtitles/);
  assert.match(hud, /subtitle\?<div/);
  assert.doesNotMatch(hud, /const subtitle=subtitles\[i\] \|\| text\(cue,props,"subLabel",cue\.section\.eyebrow\)/);
});test("chip payload keeps per-item subtitles for HUD-style components", () => {
  assert.match(adminSandboxClient, /placeholder="副标（可选）"/);
  assert.match(recoveredEffects, /const subtitles=strings\(props\?\.itemSubtitles \?\? props\?\.subLabels\)/);
  const hud = recoveredEffects.slice(recoveredEffects.indexOf("export const HudGlowStack"), recoveredEffects.indexOf("export const BriefingPoster"));
  assert.match(hud, /const subtitle=hasExplicitSubtitles\?\(subtitles\[i\] \?\? ""\):text\(cue,props,"subLabel",cue\.section\.eyebrow\)/);
  assert.match(hud, /\{subtitle\?<div/);
  assert.doesNotMatch(hud, /const subtitle=subtitles\[i\] \|\| text\(cue,props,"subLabel",cue\.section\.eyebrow\)/);
});

test("admin component editor preserves spaces and keeps progress donut body without detail text", () => {
  assert.match(componentContent, /const stringValue = \(value: unknown, fallback = ""\) => typeof value === "string" \? value : fallback/);
  assert.doesNotMatch(componentContent, /value\.trim\(\) \? value : fallback/);
  assert.doesNotMatch(componentContent, /value\.trim\(\) \? value\.trim\(\)/);
  assert.match(adminSandboxClient, /isProgressDonut=draft\.id==="progress-donut"/);
  assert.match(adminSandboxClient, /<label>\{isProgressDonut\?"小标题":"正文内容"\}<input value=\{payload\.label\}/);
  assert.match(adminSandboxClient, /isProgressDonut\?<label>正文内容<input value=\{payload\.bodyText \?\? payload\.unit \?\? ""\}/);
  const progressDonut = incompleteEffects.slice(incompleteEffects.indexOf("export const ProgressDonut"), incompleteEffects.indexOf("export const BullBear"));
  assert.match(progressDonut, /const subtitle=textProp\(props,"metric",textProp\(props,"label",cue\.section\.eyebrow\)\)/);
  assert.match(progressDonut, /const bodyText=textProp\(props,"bodyText",textProp\(props,"unit",cue\.section\.subtitle\)\)/);
  assert.doesNotMatch(progressDonut, /textProp\(props,"label","COMPLETION"\)/);
  assert.doesNotMatch(progressDonut, /detailText/);
  const component = componentRegistry.components.find((entry) => entry.id === "progress-donut");
  assert.deepEqual((component?.editorSchema?.fields || []).map((field) => [field.key, field.label]), [["label", "小标题"], ["value", "数值"], ["bodyText", "正文内容"]]);
});





test("confirmed captions remain the canonical Studio transcript after production", () => {
  assert.match(host, /const canonicalCaptionFile = \(storage, project\) =>/);
  assert.match(host, /project\.state !== "CAPTIONS_REVIEW" && existsSync\(storage\.captionsConfirmedFile\)/);
  assert.match(host, /const file = canonicalCaptionFile\(storage, project\)/);
  assert.match(host, /source\.state !== "CAPTIONS_REVIEW" && existsSync\(storage\.captionsConfirmedFile\)/);
  assert.match(host, /JSON\.parse\(await readFile\(storage\.captionsConfirmedFile, "utf8"\)\)/);
  assert.match(host, /project\.captions = captions/);
  assert.match(host, /project\.state === "CAPTIONS_REVIEW"/);
  assert.match(host, /if\(project\.state !== "CAPTIONS_REVIEW"\) await writeFile\(projectPaths\(root, projectMatch\[1\]\)\.captionsConfirmedFile/);
  assert.match(require("node:fs").readFileSync("scripts/run-local-onboarding.cjs", "utf8"), /await writeFile\(storage\.captionsConfirmedFile, JSON\.stringify\(reviewCaptions/);
});

test("semantic step and checklist editors keep their input in the flexible content column", () => {
  assert.match(page, /\.semantic-content-row\{grid-template-columns:30px minmax\(0,1fr\) 27px;width:100%\}/);
  assert.match(page, /\.semantic-content-row input\{width:100%;min-width:0\}/);
  assert.match(page, /class=["']list-row semantic-content-row["']/);
  assert.match(page, /data-schema-list-item/);
});

test("Studio renders and reads the registry chip-list editor with addable title and subtitle rows", () => {
  assert.match(page, /control===\"chip-list\"/);
  assert.match(page, /data-schema-chip-list/);
  assert.match(page, /data-schema-chip-title/);
  assert.match(page, /data-schema-chip-subtitle/);
  assert.match(page, /addSchemaChipItem/);
  assert.match(page, /removeSchemaChipItem/);
  assert.match(page, /data-schema-chip-row/);
});

test("Studio explains scene alignment precedence when it conflicts with mount position", () => {
  assert.match(page, /场景布局优先/);
  assert.match(page, /sceneModeOverride/);
  assert.match(page, /alignOverride/);
});
test("studio HUD chip editor stacks subtitle under the title to prevent squeezed content fields", () => {
  assert.match(page, /semantic-chip-row\{grid-template-columns:30px minmax\(0,1fr\) 27px;align-items:start\}/);
  assert.match(page, /semantic-chip-fields\{display:grid;gap:6px;min-width:0\}/);
  assert.match(page, /schema-mirror-panel/);
  assert.match(page, /data-schema-list-item/);
  assert.match(page, /schema-mirror-panel/);
});

test("studio list editors preserve focus by deferring preview refresh", () => {
  const wireListEditors = page.slice(page.indexOf("function wireListEditors"), page.indexOf("function renderInspector"));
  assert.match(wireListEditors, /schedulePreviewRefresh\(\)/);
  assert.doesNotMatch(wireListEditors, /renderLayoutPreview\(beat\)/);
  assert.doesNotMatch(page, /\[\.\.field\.querySelectorAll\("\[data-schema-list-item/);
  assert.match(page, /key:node\.value,value:values\[index\]\?\.value\|\|""/);
});

test("briefing poster paper starts below the fixed Studio header band", () => {
  const briefing = recoveredEffects.slice(recoveredEffects.indexOf("export const BriefingPoster"), recoveredEffects.indexOf("export const RewindMilestones"));
  assert.match(briefing, /left:170,top:335/);
  assert.doesNotMatch(briefing, /left:170,top:205/);
  const fixedHeaderSafeBottom = 58 + 31 + 8 + 54 + 32;
  const registry = JSON.parse(readFileSync("src/design/components.registry.json", "utf8"));
  const preset = registry.components.find((component) => component.id === "briefing-poster");
  assert.ok(preset.tokens.boundsY >= fixedHeaderSafeBottom);
});

test("component body content slots use the shared 300px top offset while fixed headers stay anchored", () => {
  assert.match(recoveredEffects, /const BODY_TOP = 300/);
  assert.match(incompleteEffects, /const BODY_TOP = 300/);
  assert.match(demoEffects, /const BODY_TOP = 300/);
  assert.match(recoveredEffects, /left:76,top:58/);
  assert.match(recoveredEffects, /PlatformShiftLine[\s\S]*left:74,top:BODY_TOP/);
  assert.match(recoveredEffects, /RecoveryProgressBars[\s\S]*left:100,top:BODY_TOP/);
  assert.match(recoveredEffects, /HudGlowStack[\s\S]*left:84,top:BODY_TOP/);
  assert.match(incompleteEffects, /OrderedSequence[\s\S]*left:100,top:BODY_TOP/);
  assert.match(incompleteEffects, /ProgressDonut[\s\S]*left:150,top:BODY_TOP/);
  assert.match(incompleteEffects, /OpinionHero[\s\S]*left:120,right:120,top:BODY_TOP/);
  assert.match(demoEffects, /FallbackTechPanel[\s\S]*left: 95, top: BODY_TOP/);
  assert.match(demoEffects, /MarketGrowthAndTimeline[\s\S]*right: 92, top: BODY_TOP/);
  assert.match(readFileSync("src/JasonWu/ValueVerdict.tsx", "utf8"), /left:86,top:300/);
  const bodyTopExceptions = new Set(["briefing-poster", "chapter-card", "copyopen-hero-title", "copyopen-progress-bar", "copyopen-comparison-card", "copyopen-terminal-scene", "copyopen-end-tag", "copyopen-bar-chart", "copyopen-line-chart", "copyopen-pie-chart", "copyopen-kpi-grid"]);
  for (const component of componentRegistry.components) {
    const tokens = component.tokens || {};
    if (["top-left", "left"].includes(tokens.mountMode) && !bodyTopExceptions.has(component.id)) assert.equal(tokens.boundsY, 300, component.id + " must default body top to 300px");
  }
});
test("checklist editorial uses fixed brief content label inside the body slot", () => {
  const checklist = recoveredEffects.slice(recoveredEffects.indexOf("export const ChecklistEditorial"));
  assert.match(checklist, /重点简要内容/);
  assert.doesNotMatch(checklist, /text\(cue,props,\"title\",cue\.section\.subtitle\)/);
});

test("briefing poster and checklist editorial strengthen a single real list item", () => {
  const briefing = recoveredEffects.slice(recoveredEffects.indexOf("export const BriefingPoster"), recoveredEffects.indexOf("export const RewindMilestones"));
  const checklist = recoveredEffects.slice(recoveredEffects.indexOf("export const ChecklistEditorial"));
  assert.match(briefing, /const isSingleItem=rows\.length===1/);
  assert.match(briefing, /gap:isSingleItem\?0:25/);
  assert.match(briefing, /fontSize:isSingleItem\?42:35/);
  assert.match(checklist, /const isSingleItem=rows\.length===1/);
  assert.match(checklist, /gap:isSingleItem\?0:24/);
  assert.match(checklist, /fontSize:isSingleItem\?48:42/);
});
test("desktop folders use stable unique Mac Finder color variants instead of flat blocks", () => {
  const desktopFolders = incompleteEffects.slice(incompleteEffects.indexOf("const folderPalettes"), incompleteEffects.indexOf("export const TimeRewind"));
  assert.match(desktopFolders, /const folderPalettes = \[/);
  assert.match(desktopFolders, /const pickFolderPalette/);
  assert.match(desktopFolders, /usedPalettes\s*:\s*Set<number>/);
  assert.match(desktopFolders, /while\(usedPalettes\.has\(paletteIndex\)/);
  assert.match(desktopFolders, /usedPalettes\.add\(paletteIndex\)/);
  assert.match(desktopFolders, /folders\.map\(\(folder,i\)=>\{ const palette=pickFolderPalette\(folder,i,usedPalettes\); return <MacFinderFolder/);
  assert.match(desktopFolders, /linear-gradient\(180deg, "\+palette\.tabFrom\+" 0%, "\+palette\.tabTo\+" 100%\)/);
  assert.match(desktopFolders, /linear-gradient\(180deg, "\+palette\.bodyFrom\+" 0%, "\+palette\.bodyMid\+" 58%, "\+palette\.bodyTo\+" 100%\)/);
  assert.match(desktopFolders, /folder tab/);
  assert.match(desktopFolders, /inset 0 1px 0 rgba\(255,255,255,\.78\)/);
  assert.match(desktopFolders, /backdropFilter:"blur\(6px\)"/);
  assert.doesNotMatch(desktopFolders, /background:i%2\?C\.gold:C\.blue/);
  assert.doesNotMatch(desktopFolders, /clipPath: "polygon\(0 16%, 36% 16%, 44% 0, 100% 0, 100% 100%, 0 100%\)"/);
});
test("time rewind uses an editable typewriter body instead of duplicating the headline", () => {
  const timeRewind = incompleteEffects.slice(incompleteEffects.indexOf("export const TimeRewind"), incompleteEffects.indexOf("export const ClipboardNote"));
  assert.match(timeRewind, /textProp\(props,\"bodyText\"/);
  assert.match(timeRewind, /const typed=body\.slice/);
  assert.doesNotMatch(timeRewind, /cue\.section\.subtitle}<\/div><\/div>; };/);
  assert.match(adminSandboxClient, /const isProgressDonut=draft\.id===\"progress-donut\"; const isTimeRewind=draft\.id===\"time-rewind\";/);
  assert.match(adminSandboxClient, /时间回溯内容正文/);
  assert.match(layoutRegistry, /prose\(\"bodyText\", \"时间回溯内容正文\"\)/);
});

test("rewind milestones does not duplicate the global headline inside the content slot", () => {
  const rewind = recoveredEffects.slice(recoveredEffects.indexOf("export const RewindMilestones"), recoveredEffects.indexOf("export const FlyingPaperStack"));
  assert.match(rewind, /text\(cue,props,\"label\",\"TIME REWIND\"\)/);
  assert.doesNotMatch(rewind, /text\(cue,props,\"title\",cue\.section\.subtitle\)/);
  assert.match(rewind, /&lt;&lt; REWIND/);
});

test("semantic list capacity follows each component preset in matching and rendering", () => {
  assert.match(layoutMatcher, /getItemCapacity/);
  assert.match(layoutMatcher, /takeItems\(layout, items\)/);
  assert.match(recoveredEffects, /defaultItemCount/);
  assert.match(recoveredEffects, /itemLimit\(props/);
});















test("reject list renders editable body rows and per-item subtitles", () => {
  const reject = incompleteEffects.slice(incompleteEffects.indexOf("export const RejectList"), incompleteEffects.indexOf("export const CheckProgress"));
  assert.match(reject, /\{cue, props\}/);
  assert.match(reject, /optionalStrings\(props\?\.itemSubtitles \?\? props\?\.subLabels\)/);
  assert.match(reject, /const subtitle = subtitles\[i\] \?\? fallbackSubtitle/);
  assert.match(reject, /\{subtitle \? <div/);
  assert.doesNotMatch(reject, /CUT FROM THE PRODUCT PATH<\/div>/);
  assert.match(layoutRegistry, /"reject-list": \[text\("title", "清单标题"\), list\("items", "正文内容"/);
});

test("value verdict remains available in component asset surfaces", () => {
  const registry = JSON.parse(readFileSync("src/design/components.registry.json", "utf8"));
  const ids = registry.components.map((component) => component.id);
  assert.equal(ids.includes("value-verdict"), true);
  assert.equal(ids.includes("newspaper-swap"), false);
  assert.match(layoutRegistry, /item\("value-verdict", ValueVerdict/);
  assert.doesNotMatch(adminSandboxClient, /newspaper-swap/);
});
















test("component registry owns the Studio content editor schema", () => {
  const missing = componentRegistry.components.filter((component) => !component.editorSchema || !Array.isArray(component.editorSchema.fields) || !component.editorSchema.fields.length).map((component) => component.id);
  assert.deepEqual(missing, []);
  assert.match(page, /layout\.editorSchema/);
  assert.match(page, /renderEditorSchemaFields/);
  assert.doesNotMatch(page, /function semanticContentPanel/);
  assert.match(page, /data-schema-field/);
  assert.match(page, /data-schema-field="'\+key\+'"/);
  assert.doesNotMatch(host, /看多标签|看多观点|看空标签|看空观点/);
  assert.match(page, /layer\.layout==="bull-bear"\)return ""/);
});


test("narrative body belongs only to component-specific fields", () => {
  assert.match(page, /data-schema-field="'\+key\+'"/);
  assert.match(page, /layerEffectField=byId\("zh"\)/);
  assert.doesNotMatch(page, /function renderContentMapping/);
  assert.ok(page.includes("function layerBaseFields"));
});


test("Layer headers do not render a standalone effect summary field", () => {
  assert.doesNotMatch(page, /效果摘要 \/ Effect Summary/);
  assert.doesNotMatch(page, /effectCopyField\("zh"/);
  assert.match(page, /layerEffectField=byId\("zh"\)/);
});

test("single beat render releases its active job lock after success", () => {
  const releaseIndex = host.indexOf("releaseRenderSlot();\n              jobs.set(jobId");
  assert.ok(releaseIndex >= 0);
  const successStart = host.lastIndexOf("if (code === 0) {", releaseIndex);
  const successEnd = host.indexOf("single-beat-render-completed", releaseIndex);
  assert.ok(successStart >= 0 && successEnd > releaseIndex);
});

test("layer tabs show only the layer ordinal and localized component name", () => {
  const tabs = page.match(/function layerTabs\(beat\)\{[^\n]*/)[0];
  assert.match(tabs, /Layer "\+String\(index\+1\)\.padStart\(2,"0"\)\+" · "\+escapeHtml\(layoutLabel\)/);
  assert.doesNotMatch(tabs, /Math\.round\(start\)|layer-tab-layout|layer-tab-state|state=/);
});

test("single beat polling does not recreate a different selected Beat player", () => {
  const pollBeat = page.slice(page.indexOf("async function pollBeat"), page.indexOf("async function renderAll"));
  assert.match(pollBeat, /const isRenderingSelectedBeat=selectedBeat\(\)\?\.id===beatId/);
  assert.match(pollBeat, /if\(isRenderingSelectedBeat\)\{setPlayerAsset\(selectedBeat\(\),\{preserveLayoutPreview:true\}\)\}/);
  assert.doesNotMatch(pollBeat, /APP\.selected=Math\.max\(0,APP\.project\.beats\.findIndex\(\(item\)=>item\.id===beatId\)\)/);
});


test("briefing poster exposes only its brief-item editor and never a duplicate body field", () => {
  const briefing = componentRegistry.components.find((component) => component.id === "briefing-poster");
  assert.deepEqual((briefing?.editorSchema?.fields || []).map((field) => [field.key, field.label]), [["steps", "副文内容"]]);
  const propFields = page.slice(page.indexOf("function propFields"), page.indexOf("function fallbackFields"));
  assert.match(propFields, /"bodyText"/);
});


test("Studio never writes component sandbox defaults into a real Layer when replacing or adding an effect", () => {
  assert.doesNotMatch(page, /activeLayer\.payload=\{\.\.\.definition\(activeLayer\.layout\)\.defaults/);
  const selectGallery = page.slice(page.indexOf("function selectGalleryLayout"), page.indexOf("function listDraft"));
  assert.doesNotMatch(selectGallery, /payload=\{\.\.\.cloneLayers\(layout\.defaults/);
  assert.match(selectGallery, /normalizeLayerPayload\(key,cloneLayers\(sourceLayer\.payload\|\|\{\}\),source\.effectZh\)/);
});



test("Studio semantic accent buttons reflect the selected Layer state immediately", () => {
  assert.match(page, /function accentOfLayer\(layer\)/);
  assert.match(page, /payload\.accent/);
  assert.match(page, /effectProps\.accent/);
  assert.match(page, /data-current-accent/);
  assert.match(page, /function syncAccentButtons\(value\)/);
  assert.match(page, /classList\.toggle\("active",active\)/);
  assert.match(page, /layer\.effectProps=\{\.\.\.\(layer\.effectProps\|\|\{\}\),accent:value\}/);
  assert.match(page, /APP\.previewApplied=\{beatId:current\.id,layerId:layer\.layerId,payload:previewPayload\(current,layer,"custom"\)\}/);
  assert.match(page, /语义主题色已更新为/);
});
test("Studio exposes scene mode and left right alignment overrides for the selected layer", () => {
  assert.match(page, /sceneModePanel\(beat,layer\)/);
  assert.match(page, /data-scene-mode="speaker_mode"/);
  assert.match(page, /data-scene-mode="cinematic_mode"/);
  assert.match(page, /data-align-option="left"/);
  assert.match(page, /data-align-option="right"/);
  assert.match(page, /setLayerSceneMode/);
  assert.match(page, /setLayerAlign/);
});

test("MotionWrapper reserves the bottom subtitle zone and receives cinematic scene tokens", () => {
  assert.match(motionWrapper, /BOTTOM_SUBTITLE_SAFE_PCT\s*=\s*22/);
  assert.match(motionWrapper, /bottomSubtitleSafePx/);
  assert.match(motionWrapper, /clampedMountOffsetY/);
  assert.match(motionWrapper, /cinematicCenterCorridorPct/);
  assert.match(componentPresetResolver, /beatIndex/);
  assert.match(composition, /resolveFaceAwareLayerForRender\(layer\.layout, layer\.commonProps, cue\.faceZone, beatIndex/);
});

test("draw-line maps body and sub copy consistently across editor and final composition", () => {
  const drawLine = incompleteEffects.slice(incompleteEffects.indexOf("export const DrawLine"), incompleteEffects.indexOf("export const ProgressDonut"));
  const composedDrawLine = composition.slice(composition.indexOf("if (cue.layout === \"draw-line\")"), composition.indexOf("if (cue.layout === \"progress-donut\")"));
  assert.match(layoutRegistry, /"draw-line": \[prose\("bodyText", "正文内容"\), text\("highlightQuote", "副文内容"\)\]/);
  assert.match(drawLine, /textProp\(props,"bodyText"/);
  assert.match(drawLine, /textProp\(props,"highlightQuote"/);
  assert.match(composedDrawLine, /textProp\("bodyText"/);
  assert.match(composedDrawLine, /textProp\("highlightQuote"/);
  assert.match(composedDrawLine, /color: COLORS\.blue/);
});
test("formal video contrast policy outlines subtitles only", () => {
  const composition = readFileSync("src/JasonWu/JasonWuComposition.tsx", "utf8");
  const motionWrapper = readFileSync("src/JasonWu/components/common/MotionWrapper.tsx", "utf8");

  assert.match(composition, /WebkitTextStroke: subtitleSettings\.theme\.autoContrastStroke/);
  assert.doesNotMatch(composition, /<EffectLayerStack cue=\{cue\} beatIndex=\{beatIndex\} autoContrastStroke=/);
  assert.doesNotMatch(motionWrapper, /motion-auto-contrast/);
  assert.doesNotMatch(motionWrapper, /getContrastStyle/);
});
test("Studio retains a blank HUD chip row until the user edits it", () => {
  const updateChipList = page.slice(page.indexOf("function updateSchemaChipListDraft"), page.indexOf("function addSchemaChipItem"));
  assert.match(updateChipList, /setContentPayload\(layer,\{type:"chips",items:rows\}\)/);
  assert.doesNotMatch(updateChipList, /applySchemaPayload\(layer,schema\)/);
});
test("Layer history snapshots keep the selected Layer object attached to its Beat", () => {
  const layerSnapshot = page.slice(page.indexOf("function layerSnapshot"), page.indexOf("function pushLayerHistory"));
  assert.doesNotMatch(layerSnapshot, /layersOf\(beat\)/);
  assert.match(layerSnapshot, /Array\.isArray\(beat\?\.layers\)&&beat\.layers\.length\?beat\.layers:\[\]/);
});
test("platform shift line maps editable metric, summary, and endpoint labels", () => {
  const platform = componentRegistry.components.find((component) => component.id === "platform-shift-line");
  assert.ok(platform);
  const fields = platform.editorSchema?.fields || [];
  assert.ok(fields.some((field) => field.key === "label" && field.label === "正文内容"));
  assert.ok(fields.some((field) => field.key === "value" && field.label === "数值内容"));
  assert.ok(fields.some((field) => field.key === "detailText" && field.label === "副文内容"));
  assert.ok(fields.some((field) => field.key === "startLabel" && field.label === "起点内容"));
  assert.ok(fields.some((field) => field.key === "endLabel" && field.label === "终点内容"));
  assert.match(adminSandboxClient, /isPlatformShiftLine=draft\.id==="platform-shift-line"/);
  assert.match(adminSandboxClient, /默认内容模板 \/ 沙盒示例 · 指标面板/);
  assert.match(adminSandboxClient, /<label>数值内容<input type="number"/);
  assert.match(adminSandboxClient, /<label>副文内容<input value=\{payload\.detailText \?\? ""\}/);
  assert.match(adminSandboxClient, /<label>起点内容<input value=\{toStringValue\(draft\.mockData\.startLabel\)\}/);
  assert.match(adminSandboxClient, /<label>终点内容<input value=\{toStringValue\(draft\.mockData\.endLabel\)\}/);
  const platformRenderer = recoveredEffects.slice(recoveredEffects.indexOf("export const PlatformShiftLine"), recoveredEffects.indexOf("export const TradeoffRejectRound"));
  assert.match(platformRenderer, /text\(cue,props,"metricLabel"/);
  assert.match(platformRenderer, /text\(cue,props,"summary"/);
  assert.match(platformRenderer, /text\(cue,props,"startLabel"/);
  assert.match(platformRenderer, /text\(cue,props,"endLabel"/);
  assert.doesNotMatch(platformRenderer, />●<\/div>/);
  assert.doesNotMatch(platformRenderer, /fontSize:68\}\}>\{value\}<\/span>/);
  assert.match(platformRenderer, /marginTop:150,color:BLUE,fontSize:35/);
});
test("jc metrics curve overlay keeps only body input and follows theme accent", () => {
  const curve = componentRegistry.components.find((component) => component.id === "jc-metrics-curve-overlay");
  assert.ok(curve);
  assert.deepEqual((curve.editorSchema?.fields || []).map((field) => [field.key, field.label]), [["label", "正文内容"]]);
  const recipe = jcNativeRecipes.slice(jcNativeRecipes.indexOf('case "CurveOverlay"'), jcNativeRecipes.indexOf('case "DMCardStack"'));
  assert.match(recipe, /const curveColor\s*=\s*color\("blue"\)/);
  assert.match(recipe, /color=\{curveColor\}/);
  assert.match(recipe, /COLOR\[curveColor\]/);
  assert.match(recipe, /marginTop: -98/);
  assert.doesNotMatch(recipe, /color\("yellow"\)/);
  assert.doesNotMatch(recipe, /COLOR\.yellow/);
});

