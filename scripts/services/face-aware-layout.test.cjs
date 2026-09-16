const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const test = require("node:test");
const {detectSceneMode, resolveFaceAwareLayer} = require("./face-aware-layout.cjs");

const SIDE_LANE = Math.round(1920 / 3);
const base = {layout:"pivot-list",commonProps:{offsetX:0,offsetY:0,scale:1},tokens:{mountMode:"center",mountX:0,mountY:0,boundsX:110,boundsY:210,boundsWidth:1580,boundsHeight:456,scale:1},family:"narrative",candidates:[]};
const rightFace={faceX:.66,faceY:.12,faceW:.26,faceH:.62,safeX:.60,safeY:.06,safeW:.36,safeH:.74,faceArea:"right",faceAreaRatio:.16,facePresenceRatio:.8};
const sideScale = SIDE_LANE / base.tokens.boundsWidth;
const componentRegistry = JSON.parse(readFileSync(join(process.cwd(), "src/design/components.registry.json"), "utf8"));

test("right-side face moves a colliding component to the left", () => { const result = resolveFaceAwareLayer({...base,faceZone:rightFace}); assert.equal(result.tokens.mountMode, "left"); assert.equal(result.avoidance.applied, true); assert.equal(result.avoidance.reason, "presenter-safe-right"); });
test("large center close-up fits the whole component inside the presenter-safe lane", () => { const result = resolveFaceAwareLayer({...base,faceZone:{faceX:.33,faceY:.04,faceW:.34,faceH:.58,safeX:.26,safeY:0,safeW:.48,safeH:.74,faceArea:"center"}}); assert.equal(result.tokens.mountMode, "left"); assert.equal(result.commonProps.scale, sideScale); assert.equal(result.tokens.presenterSafeMaxWidth, SIDE_LANE); assert.equal(result.avoidance.reason, "presenter-safe-center-left"); });
test("manual placement bypasses automatic face avoidance", () => { const result = resolveFaceAwareLayer({...base,commonProps:{...base.commonProps,faceAvoidanceMode:"manual",offsetX:120},faceZone:rightFace}); assert.equal(result.tokens.mountMode, "center"); assert.equal(result.commonProps.offsetX, 120); assert.equal(result.avoidance.applied, false); });
test("side overlays scale to a one-third lane without crop geometry", () => { const result = resolveFaceAwareLayer({...base,layout:"diagonal-chips",displayIntent:"side-overlay",faceZone:{faceX:.68,faceY:.16,faceW:.24,faceH:.50,safeX:.61,safeY:.10,safeW:.34,safeH:.62,faceArea:"right"}}); assert.equal(result.tokens.mountMode, "left"); assert.equal(result.commonProps.scale, sideScale); assert.equal(result.tokens.presenterSafeMaxWidth, SIDE_LANE); assert.equal(result.tokens.presenterSafeLogicalWidth, base.tokens.boundsWidth); assert.equal(result.tokens.presenterSafeInset, "left"); });
test("fullscreen modal layouts keep their intentional center treatment", () => { const result = resolveFaceAwareLayer({...base,layout:"chapter-card",displayIntent:"fullscreen-modal",faceZone:rightFace}); assert.equal(result.tokens.presenterSafeMaxWidth, undefined); assert.equal(result.avoidance.reason, "fullscreen-modal"); });
test("center presenters use a side lane instead of a bottom overlay", () => { const result=resolveFaceAwareLayer({...base,layout:"hud-glow-stack",displayIntent:"side-overlay",faceZone:{faceX:.39,faceY:.12,faceW:.26,faceH:.46,safeX:.34,safeY:.08,safeW:.36,safeH:.56,faceArea:"center"}}); assert.equal(result.tokens.mountMode,"left"); assert.equal(result.tokens.presenterSafeMaxWidth,SIDE_LANE); });
test("speaker mode is detected from sustained large face data and aligns opposite the presenter", () => { const scene=detectSceneMode({faceZone:{faceX:.62,faceY:.10,faceW:.24,faceH:.50,faceArea:"right",faceAreaRatio:.12,facePresenceRatio:.72}}); assert.equal(scene.sceneMode,"speaker_mode"); assert.equal(scene.align,"left"); const result=resolveFaceAwareLayer({...base,faceZone:scene.faceZone}); assert.equal(result.avoidance.sceneMode,"speaker_mode"); assert.equal(result.tokens.mountMode,"left"); });
test("cinematic side wings also scale to the one-third layout lane", () => { const first=resolveFaceAwareLayer({...base,faceZone:null,beatIndex:0,sceneMode:"cinematic_mode"}); const second=resolveFaceAwareLayer({...base,faceZone:null,beatIndex:1,sceneMode:"cinematic_mode"}); assert.equal(first.tokens.mountMode,"left"); assert.equal(second.tokens.mountMode,"right"); assert.equal(first.tokens.presenterSafeMaxWidth,SIDE_LANE); assert.equal(first.commonProps.scale,sideScale); });
test("canonical layout alignment wins over legacy mount side without double offset", () => { const result=resolveFaceAwareLayer({...base,commonProps:{offsetX:0,offsetY:0,scale:1},layoutProps:{sceneMode:"speaker",align:"left"},faceZone:rightFace}); assert.equal(result.avoidance.sceneMode,"speaker_mode"); assert.equal(result.avoidance.align,"left"); assert.equal(result.tokens.mountMode,"left"); });
test("canonical cinematic layout alignment wins over automatic alternation", () => { const result=resolveFaceAwareLayer({...base,faceZone:null,beatIndex:0,sceneMode:"cinematic_mode",layoutProps:{sceneMode:"cinematic",align:"right"}}); assert.equal(result.avoidance.sceneMode,"cinematic_mode"); assert.equal(result.avoidance.align,"right"); assert.equal(result.tokens.mountMode,"right"); });
test("every registered side overlay fits the one-third lane on both explicit sides without face data", () => {
  const sideOverlays = componentRegistry.components.filter((component) => component.displayIntent === "side-overlay");
  assert.ok(sideOverlays.length > 0);
  for (const component of sideOverlays) {
    const boundsWidth = Math.max(1, Number(component.tokens?.boundsWidth) || 1180);
    for (const align of ["left", "right"]) {
      const result = resolveFaceAwareLayer({
        layout: component.id,
        commonProps: {offsetX: 0, offsetY: 0, scale: 1},
        layoutProps: {sceneMode: "speaker", align},
        tokens: {...component.tokens},
        family: component.family,
        candidates: [],
        displayIntent: component.displayIntent,
        faceZone: null,
      });
      assert.equal(result.tokens.mountMode, align, component.id + " should keep explicit " + align + " alignment");
      assert.equal(result.tokens.presenterSafeMaxWidth, SIDE_LANE, component.id + " should reserve a one-third lane");
      assert.equal(result.tokens.presenterSafeLogicalWidth, boundsWidth, component.id + " should preserve authored width before scaling");
      assert.ok(result.commonProps.scale <= SIDE_LANE / boundsWidth + 1e-9, component.id + " should fully fit inside the side lane");
    }
  }
});
