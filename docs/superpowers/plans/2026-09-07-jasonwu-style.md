# JasonWu Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable Remotion composition named `JasonWu` that recreates the reference video's key talking-head information-graphic style.

**Architecture:** Add a focused `src/JasonWu` module containing data, pure timeline helpers, and React presentation components. Register the new composition in the existing root composition file without changing the existing videos.

**Tech Stack:** Remotion 4, React 19, TypeScript, existing local Remotion CLI.

**Spec:** `docs/superpowers/specs/2026-09-07-jasonwu-style-design.md`

## Global Constraints

- Keep the composition named `JasonWu`.
- Use `zhuzigeceo.mp4` from the Remotion `public/` folder when available; otherwise the composition should still render with a styled placeholder background.
- Preserve the project policy: do not alter AI Link model service endpoints, ports, base URLs, API bases, or API keys.
- Avoid the purple/yellow neon HUD look from the earlier tech remakes.
- Do not add new runtime dependencies.

---

### Task 1: Timeline Data And Tests

**Files:**
- Create: `src/JasonWu/timeline.ts`
- Create: `src/JasonWu/timeline.test.ts`

**Interfaces:**
- Produces: `type JasonWuCue`, `type JasonWuSection`, `jasonWuCues`, `activeCueAtFrame(cues, frame, fps)`.

- [x] **Step 1: Write the failing test**

```ts
import {activeCueAtFrame, jasonWuCues} from "./timeline";

const cue = activeCueAtFrame(jasonWuCues, 600, 30);
if (cue.section.eyebrow !== "APPLE EVENT · SURPRISE AND SHINE") {
  throw new Error(`Unexpected cue: ${cue.section.eyebrow}`);
}
```

- [x] **Step 2: Run type check to verify it fails**

Run: `node_modules/.bin/tsc.CMD --noEmit`
Expected: FAIL because `./timeline` does not exist.

- [x] **Step 3: Implement timeline data and selector**

Create typed cue data covering sample scenes at 0-8s, 8-18s, 18-30s, and 30-45s.

- [x] **Step 4: Run type check to verify it passes**

Run: `node_modules/.bin/tsc.CMD --noEmit`
Expected: PASS.

### Task 2: Visual Components

**Files:**
- Create: `src/JasonWu/JasonWuComposition.tsx`
- Modify: `src/Composition.tsx`

**Interfaces:**
- Consumes: `jasonWuCues` and `activeCueAtFrame`.
- Produces: `JasonWuComposition`.

- [x] **Step 1: Build the composition shell**

Render the source video background, dark overlay, cool tint, vignette, chapter label, subtitles, and one active visual module group.

- [x] **Step 2: Register the composition**

Add a `Composition` with id `JasonWu`, 1920x1080, 30fps, and 1350 frames.

- [x] **Step 3: Run type check**

Run: `node_modules/.bin/tsc.CMD --noEmit`
Expected: PASS.

### Task 3: Visual Verification

**Files:**
- Output: `out/jasonwu_frame_*.png`

**Interfaces:**
- Consumes: Remotion composition id `JasonWu`.

- [x] **Step 1: Render still frames**

Run still renders at frames 90, 420, and 900.

- [x] **Step 2: Inspect stills**

Confirm the frame is nonblank, uses the blue/white Apple-information style, contains bilingual captions, and includes one or more information cards.
