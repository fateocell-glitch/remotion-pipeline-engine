# Video Project Studio Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a durable three-column Video Project Studio where every beat can be edited, rendered, reopened, and assembled into a current-version full video.

**Architecture:** Persist each beat's revision and render state in the project JSON. Store current beat assets under a project-specific output directory and add server routes that update only the matching revision. Replace the current single-column page with a responsive three-column Studio that reads this durable state.

**Tech Stack:** Node.js HTTP server, browser-native JavaScript and CSS, Remotion CLI, PowerShell segment renderer, JSON project files, node:test.

**Spec:** `docs/superpowers/specs/2026-09-09-video-project-studio-lifecycle-design.md`

## Global Constraints

- Keep `scripts/project-editor-web.cjs` as the active editor service.
- Do not modify AI Link endpoints, ports, base URLs, API keys, or model routing.
- Preserve local whisper.cpp onboarding and existing project JSON compatibility.
- Use real overlapping caption content for generated beat drafts; do not write placeholder text.
- Editing a rendered beat must immediately hide its old preview.

---

### Task 1: Add Render Lifecycle Data Helpers

**Files:**
- Create: `scripts/project-render-assets.cjs`
- Create: `scripts/project-render-assets.test.cjs`
- Modify: `scripts/project-onboarding.cjs`

**Interfaces:**
- Produces `ensureProjectLifecycle(project)`, `invalidateBeat(project, beatId)`, `currentAssetPath(projectId, beat)`, and `projectAssetDir(projectId)`.
- Produces `render` fields compatible with project and beat records.

- [ ] **Step 1: Write the failing lifecycle tests**

```js
test("editing a ready beat increments its revision and hides its preview", () => {
  const result = invalidateBeat({
    beats: [{id: "beat-001", render: {revision: 1, status: "ready", previewPath: "out/a.mp4"}}],
  }, "beat-001");
  assert.deepEqual(result.beats[0].render, {
    revision: 2, status: "stale", previewPath: null, renderedAt: null, error: null,
  });
});
```

- [ ] **Step 2: Run the lifecycle test and verify it fails**

Run: `node --test scripts/project-render-assets.test.cjs`

Expected: failure because `project-render-assets.cjs` does not exist.

- [ ] **Step 3: Implement lifecycle defaults and invalidation**

```js
function ensureProjectLifecycle(project) {
  return {
    ...project,
    render: project.render ?? {status: "idle", progress: 0, outputPath: null, renderedAt: null, error: null},
    beats: project.beats.map((beat) => ({
      ...beat,
      render: beat.render ?? {revision: 1, status: "idle", previewPath: null, renderedAt: null, error: null},
    })),
  };
}
```

- [ ] **Step 4: Run lifecycle tests and onboarding tests**

Run: `node --test scripts/project-render-assets.test.cjs scripts/project-onboarding.test.cjs`

Expected: all tests pass.

### Task 2: Persist Current Beat Preview Assets

**Files:**
- Modify: `scripts/project-editor-web.cjs`
- Modify: `scripts/project-render-assets.cjs`
- Modify: `scripts/project-render-assets.test.cjs`

**Interfaces:**
- `POST /api/projects/:id/beats/:beatId/render` returns a job for the beat's current revision.
- `GET /api/projects/:id/assets` returns the durable beat and full-render lifecycle state.

- [ ] **Step 1: Write failing tests for revision-specific assets**

```js
test("asset path is unique to the beat revision", () => {
  assert.equal(currentAssetPath("demo", {id: "beat-004", render: {revision: 3}}),
    "out/project-assets/demo/beat-004-r3.mp4");
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test scripts/project-render-assets.test.cjs`

Expected: failure because the asset path helper is missing.

- [ ] **Step 3: Write beat render completion only for the current revision**

```js
const revision = beat.render.revision;
// On render completion, reload the project and write previewPath only if
// the matching beat still has the same revision.
```

- [ ] **Step 4: Verify the service and tests**

Run: `node --check scripts/project-editor-web.cjs`

Run: `node --test scripts/project-render-assets.test.cjs scripts/project-editor-web.test.cjs`

Expected: syntax check and tests pass.

### Task 3: Make Save, Auto-Match, and Re-Slice Invalidate Assets

**Files:**
- Modify: `scripts/project-editor-web.cjs`
- Modify: `scripts/project-onboarding.cjs`
- Modify: `scripts/project-render-assets.test.cjs`

**Interfaces:**
- Saving a changed beat invalidates only that beat and the full output.
- Auto-match invalidates changed unlocked beats only.
- `POST /api/projects/:id/re-slice` regenerates beats and invalidates all beat assets after confirmation.

- [ ] **Step 1: Write failing invalidation tests**

