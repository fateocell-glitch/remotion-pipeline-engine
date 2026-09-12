# Text Normalization and Project Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Force simplified Chinese across generated project text, derive distinct semantic beat copy, and add safe project management to the local Studio.

**Architecture:** A text-analysis helper will normalize Whisper Chinese before captions and derive category, headline, and effect copy from all captions in a beat. A project-management service will own summaries, rename, cache cleanup, and sandbox deletion; the editor server exposes it and the Studio modal consumes it.

**Tech Stack:** Node.js CommonJS, node:test, local filesystem project sandboxes, existing Studio HTML/CSS/JS.

**Spec:** User-confirmed requirements in this task.

## Global Constraints

- Store all runtime assets under `data/projects/<projectId>/` and `public/project-media/<projectId>/`.
- Never alter AI Link endpoints, ports, base URLs, API bases, or API keys.
- Preserve manual beat fields and locked layouts during automatic migration.
- Use Node.js filesystem APIs for application writes.

---

### Task 1: Text Analysis and Simplified Chinese

**Files:**
- Create: `scripts/services/text-analysis.cjs`
- Modify: `scripts/project-onboarding.cjs`
- Modify: `scripts/project-onboarding.test.cjs`

- [ ] Add failing tests for traditional-to-simplified conversion and distinct category, headline, and effect copy.
- [ ] Implement normalization and full-beat semantic copy derivation.
- [ ] Run onboarding tests and confirm all pass.

### Task 2: Existing Project Migration

**Files:**
- Modify: `scripts/project-editor-web.cjs`
- Modify: `scripts/project-render-assets.cjs`
- Modify: `scripts/project-editor-web.test.cjs`

- [ ] Add failing tests that require a persisted auto-generated project to migrate to simplified Chinese and invalidate stale previews.
- [ ] Apply migration only to auto-derived fields, preserving user-edited or locked values.
- [ ] Rebuild the current `video-1789013085928` project and print three beat comparisons to the project log.

### Task 3: Project Management Service and API

**Files:**
- Create: `scripts/services/project-management.cjs`
- Create: `scripts/services/project-management.test.cjs`
- Modify: `scripts/project-editor-web.cjs`

- [ ] Add failing tests for summary sorting, rename, preview cleanup, safe deletion, and running-job deletion protection.
- [ ] Implement sandbox-only management operations and structured logging.
- [ ] Add `GET`, `PATCH`, `DELETE`, and preview cleanup API routes.

### Task 4: Project Library UI

**Files:**
- Modify: `scripts/project-studio-page.cjs`
- Modify: `scripts/project-editor-web.test.cjs`

- [ ] Add failing page assertions for the management entry and library controls.
- [ ] Add a searchable, sortable project-library modal with open, rename, preview cleanup, and double-confirm delete flows.
- [ ] Refresh the current-project selector after every management action.

### Task 5: Verification

**Files:**
- Modify: `data/projects/video-1789013085928/project.json`

- [ ] Run targeted Node test suites.
- [ ] Run all affected Studio regression tests.
- [ ] Print three migrated beat comparisons and verify simplified Chinese, semantic headings, and concise effect copy.
