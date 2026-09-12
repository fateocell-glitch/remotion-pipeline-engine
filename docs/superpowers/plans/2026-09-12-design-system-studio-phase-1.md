# Design System Studio Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a super-admin component design system for the 43 visual layouts, with versioned global tokens, same-family replacement, a live Remotion Player sandbox, and render-cache invalidation.

**Architecture:** Keep component identities in TypeScript and editable visual presets in a versioned JSON registry. A resolver merges registry tokens with beat-specific content, so changing global design tokens never overwrites project copy. The Node Studio service owns authenticated CRUD and serves an in-process React Player bundle for the admin sandbox.

**Tech Stack:** Node HTTP server, React, Remotion Player, TypeScript, JSON persistence, node:test.

**Spec:** User-approved Design System Studio phase 1 requirements in this conversation.

## Global Constraints

- 43 visual layouts are registered once; subtitles are a separate asset.
- All file writes use Node scripts with atomic temporary-file renames.
- No iframe or postMessage preview transport.
- Registry changes invalidate only beats using the changed component.
- Imported third-party code is out of phase 1; only existing internal components are enabled.

---

### Task 1: Registry Contract and Resolver

**Files:**
- Create: `src/design/components.registry.json`
- Create: `scripts/services/component-registry-store.cjs`
- Test: `scripts/component-registry-store.test.cjs`

- [x] Define 43 layout records across `metrics`, `steps`, `chips`, `narrative`, and `subtitles` metadata.
- [x] Add token validation, default mock data, atomic read/write, and per-record version increments.
- [x] Test family lookups and version changes.

### Task 2: Runtime Resolution and Cache Hash

**Files:**
- Create: `src/design/component-preset-resolver.ts`
- Modify: `scripts/project-render-assets.cjs`
- Modify: `src/JasonWu/JasonWuComposition.tsx`
- Test: `scripts/project-render-assets.test.cjs`

- [x] Resolve component defaults plus global tokens without replacing beat effectProps.
- [x] Include relevant registry version and tokens in the beat render hash.
- [x] Test only beats using a modified layout become stale.

### Task 3: Admin APIs and Authorization

**Files:**
- Modify: `scripts/project-editor-web.cjs`
- Test: `scripts/project-editor-web.test.cjs`

- [x] Serve `/admin/components` behind a local super-admin gate.
- [x] Add list, get, update, and sandbox data APIs.
- [x] Validate payloads and persist preset changes atomically.

### Task 4: Admin Page and Player Sandbox

**Files:**
- Create: `scripts/admin-components-page.cjs`
- Create: `src/design/AdminComponentSandbox.tsx`
- Modify: build scripts or public bundle entry as required.
- Test: `scripts/admin-components-page.test.cjs`

- [x] Render family tree, token inspector, and player canvas.
- [x] Bind controls to live mockData and replay the current animation.
- [x] Persist global presets only through explicit Save action.

### Task 5: Studio Family Replacement

**Files:**
- Modify: `scripts/project-studio-page.cjs`
- Modify: `scripts/layout-matcher.cjs`
- Test: `scripts/project-editor-web.test.cjs`

- [x] Read candidate layouts from registry family values.
- [x] Preserve beat-specific props when swapping compatible layouts.
- [x] Prevent cross-family selection in the editor UI.

### Task 6: Verification

- [x] Run focused registry, rendering cache, server page, and studio tests.
- [x] Run TypeScript check.
- [x] Restart Studio only after confirming no active project render jobs.
- [x] Verify `/admin/components` serves the family list and live Player bundle.
