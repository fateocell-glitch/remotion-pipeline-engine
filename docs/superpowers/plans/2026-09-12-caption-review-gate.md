# Caption Review Gate Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Add a caption-first review gate before Beat production, with smart-edit and automatic-render confirmation paths.

**Architecture:** Split onboarding into Stage 1 transcription-to-review and Stage 2 production-from-confirmed-captions. Persist draft and confirmed caption files, add review endpoints, and extend the existing project modal with a review workspace that delegates automatic output to the existing full-render worker.

**Tech Stack:** Node.js HTTP server, Node.js filesystem APIs, Faster-Whisper bridge, Remotion, Studio HTML/JavaScript, Node test runner.

**Spec:** docs/superpowers/specs/2026-09-12-caption-review-gate-design.md

## Global Constraints
- source/captions.confirmed.json is the only Stage 2 input.
- Existing READY projects and caches are preserved.
- File writes use Node.js APIs.
- Review list max height is 500px.
- Smart and automatic confirmation share Stage 2 but diverge after READY.

---

### Task 1: Split onboarding and persist review storage

**Files:**
- Modify: scripts/run-local-onboarding.cjs
- Modify: scripts/services/project-store.cjs
- Test: scripts/run-local-onboarding.test.cjs

**Interfaces:**
- stage1TranscribeToReview(options) returns a CAPTIONS_REVIEW project with zero Beats.
- stage2ProduceFromConfirmed(options) returns a READY project with auto-matched timed layers.
- projectPaths adds captionsDraftFile and captionsConfirmedFile.

- [ ] Step 1: Write failing tests.

~~~js
test("stage 1 persists a captions-review shell", async () => {
  const project = await stage1TranscribeToReview(fixture);
  assert.equal(project.state, "CAPTIONS_REVIEW");
  assert.equal(project.beats.length, 0);
  assert.ok(existsSync(storage.captionsDraftFile));
});

test("stage 2 uses confirmed captions", async () => {
  await writeFile(storage.captionsConfirmedFile, JSON.stringify(confirmed));
  const project = await stage2ProduceFromConfirmed({projectId});
  assert.equal(project.state, "READY");
  assert.ok(project.beats.length > 0);
  assert.equal(project.captions[0].zh, confirmed[0].zh);
});
~~~

- [ ] Step 2: Run node --test scripts/run-local-onboarding.test.cjs and verify failure.
- [ ] Step 3: Implement storage paths and both stage functions.
- [ ] Step 4: Run node --test scripts/run-local-onboarding.test.cjs and verify pass.

### Task 2: Add server confirmation routes

**Files:**
- Modify: scripts/project-editor-web.cjs
- Test: scripts/project-editor-web.test.cjs

**Interfaces:**
- GET /api/projects/:id/captions-review loads draft or cleaned captions.
- PUT /api/projects/:id/captions-draft saves review edits.
- POST /api/projects/:id/confirm-captions accepts mode studio or auto.
- DELETE /api/projects/:id/unconfirmed abandons only CAPTIONS_REVIEW projects.

- [ ] Step 1: Write failing route assertions.

~~~js
test("host exposes caption-review routes", () => {
  assert.match(host, /captions-review/);
  assert.match(host, /captions-draft/);
  assert.match(host, /confirm-captions/);
  assert.match(host, /unconfirmed/);
});
~~~

- [ ] Step 2: Run node --test scripts/project-editor-web.test.cjs and verify failure.
- [ ] Step 3: Implement routes and atomic writes.
- [ ] Step 4: Run node --test scripts/project-editor-web.test.cjs and verify pass.

### Task 3: Add caption review modal and keyboard editing

**Files:**
- Modify: scripts/project-studio-page.cjs
- Test: scripts/project-editor-web.test.cjs

**Interfaces:**
- openCaptionReview(projectId) loads review state.
- queueCaptionDraftSave() debounces draft saves by 300ms.
- confirmCaptions(mode) starts Stage 2.

- [ ] Step 1: Write failing UI assertions.

~~~js
test("new project flow exposes caption review choices", () => {
  assert.match(page, /caption-review-modal/);
  assert.match(page, /max-height:500px/);
  assert.match(page, /确认字幕.*智能分拍/);
  assert.match(page, /确认字幕.*一键全自动成片/);
  assert.match(page, /find-replace/);
  assert.match(page, /captions-draft/);
});
~~~

- [ ] Step 2: Run node --test scripts/project-editor-web.test.cjs and verify failure.
- [ ] Step 3: Implement scrollable rows, click focus, Enter next-row focus, and debounced autosave.
- [ ] Step 4: Implement terminology cleanup and find/replace with changed-row feedback.
- [ ] Step 5: Run node --test scripts/project-editor-web.test.cjs and verify pass.

### Task 4: Connect automatic confirmation to full rendering

**Files:**
- Modify: scripts/project-editor-web.cjs
- Modify: scripts/project-studio-page.cjs
- Test: scripts/project-editor-web.test.cjs

**Interfaces:**
- Automatic confirmation returns a render job id.
- Existing render-status payload remains the progress source.
- Studio opens only after the automatic job finishes.

- [ ] Step 1: Write failing automatic-branch assertions.

~~~js
test("automatic confirmation uses the full render worker", () => {
  assert.match(host, /mode === "auto"/);
  assert.match(host, /render-project-full.cjs/);
  assert.match(page, /caption-auto-render/);
});
~~~

- [ ] Step 2: Run node --test scripts/project-editor-web.test.cjs and verify failure.
- [ ] Step 3: Start the existing full-render worker after Stage 2 and surface its existing beat-level progress in the modal.
- [ ] Step 4: Run node --test scripts/project-editor-web.test.cjs and verify pass.

### Task 5: Regression and validation

**Files:**
- Modify: scripts/run-local-onboarding.test.cjs
- Modify: scripts/project-editor-web.test.cjs

- [ ] Step 1: Add draft reopen and READY compatibility coverage.
- [ ] Step 2: Run node --test scripts/run-local-onboarding.test.cjs scripts/project-editor-web.test.cjs scripts/project-render-assets.test.cjs.
- [ ] Step 3: Run node node_modules/typescript/bin/tsc --noEmit.
