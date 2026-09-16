"use strict";

const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const test = require("node:test");

const {resolveFaceAwareLayer} = require("./services/face-aware-layout.cjs");

const root = process.cwd();
const readSource = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const rightFace = {
  faceX: .66,
  faceY: .12,
  faceW: .26,
  faceH: .62,
  safeX: .60,
  safeY: .06,
  safeW: .36,
  safeH: .74,
  faceArea: "right",
  faceAreaRatio: .16,
  facePresenceRatio: .8,
};

const sideOverlay = (boundsWidth) => ({
  layout: "flying-paper-stack",
  commonProps: {offsetX: 0, offsetY: 0, scale: 1},
  tokens: {mountMode: "left", mountX: 0, mountY: 0, boundsX: 76, boundsY: 300, boundsWidth, boundsHeight: 700, scale: 1},
  family: "chips",
  displayIntent: "side-overlay",
  candidates: [],
});

test("side overlays fit authored bounds into a one-third canvas lane", () => {
  const result = resolveFaceAwareLayer({...sideOverlay(1260), language: "en", faceZone: rightFace});
  assert.equal(result.tokens.presenterSafeMaxWidth, Math.round(1920 / 3));
  assert.equal(result.tokens.presenterSafeLogicalWidth, 1260);
  assert.equal(result.commonProps.scale, Math.round(1920 / 3) / 1260);
  assert.equal(result.tokens.mountMode, "left");
});

test("MotionWrapper scales side overlays instead of clipping their boundaries", () => {
  const wrapper = readSource("src/JasonWu/components/common/MotionWrapper.tsx");
  assert.doesNotMatch(wrapper, /clipPath: safeClipPath/);
  assert.doesNotMatch(wrapper, /presenter-safe-logical-width/);
  assert.match(wrapper, /Math\.max\(\.35, props\.scale \?\? 1\)/);
});

test("English captions use a single line when primary and secondary copy match", () => {
  const composition = readSource("src/JasonWu/JasonWuComposition.tsx");
  assert.match(composition, /const isSingleLanguageCaption = cue\.language === "en" \|\| sameCaptionText;/);
  assert.match(composition, /const showSecondarySubtitle = Boolean\(secondaryCaption && !isSingleLanguageCaption\);/);
  assert.match(composition, /data-subtitle-lines=\{showSecondarySubtitle \? "double" : "single"\}/);
});

test("logo and flying-paper components preserve the full visual while fitting long copy", () => {
  const incomplete = readSource("src/JasonWu/IncompleteEffectComponents.tsx");
  const recovered = readSource("src/JasonWu/RecoveredEffectComponents.tsx");
  assert.match(incomplete, /flex: "0 0 140px"/);
  assert.match(incomplete, /const logoBodyFontSize =/);
  assert.match(recovered, /const bodyFontSize =/);
  assert.match(recovered, /data-flying-paper-body/);
  assert.match(recovered, /i === 2 \? <div data-flying-paper-body/);
  assert.match(recovered, /width:1050,height:520/);
});