# Dynamic Effect Props Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the first six high-frequency motion layouts render only structured project effectProps and make their text/list content editable in Studio.

**Architecture:** Extend layout field metadata with textarea, string-list, and key-value-list types. The Studio page renders list editors from metadata and persists arrays in layer effectProps. Components consume props first and derive only concise fallback content from the current beat; they do not display synthetic mock phrases.

**Tech Stack:** Node.js server-rendered Studio, React/Remotion, TypeScript, node:test.

**Spec:** User-approved Dynamic Effect Props architecture, September 10, 2026.

## Global Constraints
- Use Node.js scripts for file writes.
- Do not change AI Link endpoints, ports, base URLs, model routing, or keys.
- Preserve legacy scalar props while migrating list content into effectProps.
- Mark affected cached previews stale after project-data migration.

### Task 1: Dynamic Field Contract
**Files:** layoutRegistry.ts, project-editor-web.cjs, project-studio-page.cjs, project-editor-web.test.cjs
- [x] Add textarea, string-list, and key-value-list field metadata.
- [x] Render scalar and list controls from registry metadata.
- [x] Support add, delete, drag/reorder, undo, and immediate preview updates for string lists.

### Task 2: Controlled Component Pilot
**Files:** IncompleteEffectComponents.tsx, DemoEffectComponents.tsx, layoutRegistry.ts
- [x] Refactor ordered-sequence, pivot-list, diagonal-chips, bull-bear, photo-wall, and data-flow to consume effectProps.
- [x] Replace mock text fallbacks with current beat headline/effect copy only.
- [x] Add registry fields for all visible text/list content.

### Task 3: Auto Data and Migration
**Files:** project-onboarding.cjs, project-editor-web.cjs, project data
- [x] Generate 2-4 concise steps for ordered-sequence during auto layout.
- [x] Migrate the active newiphone project into effectProps.steps/items.
- [x] Invalidate affected previews and log the migration result.

### Task 4: Verification
**Files:** tests and active project JSON
- [x] Test dynamic list markup and component controlled rendering.
- [x] Test an add/delete/reorder sequence in the generated Studio client helpers.
- [x] Render or re-render the migrated ordered-sequence beat and verify structured props persisted.
