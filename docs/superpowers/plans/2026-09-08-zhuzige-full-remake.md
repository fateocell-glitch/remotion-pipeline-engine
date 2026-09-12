# Zhuzige Full Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a complete 7 minute 22 second JasonWu-style remake using `zhuzigeceo` source audio, timed bilingual captions, and a repeated test-video background.

**Architecture:** Add source-specific cue and subtitle data beside the existing JasonWu files, expose a `ZhuzigeFull` composition using the reusable template, and add a six-range render-and-concat PowerShell script. Reuse existing visual modules and loop behavior instead of duplicating presentation code.

**Tech Stack:** Remotion 4, React 19, TypeScript, PowerShell, bundled Remotion ffmpeg.

**Spec:** `docs/superpowers/specs/2026-09-08-zhuzige-full-design.md`

## Global Constraints

- Composition: `ZhuzigeFull`, 1920x1080, 30fps, 13,279 frames.
- Source audio: `out/zhuzigeceo-audio.wav`; background: `public/test.mp4`.
- Captions are two lines; English remains neutral white-gray.
- Render six adjacent h264 segments and concatenate with `-c copy`.
- Do not add dependencies or alter AI Link service routing.

---

### Task 1: Source Timeline Data

**Files:**
- Create: `src/JasonWu/zhuzigeFullScript.ts`
- Create: `src/JasonWu/zhuzigeFullScript.test.ts`

**Interfaces:**
- Produces: `zhuzigeFullCues: JasonWuCue[]`.
- Consumes: `JasonWuCue` and `activeCueAtFrame()` from `timeline.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import {activeCueAtFrame} from "./timeline";
import {zhuzigeFullCues} from "./zhuzigeFullScript";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

assert(zhuzigeFullCues.length === 6, "Expected six full-video sections");
assert(activeCueAtFrame(zhuzigeFullCues, 0, 30).id === "zhuzige-succession", "Unexpected opening");
assert(activeCueAtFrame(zhuzigeFullCues, 7800, 30).id === "zhuzige-future", "Unexpected future section");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/tsx.CMD src/JasonWu/zhuzigeFullScript.test.ts`

Expected: FAIL because `zhuzigeFullScript` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create six contiguous cues from 0 to 442.62 seconds. Use the existing layouts in this order:
`person-rank`, `engineering-return`, `cook-machine`, `capital-dashboard`, `market-battlefield`, `finale-kinetic`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node_modules/.bin/tsx.CMD src/JasonWu/zhuzigeFullScript.test.ts`

Expected: PASS.

### Task 2: Timed Bilingual Subtitle Data

**Files:**
- Create: `src/JasonWu/zhuzigeFullTranscript.ts`
- Create: `src/JasonWu/zhuzigeFullTranscript.test.ts`

**Interfaces:**
- Produces: `zhuzigeFullTranscript: JasonWuTranscriptCue[]`.
- Consumes: raw VTT timing from `out/zhuzigeceo-whisper.vtt`.

- [ ] **Step 1: Write the failing test**

```ts
import {zhuzigeFullTranscript} from "./zhuzigeFullTranscript";

const finalCue = zhuzigeFullTranscript.at(-1);
if (!finalCue || finalCue.end < 442) {
  throw new Error("Transcript must cover the full source audio");
}
if (zhuzigeFullTranscript.some((cue) => !cue.zh || !cue.en)) {
  throw new Error("Every caption requires both language lines");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/tsx.CMD src/JasonWu/zhuzigeFullTranscript.test.ts`

Expected: FAIL because `zhuzigeFullTranscript` does not exist.

- [ ] **Step 3: Write minimal implementation**

Use VTT timestamps and source Chinese text. Provide concise, neutral-English translations for every caption interval. Ensure the last cue ends at 442 seconds or later.

- [ ] **Step 4: Run test to verify it passes**

Run: `node_modules/.bin/tsx.CMD src/JasonWu/zhuzigeFullTranscript.test.ts`

Expected: PASS.

### Task 3: Composition Registration

**Files:**
- Modify: `src/JasonWu/JasonWuComposition.tsx`
- Modify: `src/Composition.tsx`

**Interfaces:**
- Produces: `ZhuzigeFullComposition`.
- Consumes: full cue and transcript arrays, `JasonWuTemplate`.

- [ ] **Step 1: Write the failing type check expectation**

Add imports for `zhuzigeFullCues` and `zhuzigeFullTranscript`, then register an unresolved `ZhuzigeFullComposition` export in `Composition.tsx`.

- [ ] **Step 2: Run type check to verify it fails**

Run: `node_modules/.bin/tsc.CMD --noEmit`

Expected: FAIL because `ZhuzigeFullComposition` does not exist.

- [ ] **Step 3: Write minimal implementation**

Export:

```tsx
export const ZhuzigeFullComposition: React.FC = () => (
  <JasonWuTemplate
    cues={zhuzigeFullCues}
    audioSrc="../out/zhuzigeceo-audio.wav"
    videoSrc="test.mp4"
    loopVideoFrames={2714}
    transcriptCues={zhuzigeFullTranscript}
  />
);
```

Register `ZhuzigeFull` at 13,279 frames.

- [ ] **Step 4: Run type check to verify it passes**

Run: `node_modules/.bin/tsc.CMD --noEmit`

Expected: PASS.

### Task 4: Segmented Rendering

**Files:**
- Create: `scripts/render-zhuzige-full-segments.ps1`
- Modify: `package.json`

**Interfaces:**
- Produces: six files in `out/segments/zhuzige-full-*.mp4` and `out/zhuzigeceo-remake-full.mp4`.

- [ ] **Step 1: Write the failing command expectation**

Run: `node_modules/.bin/remotion.CMD render src/index.ts ZhuzigeFull out/segments/zhuzige-full-001.mp4 --frames=0-2219`

Expected: FAIL before `ZhuzigeFull` is registered.

- [ ] **Step 2: Write minimal implementation**

Add `render:zhuzige-full:segments` to `package.json`. Split the frames into:
`0-2219`, `2220-4439`, `4440-6659`, `6660-8879`, `8880-11099`, and `11100-13278`.
Render with the existing fast settings. Write an ffmpeg concat list and merge via `-c copy`.

- [ ] **Step 3: Run the segmented rendering script**

Run: `npm run render:zhuzige-full:segments`

Expected: six segment files and `out/zhuzigeceo-remake-full.mp4`.

### Task 5: Visual and Duration Verification

**Files:**
- Output: `out/zhuzige-full-frame-*.png`

- [ ] **Step 1: Render representative stills**

Run:

```powershell
node_modules/.bin/remotion.CMD still src/index.ts ZhuzigeFull out/zhuzige-full-frame-090.png --frame=90
node_modules/.bin/remotion.CMD still src/index.ts ZhuzigeFull out/zhuzige-full-frame-6600.png --frame=6600
node_modules/.bin/remotion.CMD still src/index.ts ZhuzigeFull out/zhuzige-full-frame-13100.png --frame=13100
```

- [ ] **Step 2: Inspect subtitles and visual modules**

Confirm each still is nonblank, its Chinese/English caption stays within the safe lower area, English is neutral white-gray, and its active visual module fits the composition.

- [ ] **Step 3: Verify final duration**

Run: `node_modules/.bin/remotion.CMD ffmpeg -i out/zhuzigeceo-remake-full.mp4`

Expected: duration approximately `00:07:22`.




