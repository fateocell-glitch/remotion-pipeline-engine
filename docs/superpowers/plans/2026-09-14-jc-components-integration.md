# JC Component Library Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the 38 standalone visual components from `jc-remotion-skills-master` into the current Remotion production pipeline under an isolated `jc-*` namespace with shared editor, payload, accent, routing, and QA contracts.

**Architecture:** Copy the 38 standalone component source files and their shared JC design helpers into `src/JasonWu/components/jc/` without changing internal visual logic. Add a thin adapter registry that injects current layer metadata, payload, semantic accent, and `MotionWrapper` around each component. Generate one manifest source for runtime definitions and JSON assets so Studio, admin, recommender, and render paths consume the same contract.

**Tech Stack:** React 19, Remotion 4, TypeScript, Node.js CommonJS scripts, JSON component registry, Node test runner.

**Spec:** User-approved JC component integration request in the current task.

## Global Constraints

- Only the 38 standalone visual components under the external repository's `substrate/src/design/*.tsx` are assets; do not register `DesignDemo.tsx`, `qc.tsx`, `FontGuard.tsx`, `tokens.ts`, `motion.ts`, or `substrate/src/koubo/scenes/shared.tsx` as components.
- Every imported component ID must use the `jc-*` namespace and must not collide with existing component IDs.
- Existing JC component visual implementation and animation logic must remain unchanged; adapters may translate props and wrap them.
- Every imported asset must expose `editorSchema` and `defaultPayload` through the existing manifest contract.
- `layer.accent` values `blue`, `green`, `yellow`, and `red` must be translated into the imported component's `color`/`accent` prop where supported, without changing the source component defaults when unsupported.
- Final registry count must be exactly 87 components: existing 47 plus 2 backfilled and 38 JC assets.
- QA must run through `node scripts/test-runner.cjs`.

---

### Task 1: Establish the JC source inventory and failing contract tests

**Files:**
- Create: `scripts/qa-test-jc-components.cjs`
- Modify: `scripts/test-runner.cjs`
- Test: `scripts/qa-test-jc-components.cjs`

**Interfaces:**
- Consumes: external JC source directory and current registry/runtime exports.
- Produces: an executable QA report that asserts 38 imported assets, 87 total registry assets, zero ID collisions, valid default payloads, and runtime registration.

- [ ] **Step 1: Write failing inventory assertions**
  - Assert the current implementation exposes exactly 38 IDs beginning with `jc-`.
  - Assert every ID is unique and the merged registry count is 87.
  - Assert every JC manifest has `editorSchema`, `defaultPayload`, and a five-family intent.
  - Assert no `DesignDemo`, shared primitive, or unprefixed ID appears.

- [ ] **Step 2: Run the focused QA script**
  - Run `node scripts/qa-test-jc-components.cjs`.
  - Expected: fail because the JC runtime registry and manifest entries do not exist yet.

- [ ] **Step 3: Add the focused script to `scripts/test-runner.cjs`**
  - Keep the script directly executable with `node` and have the test runner fail until the 38 assets are registered.

---

### Task 2: Copy the 38 standalone source components and shared JC helpers

**Files:**
- Create: `src/JasonWu/components/jc/*.tsx` for the 38 standalone visual component files.
- Create: `src/JasonWu/components/jc/jc-tokens.ts`
- Create: `src/JasonWu/components/jc/jc-motion.ts`
- Create: `src/JasonWu/components/jc/index.ts`

**Interfaces:**
- Consumes: external `substrate/src/design/*.tsx` component source plus its `tokens.ts` and `motion.ts` helper implementations.
- Produces: local, compilable JC components with unchanged visual internals and explicit exports for adapter registration.

- [ ] **Step 1: Copy only standalone visual files**
  - Copy the 38 component files into `src/JasonWu/components/jc/`.
  - Rewrite only relative import paths needed for the local helper locations; do not rewrite JSX, animation constants, or layout styles.

