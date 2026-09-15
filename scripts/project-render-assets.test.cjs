const assert = require("node:assert/strict");
const test = require("node:test");

const {
  canAssemble,
  currentAssetPath,
  recoverOrphanedBeatRenders,
  reconcileProjectRenderCache,
  renderContentHash,
  ensureProjectLifecycle,
  invalidateBeat,
  mergeProjectEdits,
  updateBeatRender,
} = require("./project-render-assets.cjs");

test("legacy projects receive render lifecycle defaults", () => {
  const project = ensureProjectLifecycle({
    projectId: "demo",
    beats: [{id: "beat-001"}],
  });

  assert.deepEqual(project.render, {
    status: "idle",
    progress: 0,
    outputPath: null,
    renderedAt: null,
    error: null,
  });
  assert.deepEqual(project.beats[0].render, {
    revision: 1,
    status: "idle",
    previewPath: null,
    renderedAt: null,
    error: null,
    contentHash: null,
    renderedVideoPath: null,
  });
});

test("editing a ready beat increments its revision and keeps its last preview", () => {
  const project = invalidateBeat({
    projectId: "demo",
    render: {status: "ready", progress: 100, outputPath: "out/demo.mp4", renderedAt: "now", error: null},
    beats: [{
      id: "beat-001",
      render: {revision: 1, status: "ready", previewPath: "out/beat-001-r1.mp4", renderedAt: "now", error: null},
    }],
  }, "beat-001");

  assert.deepEqual(project.beats[0].render, {
    revision: 2,
    status: "stale",
    previewPath: "out/beat-001-r1.mp4",
    renderedAt: "now",
    error: null,
    contentHash: null,
    renderedVideoPath: "out/beat-001-r1.mp4",
  });
  assert.equal(project.render.status, "stale");
  assert.equal(project.render.outputPath, null);
});

test("asset path is unique to a beat revision", () => {
  assert.equal(
    currentAssetPath("demo", {id: "beat-004", render: {revision: 3}}),
    "data/projects/demo/renders/beats/beat-004-r3.mp4",
  );
});

test("a render result is ignored when the beat revision has changed", () => {
  const project = ensureProjectLifecycle({
    projectId: "demo",
    beats: [{id: "beat-001", render: {revision: 2, status: "rendering"}}],
  });
  const result = updateBeatRender(project, "beat-001", 1, {
    status: "ready",
    previewPath: "out/project-assets/demo/beat-001-r1.mp4",
  });
  assert.equal(result.beats[0].render.status, "rendering");
  assert.equal(result.beats[0].render.previewPath, null);
});

test("a full video can assemble only from current ready beat assets", () => {
  assert.equal(canAssemble([{render: {status: "ready"}}, {render: {status: "ready"}}]), true);
  assert.equal(canAssemble([{render: {status: "ready"}}, {render: {status: "stale"}}]), false);
});
test("saving one changed beat invalidates only that beat", () => {
  const previous = ensureProjectLifecycle({
    projectId: "demo",
    beats: [
      {id: "beat-001", subtitle: "Before", render: {revision: 1, status: "ready", previewPath: "one.mp4"}},
      {id: "beat-002", subtitle: "Keep", render: {revision: 1, status: "ready", previewPath: "two.mp4"}},
    ],
  });
  const edited = {...previous, beats: previous.beats.map((beat) => beat.id === "beat-001" ? {...beat, subtitle: "After"} : beat)};
  const result = mergeProjectEdits(previous, edited);
  assert.equal(result.beats[0].render.status, "stale");
  assert.equal(result.beats[0].render.revision, 2);
  assert.equal(result.beats[1].render.status, "ready");
  assert.equal(result.beats[1].render.previewPath, "two.mp4");
});
test("content hash cache survives reload only when the current beat payload is unchanged", () => {
  const project = ensureProjectLifecycle({projectId: "demo", fps: 30, globalSettings: {}, captions: [], beats: [{id: "beat-001", start: 0, end: 10, subtitle: "Stable", render: {status: "ready", previewPath: "data/projects/demo/renders/beats/beat-001.mp4"}}]});
  const hash = renderContentHash(project, project.beats[0]);
  project.beats[0].render.contentHash = hash;
  const restored = reconcileProjectRenderCache(project, (path) => path.endsWith("beat-001.mp4")).project;
  assert.equal(restored.beats[0].render.status, "ready");
  const edited = {...project, beats: [{...project.beats[0], subtitle: "Changed"}]};
  const invalidated = mergeProjectEdits(project, edited);
  assert.equal(invalidated.beats[0].render.status, "stale");
});