```js
test("re-slice clears selected project assets without changing captions", () => {
  const next = replaceBeats(project, generatedBeats);
  assert.equal(next.captions.length, project.captions.length);
  assert.equal(next.beats.every((beat) => beat.render.status === "idle"), true);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test scripts/project-render-assets.test.cjs`

Expected: failure because `replaceBeats` is missing.

- [ ] **Step 3: Implement selective invalidation and re-slice endpoint**

```js
if (!confirmed) return send(res, 409, "Re-slicing requires confirmation.", "text/plain");
```

- [ ] **Step 4: Run lifecycle, onboarding, matcher, and web-service tests**

Run: `node --test scripts/project-render-assets.test.cjs scripts/project-onboarding.test.cjs scripts/layout-matcher.test.cjs scripts/project-editor-web.test.cjs`

Expected: all tests pass.

### Task 4: Render Full Videos From Current Assets

**Files:**
- Create: `scripts/render-project-current-assets.ps1`
- Modify: `scripts/project-editor-web.cjs`
- Modify: `scripts/render-progress.cjs`
- Modify: `scripts/render-progress.test.cjs`

**Interfaces:**
- Full rendering renders missing or stale beats first, concatenates ready current assets, then muxes audio.
- Project JSON records `render.status`, progress, output path, and timestamp.

- [ ] **Step 1: Write failing project-status tests**

```js
test("full rendering cannot report ready while a beat is stale", () => {
  assert.equal(canAssemble([{render: {status: "ready"}}, {render: {status: "stale"}}]), false);
});
```

- [ ] **Step 2: Run the status test and verify it fails**

Run: `node --test scripts/render-progress.test.cjs`

Expected: failure because `canAssemble` is missing.

- [ ] **Step 3: Implement current-asset render and concat flow**

```powershell
# Render only beats whose current asset is absent or stale, then concatenate
# the paths recorded in the project JSON in beat order.
```

- [ ] **Step 4: Verify full-render logic**

Run: `node --test scripts/render-progress.test.cjs scripts/project-render-assets.test.cjs`

Expected: all tests pass.

### Task 5: Build the Three-Column Studio UI

**Files:**
- Modify: `scripts/project-editor-web.cjs`
- Modify: `scripts/project-editor-web.test.cjs`

**Interfaces:**
- Left timeline surfaces beat index, real headline, timecode, layout, lock, and render state.
- Center inspector edits content and dynamic layout props.
- Right preview displays only a ready current asset, current render status, full render controls, final output, and subtitle route.

- [ ] **Step 1: Write failing UI presence tests**

```js
test("studio presents timeline, inspector, and persistent preview regions", () => {
  assert.match(source, /studio-timeline/);
  assert.match(source, /studio-inspector/);
  assert.match(source, /studio-preview/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test scripts/project-editor-web.test.cjs`

Expected: failure because the Studio regions are absent.

- [ ] **Step 3: Implement desktop and responsive CSS**

```css
.studio {height: 100vh; display: grid; grid-template-columns: 280px minmax(0, 1fr) 480px;}
@media (max-width: 1199px) {.studio {display: block;} .studio-timeline {display: none;}}
```

- [ ] **Step 4: Implement controls and stale-preview behavior**

```js
if (beat.render.status !== "ready") {
  preview.removeAttribute("src");
  previewStatus.textContent = "修改后需要重新渲染此片段";
}
```

- [ ] **Step 5: Verify served browser script**

Run: `node --check scripts/project-editor-web.cjs`

Run: extract the `<script>` from `http://127.0.0.1:4318/` and parse it with `new Function`.

Expected: both checks pass.

### Task 6: Verify Project Reopen and Existing-Project Migration

**Files:**
- Modify: `scripts/project-editor-web.cjs`
- Modify: `scripts/project-editor-web.test.cjs`
- Modify: `src/JasonWu/projects/new-video.json` only through lifecycle migration code.

**Interfaces:**
- Existing JSON projects without lifecycle fields gain safe defaults when loaded.
- A reopened project exposes ready current beat assets and its final output.

- [ ] **Step 1: Write failing migration and reopen tests**

```js
test("legacy projects load with ready-to-render lifecycle records", () => {
  const project = ensureProjectLifecycle({beats: [{id: "beat-001"}]});
  assert.equal(project.beats[0].render.status, "idle");
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test scripts/project-render-assets.test.cjs`

Expected: failure because legacy migration is missing.

- [ ] **Step 3: Implement load-time migration and project asset reporting**

```js
const project = ensureProjectLifecycle(await getProject(projectId));
```

- [ ] **Step 4: Run full targeted verification**

Run: `node --test scripts/project-render-assets.test.cjs scripts/project-onboarding.test.cjs scripts/layout-matcher.test.cjs scripts/project-editor-web.test.cjs scripts/render-progress.test.cjs`

Run: `node --check scripts/project-editor-web.cjs`

Expected: all tests pass with zero failures.