- [ ] **Step 2: Copy the helper implementations under local names**
  - Copy the external token and motion helpers as `jc-tokens.ts` and `jc-motion.ts`.
  - Preserve the external color, typography, and motion values so the imported components retain their original behavior.

- [ ] **Step 3: Add explicit exports**
  - Export only the 38 standalone visual components from `index.ts`.
  - Do not export `DesignDemo`, QC probes, scene primitives, or helper-only symbols as layout assets.

- [ ] **Step 4: Run TypeScript compilation for the imported folder**
  - Run `npx tsc --noEmit --pretty false` and capture any existing unrelated errors separately from JC errors.
  - Expected after fixes: no errors whose source is under `src/JasonWu/components/jc/`.

---

### Task 3: Build the single JC adapter and runtime registry

**Files:**
- Create: `src/JasonWu/components/jc/jc-adapter.tsx`
- Create: `src/JasonWu/jcLayoutRegistry.ts`
- Modify: `src/JasonWu/layoutRegistry.ts`
- Modify: `src/JasonWu/layoutRuntime.ts`
- Modify: `src/JasonWu/JasonWuComposition.tsx`

**Interfaces:**
- Consumes: `layer.payload`, `layer.accent`, current `MotionWrapper`, and 38 explicit component exports.
- Produces: `jcLayoutRegistry[layoutId]`, adapter props `{layer, payload, accent, enterAt, exitAt}`, and standard `LayoutEffectProps` compatibility.

- [ ] **Step 1: Add the accent translator**
  - Map semantic accents to the local JC color type: `blue -> blue`, `green -> green`, `yellow -> yellow`, `red -> red`.
  - Inject `accent` and `color` only when the wrapped component declares/uses those props; otherwise preserve its default props.

- [ ] **Step 2: Add the common adapter wrapper**
  - Normalize `layer.payload.contentPayload` into the component's expected props using the existing payload helpers.
  - Pass category/headline/effect text into supported title slots.
  - Wrap the visual body in `MotionWrapper` so the existing face-safe layout and entrance/exit timing apply uniformly.

- [ ] **Step 3: Register all 38 namespaced layouts**
  - Give every ID the form `jc-{intent}-{name}`.
  - Provide explicit component metadata, `renderLayer`, and adapter component.

- [ ] **Step 4: Route runtime lookup through the combined registry**
  - Resolve existing IDs exactly as before and resolve JC IDs from the JC registry.
  - Keep existing components' behavior unchanged.

- [ ] **Step 5: Run focused runtime tests**
  - Run `node scripts/qa-test-jc-components.cjs`.
  - Expected: source inventory and runtime lookup assertions pass; manifest assertions remain red until Task 4.

---

### Task 4: Generate the 38 manifest entries, editor schemas, and default payloads

**Files:**
- Create: `scripts/build-jc-registry.cjs`
- Modify: `src/design/components.registry.json`
- Modify: `src/design/component-weights.json`
- Modify: `src/design/types.ts`
- Modify: `src/design/component-content.ts`

**Interfaces:**
- Consumes: the explicit JC component metadata table, runtime registry, and local helper types.
- Produces: 38 JSON manifest entries with `id`, `[JC]` name, family/intent, editor schema, tokens, default payload, display intent, and initial weight 50.

- [ ] **Step 1: Define the source metadata table**
  - Map each component to one of `narrative`, `metrics`, `process`, `contrast`, or `system`.
  - Define field schemas from the actual component props, using existing controls (`text`, `textarea`, `number`, `string-list`, `key-value-list`, `select`).

- [ ] **Step 2: Define valid default payloads**
  - Supply a non-empty payload matching each component's prop shape.
  - Use the unified category/headline/effectText fields and the component-specific `contentPayload` shape.

- [ ] **Step 3: Generate and merge the JSON registry**
  - Preserve all existing 47 entries, backfill 2 runtime assets, and append exactly 38 JC entries.
  - Reject duplicate IDs and reject any non-`jc-` imported ID before writing.