test("editing a caption invalidates only beats that overlap its time window", () => {
  const previous = ensureProjectLifecycle({projectId: "demo", fps: 30, globalSettings: {}, captions: [{id: "caption-001", start: 0, end: 2, zh: "Original opening", en: ""}, {id: "caption-002", start: 12, end: 14, zh: "Stable second beat", en: ""}], beats: [{id: "beat-001", start: 0, end: 10, render: {revision: 1, status: "ready", previewPath: "one.mp4"}}, {id: "beat-002", start: 10, end: 20, render: {revision: 1, status: "ready", previewPath: "two.mp4"}}]});
  const edited = {...previous, captions: previous.captions.map((caption) => caption.id === "caption-001" ? {...caption, zh: "Corrected opening"} : caption)};
  const result = mergeProjectEdits(previous, edited);
  assert.equal(result.beats[0].render.status, "stale");
  assert.equal(result.beats[1].render.status, "ready");
  assert.equal(result.beats[1].render.previewPath, "two.mp4");
});

test("saving a JSON round trip preserves renders when optional layer duration is absent", () => {
  const previous = ensureProjectLifecycle({projectId: "demo", beats: [{id: "beat-001", start: 0, end: 10, layers: [{layerId: "layer-1", layout: "chapter-card", effectProps: {}, commonProps: {enterOffset: 0, duration: undefined, position: "center", offsetX: 0, offsetY: 0, scale: 1, enterAnimation: "spring-up", exitAnimation: "none", sfx: "none"}}], render: {revision: 1, status: "ready", previewPath: "one.mp4"}}]});
  const result = mergeProjectEdits(previous, JSON.parse(JSON.stringify(previous)));
  assert.equal(result.beats[0].render.status, "ready");
  assert.equal(result.beats[0].render.previewPath, "one.mp4");
});

test("component preset signatures participate in the render content hash", () => {
  const project = ensureProjectLifecycle({projectId:"registry-hash",fps:30,globalSettings:{},captions:[],beats:[{id:"beat-001",start:0,end:10,layout:"diagonal-chips",effectProps:{items:["A","B"]}}]});
  const beat = project.beats[0];
  const first = renderContentHash(project, beat, [{id:"diagonal-chips",version:1,tokens:{gap:16}}]);
  const changed = renderContentHash(project, beat, [{id:"diagonal-chips",version:2,tokens:{gap:24}}]);
  const unrelated = renderContentHash(project, beat, [{id:"diagonal-chips",version:1,tokens:{gap:16}},{id:"capital-dashboard",version:8,tokens:{gap:99}}]);
  assert.notEqual(first, changed);
  assert.equal(first, unrelated);
});

test("orphaned beat rendering states recover to stale after a service restart", () => {
  const project = ensureProjectLifecycle({
    projectId: "demo",
    beats: [{
      id: "beat-001",
      renderStatus: "rendering",
      renderedVideoPath: "data/projects/demo/renders/beats/beat-001-r1.mp4",
      contentHash: "old",
      render: {
        revision: 1,
        status: "rendering",
        previewPath: null,
        renderedVideoPath: "data/projects/demo/renders/beats/beat-001-r1.mp4",
        contentHash: "old",
      },
    }],
  });
  const result = recoverOrphanedBeatRenders(project, () => false);
  assert.equal(result.changed, true);
  assert.equal(result.project.beats[0].render.status, "stale");
  assert.equal(result.project.beats[0].renderStatus, "dirty");
  assert.equal(result.project.beats[0].renderedVideoPath, null);
  assert.match(result.project.beats[0].render.error, /重新合成/);
});

test("active beat rendering states are preserved while their job is running", () => {
  const project = ensureProjectLifecycle({projectId: "demo", beats: [{id: "beat-001", render: {revision: 1, status: "rendering"}}]});
  const result = recoverOrphanedBeatRenders(project, (beat) => beat.id === "beat-001");
  assert.equal(result.changed, false);
  assert.equal(result.project.beats[0].render.status, "rendering");
});


test("reconciliation invalidates an existing render when its content hash is obsolete", () => {
  const project = ensureProjectLifecycle({projectId:"qa-stale-hash", fps:30, globalSettings:{}, captions:[], beats:[{id:"beat-001", start:0, end:4, subtitle:"安全岛", zh:"安全岛约束", en:"", layout:"diagonal-chips", effectProps:{}, render:{revision:1, status:"ready", previewPath:"data/projects/qa-stale-hash/renders/beats/beat-001-r1.mp4", renderedVideoPath:"data/projects/qa-stale-hash/renders/beats/beat-001-r1.mp4", contentHash:"obsolete-contract-hash"}}]});
  const result = reconcileProjectRenderCache(project, () => true).project.beats[0];
  assert.equal(result.render.status, "stale");
  assert.equal(result.renderStatus, "dirty");
});

