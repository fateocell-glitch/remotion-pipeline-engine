# Studio Layer Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Align all 35 lightweight Studio previews with their Remotion layouts and make layer composition safe to add, reorder, undo, and redo.

**Architecture:** Extend the server-rendered Studio page with an explicit layout preview registry and shared gallery metadata. Maintain local history snapshots only for the selected project beat and preserve existing server persistence semantics.

**Tech Stack:** Node.js server-rendered HTML/CSS/JS, Remotion React/TypeScript, node:test.

**Spec:** docs/superpowers/specs/2026-09-10-studio-layer-workflow-design.md

## Global Constraints
- Use local Node.js scripts for file writes.
- Preserve current project JSON schema and existing manual edits.
- Preview motion runs exactly twice.
- Do not alter AI Link configuration.

---

### Task 1: Preview Registry
- [ ] Add tests for explicit 35-layout preview coverage and two-loop animation.
- [ ] Replace category-only preview fallbacks with explicit layout definitions.
- [ ] Verify generated Studio script syntax.

### Task 2: Inspector Ordering
- [ ] Add regression test for props, motion, layers order.
- [ ] Render component-specific props first, common motion second, layers third.

### Task 3: Add Layer Gallery
- [ ] Add tests for search, category filter, selectable gallery cards, and normalized layer insertion.
- [ ] Add modal markup, gallery metadata, and initial-prop defaults from current beat copy.
- [ ] Verify adding two different layouts selects the new layer and keeps both editable.

### Task 4: History Safety
- [ ] Add tests for 15-step snapshots, undo, redo, and delete-toast recovery markup.
- [ ] Implement snapshot capture for add, delete, move, and edits.
- [ ] Verify undo restores a deleted layer at its original index with exact props.

### Task 5: Integration
- [ ] Mark implementation-affected previews stale where required.
- [ ] Run Studio tests, TypeScript check, generated-page script check, and two interactive API/UI smoke checks.