- [ ] **Step 4: Initialize component weights**
  - Add every JC ID to `component-weights.json` with value `50` without overwriting existing user-configured scores.

- [ ] **Step 5: Run manifest and payload assertions**
  - Run `node scripts/qa-test-jc-components.cjs`.
  - Expected: all registry, schema, payload, and initial-weight assertions pass.

---

### Task 5: Add JC candidates to recommender and preserve existing scoring

**Files:**
- Modify: `scripts/services/component-recommender.cjs`
- Modify: `scripts/services/component-registry-store.cjs`
- Modify: `scripts/layout-matcher.cjs`
- Test: `scripts/services/component-recommender.test.cjs`

**Interfaces:**
- Consumes: JC manifests, initial weights, commercial role/family metadata, and existing fatigue penalties.
- Produces: JC candidates in the same funnel and score formula without bypassing user weights.

- [ ] **Step 1: Add failing recommender assertions**
  - Assert a JC component appears in its declared intent/family candidate pool.
  - Assert the score uses the existing `semanticScore * 0.4 + baseWeight * 0.6 - fatiguePenalty` formula.
  - Assert an existing custom weight changes ranking among compatible candidates.

- [ ] **Step 2: Run focused recommender tests**
  - Run `node --test scripts/services/component-recommender.test.cjs`.
  - Expected: fail until the JC manifests are consumed by the recommender.

- [ ] **Step 3: Merge JC manifests into recommender metadata**
  - Load only valid `jc-*` entries from the registry store.
  - Keep existing role routing and fatigue behavior intact.

- [ ] **Step 4: Preserve payload hydration**
  - Ensure `hydrateLayerWithPayload()` can pass arbitrary JC `contentPayload` through without static mock replacement.

- [ ] **Step 5: Run focused recommender and matcher tests**
  - Run `node --test scripts/services/component-recommender.test.cjs` and `node --test scripts/layout-matcher.test.cjs`.

---

### Task 6: Verify Studio/admin schema mirroring and accent rendering

**Files:**
- Modify: `src/design/admin-components-client.tsx` only if the existing generic schema renderer cannot consume a JC field.
- Modify: `scripts/admin-components-page.cjs` only if registry loading needs the JC merged manifest.
- Create: `scripts/qa-test-jc-components.cjs` visual/runtime probes as needed.

**Interfaces:**
- Consumes: the single JSON manifest contract from Task 4.
- Produces: automatic Studio and `/admin/components` forms for all JC entries, with no per-component form page.

- [ ] **Step 1: Add schema renderer assertions**
  - Assert representative JC narrative, metrics, process, contrast, and system entries expose the same generic form shape in the admin and Studio paths.

- [ ] **Step 2: Add accent assertions**
  - Render representative JC adapters with all four accents and assert the resolved props carry the selected semantic accent.

- [ ] **Step 3: Run the representative preview smoke test**
  - Use the existing Remotion bundle/preview command and inspect that the JC composition does not produce a blank render or runtime exception.

---

### Task 7: Full regression and final audit

**Files:**
- Modify: only files already listed above if a regression is found.

- [ ] **Step 1: Run `node scripts/qa-test-jc-components.cjs`**
  - Expected: 38 JC assets, 87 total assets, zero duplicate IDs, valid schemas/payloads, and runtime registrations.

- [ ] **Step 2: Run `node scripts/test-runner.cjs`**
  - Expected: all existing suites plus the JC suite pass.

- [ ] **Step 3: Run the Remotion compile probe**
  - Run `npx remotion compositions src/index.ts` or the repository's equivalent direct Node command.
  - Expected: the project bundle discovers the combined registry without TypeScript/runtime errors from JC assets.

- [ ] **Step 4: Audit the final diff**
  - Confirm no external source file was modified, no existing visual component was rewritten, no non-`jc-*` imported ID exists, and no user weight was overwritten.

- [ ] **Step 5: Report the final asset count and QA output**
  - Report 38 imported assets, 87 total registry assets, and the exact output of the final QA commands.