test('stale beat keeps its existing artifact available for inspection', () => {
  const path = 'data/projects/cache-preview/renders/beats/beat-001-r1.mp4';
  const project = ensureProjectLifecycle({projectId:'cache-preview', fps:30, globalSettings:{}, captions:[], beats:[{id:'beat-001', start:0, end:4, subtitle:'changed', zh:'old artifact', en:'', layout:'diagonal-chips', effectProps:{}, render:{revision:1, status:'ready', previewPath:path, renderedVideoPath:path, contentHash:'oldhash'}}]});
  const beat = reconcileProjectRenderCache(project, () => true).project.beats[0];
  assert.equal(beat.render.status, 'stale');
  assert.equal(beat.renderStatus, 'dirty');
  assert.equal(beat.render.previewPath, path);
  assert.equal(beat.renderedVideoPath, path);
});



test("template mock data and its editor version do not invalidate a rendered Beat", () => {
  const project = ensureProjectLifecycle({projectId:"template-cache", fps:30, globalSettings:{}, captions:[], beats:[{id:"beat-001", start:0, end:4, subtitle:"Stable", zh:"Stable copy", en:"", layout:"diagonal-chips", effectProps:{}}]});
  const beat = project.beats[0];
  const initial = renderContentHash(project, beat, [{id:"diagonal-chips", family:"chips", version:1, displayIntent:"side-overlay", tokens:{gap:16,scale:1}, sfx:{enter:"none",exit:"none",volume:.65}, mockData:{headline:"Template A",items:["One"]}}]);
  const mockOnlyChange = renderContentHash(project, beat, [{id:"diagonal-chips", family:"chips", version:99, displayIntent:"side-overlay", tokens:{gap:16,scale:1}, sfx:{enter:"none",exit:"none",volume:.65}, mockData:{headline:"Template B",items:["Two","Three"]}}]);
  const renderTokenChange = renderContentHash(project, beat, [{id:"diagonal-chips", family:"chips", version:99, displayIntent:"side-overlay", tokens:{gap:24,scale:1}, sfx:{enter:"none",exit:"none",volume:.65}, mockData:{headline:"Template B"}}]);
  assert.equal(initial, mockOnlyChange);
  assert.notEqual(initial, renderTokenChange);
});

test("absorbs an existing terminal micro Beat into the preceding Layer stack", () => {
  const project = ensureProjectLifecycle({projectId:"terminal-tail",fps:30,globalSettings:{},captions:[],beats:[
    {id:"beat-010",start:297.51,end:330.24,layout:"route-map",effectProps:{},layers:[
      {layerId:"layer-1",layout:"route-map",effectProps:{},commonProps:{enterOffset:0,duration:13.19,position:"center",offsetX:0,offsetY:0,scale:1,enterAnimation:"spring-up",exitAnimation:"fade-out",sfx:"none"}},
      {layerId:"layer-2",layout:"checklist-editorial",effectProps:{},commonProps:{enterOffset:13.19,position:"center",offsetX:0,offsetY:0,scale:1,enterAnimation:"slide-right",exitAnimation:"none",sfx:"none"}}
    ],render:{revision:7,status:"ready",previewPath:"old.mp4"}},
    {id:"beat-011",start:330.24,end:333.18,layout:"closing-checklist",effectProps:{},layers:[
      {layerId:"layer-1",layout:"closing-checklist",effectProps:{},commonProps:{enterOffset:0,position:"center",offsetX:0,offsetY:0,scale:1,enterAnimation:"spring-up",exitAnimation:"none",sfx:"none"}}
    ]}
  ]});
  assert.equal(project.beats.length, 1);
  const merged = project.beats[0];
  assert.equal(merged.end, 333.18);
  assert.equal(merged.layers.length, 3);
  assert.equal(merged.layers[2].layout, "closing-checklist");
  assert.equal(merged.layers[2].commonProps.enterOffset, 32.73);
  assert.equal(merged.render.status, "stale");
  assert.equal(merged.render.revision, 8);
  assert.equal(merged.terminalTailAbsorbed.sourceBeatId, "beat-011");
});

test("render cache fingerprint tracks the subtitle-only typography contract", () => {
  const source = require("node:fs").readFileSync("scripts/project-render-assets.cjs", "utf8");
  assert.match(source, /typographyContract: 2/);
});