const assert = require("node:assert/strict");
const test = require("node:test");

const {resolveFaceAwareLayer} = require("./face-aware-layout.cjs");
const base = {layout:"engineering-return",commonProps:{position:"center",offsetX:0,offsetY:0,scale:1},tokens:{mountMode:"center",mountX:0,mountY:0,boundsX:110,boundsY:210,boundsWidth:1580,boundsHeight:456,scale:1},family:"narrative",candidates:[]};

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
  const result = resolveFaceAwareLayer({...base, layout:"diagonal-chips", displayIntent:"side-overlay", faceZone:{faceX:.68,faceY:.16,faceW:.18,faceH:.42,safeX:.63,safeY:.10,safeW:.28,safeH:.54,faceArea:"right"}});
  assert.equal(result.tokens.mountMode, "left");
  assert.equal(result.commonProps.scale, .78);
  assert.equal(result.tokens.presenterSafeMaxWidth, 806);
  assert.equal(result.tokens.presenterSafeInset, "left");
  assert.equal(result.avoidance.reason, "presenter-safe-right");
});

test("fullscreen modal layouts keep their intentional center treatment", () => {
  const result = resolveFaceAwareLayer({...base, layout:"chapter-card", displayIntent:"fullscreen-modal", faceZone:{faceX:.68,faceY:.16,faceW:.18,faceH:.42,safeX:.63,safeY:.10,safeW:.28,safeH:.54,faceArea:"right"}});
  assert.equal(result.tokens.presenterSafeMaxWidth, undefined);
  assert.equal(result.avoidance.reason, "fullscreen-modal");
});


test("center presenters use the wider side island instead of a bottom overlay", () => {
  const result = resolveFaceAwareLayer({...base, layout:"hud-glow-stack", displayIntent:"side-overlay", faceZone:{faceX:.475,faceY:.213,faceW:.168,faceH:.362,safeX:.430,safeY:.162,safeW:.258,safeH:.463,faceArea:"center"}});
  assert.equal(result.tokens.mountMode, "left");
  assert.ok(result.tokens.presenterSafeMaxWidth < 806);
  assert.equal(result.tokens.presenterSafeInset, "left");
  assert.equal(result.avoidance.reason, "presenter-safe-center-left");
});

