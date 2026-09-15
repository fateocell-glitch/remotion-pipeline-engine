const assert = require("node:assert/strict");
const test = require("node:test");

const {detectSceneMode, resolveFaceAwareLayer} = require("./face-aware-layout.cjs");
const base = {layout:"pivot-list",commonProps:{position:"center",offsetX:0,offsetY:0,scale:1},tokens:{mountMode:"center",mountX:0,mountY:0,boundsX:110,boundsY:210,boundsWidth:1580,boundsHeight:456,scale:1},family:"narrative",candidates:[]};

test("right-side face moves a colliding component to the left", () => {
  const result = resolveFaceAwareLayer({...base,faceZone:{faceX:.66,faceY:.12,faceW:.26,faceH:.62,safeX:.60,safeY:.06,safeW:.36,safeH:.74,faceArea:"right"}});
  assert.equal(result.tokens.mountMode, "left");
  assert.equal(result.avoidance.applied, true);
  assert.equal(result.avoidance.reason, "presenter-safe-right");
});

test("large center close-up moves into a presenter-safe side island", () => {
  const result = resolveFaceAwareLayer({...base,faceZone:{faceX:.33,faceY:.04,faceW:.34,faceH:.58,safeX:.26,safeY:0,safeW:.48,safeH:.74,faceArea:"center"}});
  assert.equal(result.tokens.mountMode, "left");
  assert.equal(result.commonProps.scale, .78);
  assert.equal(result.avoidance.reason, "presenter-safe-center-left");
});

test("manual placement bypasses automatic face avoidance", () => {
  const result = resolveFaceAwareLayer({...base,commonProps:{...base.commonProps,faceAvoidanceMode:"manual",offsetX:120},faceZone:{faceX:.66,faceY:.12,faceW:.26,faceH:.62,safeX:.60,safeY:.06,safeW:.36,safeH:.74,faceArea:"right"}});
  assert.equal(result.tokens.mountMode, "center");
  assert.equal(result.commonProps.offsetX, 120);
  assert.equal(result.avoidance.applied, false);
});


test("side overlays always enter a constrained opposite-side safe island", () => {
  const result = resolveFaceAwareLayer({...base, layout:"diagonal-chips", displayIntent:"side-overlay", faceZone:{faceX:.68,faceY:.16,faceW:.24,faceH:.50,safeX:.61,safeY:.10,safeW:.34,safeH:.62,faceArea:"right"}});
  assert.equal(result.tokens.mountMode, "left");
  assert.equal(result.commonProps.scale, .78);
  assert.equal(result.tokens.presenterSafeMaxWidth, Math.round(1920 * .48));
  assert.equal(result.tokens.presenterSafeInset, "left");
  assert.equal(result.avoidance.reason, "presenter-safe-right");
});

test("fullscreen modal layouts keep their intentional center treatment", () => {
  const result = resolveFaceAwareLayer({...base, layout:"chapter-card", displayIntent:"fullscreen-modal", faceZone:{faceX:.68,faceY:.16,faceW:.24,faceH:.50,safeX:.61,safeY:.10,safeW:.34,safeH:.62,faceArea:"right"}});
  assert.equal(result.tokens.presenterSafeMaxWidth, undefined);
  assert.equal(result.avoidance.reason, "fullscreen-modal");
});


test("center presenters use the wider side island instead of a bottom overlay", () => {
  const result = resolveFaceAwareLayer({...base, layout:"hud-glow-stack", displayIntent:"side-overlay", faceZone:{faceX:.39,faceY:.12,faceW:.26,faceH:.46,safeX:.34,safeY:.08,safeW:.36,safeH:.56,faceArea:"center"}});
  assert.equal(result.tokens.mountMode, "left");
  assert.ok(result.tokens.presenterSafeMaxWidth <= Math.round(1920 * .48));
  assert.equal(result.tokens.presenterSafeInset, "left");
  assert.equal(result.avoidance.reason, "presenter-safe-center-left");
});


test("speaker mode is detected from sustained large face data and aligns opposite the presenter", () => {
  const scene = detectSceneMode({faceZone:{faceX:.62,faceY:.10,faceW:.24,faceH:.50,faceArea:"right",faceAreaRatio:.12,facePresenceRatio:.72}});
  assert.equal(scene.sceneMode, "speaker_mode");
  assert.equal(scene.align, "left");
  const result = resolveFaceAwareLayer({...base, faceZone:scene.faceZone});
  assert.equal(result.avoidance.sceneMode, "speaker_mode");
  assert.equal(result.avoidance.align, "left");
  assert.equal(result.tokens.mountMode, "left");
  assert.ok(result.avoidance.remainingCollision <= .28);
});

test("cinematic mode alternates side wings and releases dashboard width", () => {
  const first = resolveFaceAwareLayer({...base, faceZone:null, beatIndex:0, sceneMode:"cinematic_mode"});
  const second = resolveFaceAwareLayer({...base, faceZone:null, beatIndex:1, sceneMode:"cinematic_mode"});
  assert.equal(first.avoidance.sceneMode, "cinematic_mode");
  assert.equal(first.avoidance.align, "left");
  assert.equal(second.avoidance.align, "right");
  assert.equal(first.tokens.mountMode, "left");
  assert.equal(second.tokens.mountMode, "right");
  assert.ok(first.tokens.presenterSafeMaxWidth >= Math.round(1920 * .55));
  assert.ok(first.tokens.presenterSafeMaxWidth <= Math.round(1920 * .65));
  assert.equal(first.tokens.cinematicCenterCorridorPct, 35);
});

test("scene alignment wins over a conflicting mount side without double offset", () => {
  const result = resolveFaceAwareLayer({
    ...base,
    commonProps: {position: "bottom-right", sceneModeOverride: "speaker_mode", alignOverride: "left"},
    faceZone: {faceX:.66,faceY:.12,faceW:.26,faceH:.62,safeX:.60,safeY:.06,safeW:.36,safeH:.74,faceArea:"right",faceAreaRatio:.16,facePresenceRatio:.8},
  });
  assert.equal(result.avoidance.sceneMode, "speaker_mode");
  assert.equal(result.avoidance.align, "left");
  assert.equal(result.tokens.mountMode, "left");
  assert.equal(result.commonProps.position, "center");
});
test("manual scene and align overrides win over automatic cinematic alternation", () => {
  const result = resolveFaceAwareLayer({...base, faceZone:null, beatIndex:0, sceneMode:"cinematic_mode", commonProps:{...base.commonProps, sceneModeOverride:"cinematic_mode", alignOverride:"right"}});
  assert.equal(result.avoidance.sceneMode, "cinematic_mode");
  assert.equal(result.avoidance.align, "right");
  assert.equal(result.tokens.mountMode, "right");
});