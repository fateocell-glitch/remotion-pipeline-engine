# Effect Layer Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each video Beat render an ordered, independently configurable stack of visual effects while keeping all existing one-layout projects functional.

**Architecture:** Introduce a shared `EffectLayer` schema and a normalization helper that converts legacy `layout` / `effectProps` data into a one-item layer array. Remotion consumes normalized layers inside each Beat and applies per-layer start offsets; the Studio reads and writes the same layer array, exposing selected-layer dynamic props from the existing layout registry.

**Tech Stack:** TypeScript, React, Remotion 4, Node.js local Studio server, Node built-in test runner.

**Spec:** User-approved effect-layer stack request from September 9, 2026.

## Global Constraints

- Do not read, modify, or route any AI Link model endpoint, port, base URL, API base, or API key.
- Preserve legacy `beat.layout` and `beat.effectProps` compatibility.
- Keep original video footage visible below visual overlays.
- A layer `enterOffset` is expressed in seconds relative to its Beat start.
- Editing a layer invalidates only that Beat’s preview.

---

### Task 1: Shared Layer Schema and Compatibility

**Files:**
- Create: `src/JasonWu/effectLayers.ts`
- Create: `src/JasonWu/effectLayers.test.ts`
- Modify: `src/JasonWu/timeline.ts`
- Modify: `src/JasonWu/projectTypes.ts`
- Modify: `src/JasonWu/projectLoader.ts`

**Interfaces:**
- Produces: `EffectLayer`, `normalizeCueLayers(cue)`, and `normalizeProjectBeatLayers(beat)`.
- Consumes: `JasonWuCue["layout"]` and existing `effectProps`.

- [ ] **Step 1: Write the failing tests**

```ts
assert.deepEqual(
  normalizeCueLayers({layout: "chapter-card", effectProps: {headline: "Start"}}),
  [{layerId: "layer-1", layout: "chapter-card", effectProps: {headline: "Start"}, enterOffset: 0}],
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/JasonWu/effectLayers.test.ts`

Expected: FAIL because `effectLayers.ts` does not exist.

- [ ] **Step 3: Implement the minimal schema and normalizers**

```ts
export type EffectLayer = {
  layerId: string;
  layout: JasonWuCue["layout"];
  effectProps?: Record<string, unknown>;
  enterOffset?: number;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/JasonWu/effectLayers.test.ts`

Expected: PASS.

### Task 2: Remotion Stack Dispatcher

**Files:**
- Modify: `src/JasonWu/DemoEffectAdditions.tsx`
- Modify: `src/JasonWu/JasonWuComposition.tsx`

**Interfaces:**
- Consumes: `normalizeCueLayers(cue)`.
- Produces: `EffectLayerStack` that renders every registered effect in order.

- [ ] **Step 1: Write the failing test**

```ts
assert.equal(normalizeCueLayers(layeredCue).length, 2);
assert.equal(normalizeCueLayers(layeredCue)[1].enterOffset, 1.25);
```

- [ ] **Step 2: Run the compatibility test**

Run: `npx tsx src/JasonWu/effectLayers.test.ts`

Expected: PASS before dispatcher integration.

- [ ] **Step 3: Implement stack rendering**

```tsx
{normalizeCueLayers(cue).map((layer) => (
  <Sequence
    key={layer.layerId}
    from={Math.round((layer.enterOffset ?? 0) * fps)}
    layout="none"
  >
    <LayoutEffectRenderer cue={cue} layer={layer} />
  </Sequence>
))}
```

- [ ] **Step 4: Type-check the composition**

Run: `npx tsc --noEmit`

Expected: PASS.

### Task 3: Studio Layer Manager and Persistence

**Files:**
- Modify: `scripts/project-studio-page.cjs`
- Modify: `scripts/project-editor-web.cjs`
- Create: `scripts/effect-layer-validation.test.cjs`

**Interfaces:**
- Consumes: persisted `beat.layers`.
- Produces: UI operations to add, remove, reorder, select, and edit layers.

- [ ] **Step 1: Write a failing server-validation test**

```js
assert.equal(validProject({
  projectId: "demo",
  fps: 30,
  beats: [{id: "beat-001", start: 0, end: 12, layout: "chapter-card", layers: [
    {layerId: "layer-1", layout: "chapter-card", enterOffset: 0},
    {layerId: "layer-2", layout: "value-verdict", enterOffset: 1},
  ]}],
  captions: [],
}), true);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/effect-layer-validation.test.cjs`

Expected: FAIL because the validator is not exported or does not validate layers.

- [ ] **Step 3: Implement server validation and UI**

```js
function addLayer() {
  beat.layers.push({
    layerId: "layer-" + Date.now(),
    layout: "chapter-card",
    effectProps: {},
    enterOffset: 0,
  });
}
```

- [ ] **Step 4: Run validation test and server syntax check**

Run: `node --test scripts/effect-layer-validation.test.cjs`

Run: `node --check scripts/project-studio-page.cjs`

Expected: PASS.

### Task 4: Regression Verification

**Files:**
- Modify: no source files unless verification reveals a defect.

- [ ] **Step 1: Run focused tests**

Run: `npx tsx src/JasonWu/effectLayers.test.ts`

Run: `node --test scripts/effect-layer-validation.test.cjs`

- [ ] **Step 2: Run the existing project lifecycle tests**

Run: `node --test scripts/services/project-store.test.cjs scripts/services/queue.test.cjs scripts/services/task-state.test.cjs scripts/utils/logger.test.cjs`

- [ ] **Step 3: Run TypeScript validation**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Verify active Studio page**

Run: `Invoke-WebRequest http://127.0.0.1:4318/`

Expected: HTML contains `效果图层`.
