# JasonWu Style Design

**Goal:** Build a reusable Remotion style system named `JasonWu` that recreates the key visual language observed in `zhuzigeceo.mp4` for future talking-head videos.

**Reference:** `D:\Users\Administrator\Documents\ChatGPT\remotionskill\zhuzigeceo.mp4`

## Observed Style

- Format: 1920x1080, 16:9, 30fps.
- Base video: darkened talking-head or full-screen B-roll, usually with a cool green-blue tint and a soft vignette.
- Persistent label: top-left uppercase blue English section title with wide spacing, plus a smaller Chinese subtitle below.
- Captions: centered bilingual bottom captions, large bold Chinese above smaller English, white text with dark shadow and optional translucent black backing.
- Cards: translucent dark panels with Apple-blue borders, small glows, 8-14px radii, compact bilingual labels, and high information density.
- Motion: fast restrained fades, small slides, and subtle scale pops. Avoid heavy neon HUD corners, scanlines, and purple/yellow cyber styling.

## Reusable Components

- `JasonWuVideoBase`: renders a source video or B-roll with dark overlay, vignette, and cool tint.
- `JasonWuChapterLabel`: top-left English/Chinese section marker.
- `JasonWuSubtitle`: bilingual bottom subtitle bar.
- `JasonWuPersonCard`: circular portrait, name, role, and micro metadata.
- `JasonWuStepList`: numbered pivot/checklist rows with active/inactive visual states.
- `JasonWuTimeline`: horizontal milestone line with highlighted current point.
- `JasonWuMediaCard`: rounded image/video placeholder card with thin blue border.
- `JasonWuMetricBadge`: circular data badge for high-impact numbers.
- `JasonWuComposition`: stitches sample scenes together and demonstrates the reusable style.

## Data Model

The composition is driven by timeline cues. Each cue owns a start/end time, section label, captions, and optional visual modules. Future videos can reuse the same component by replacing cue data and media paths.

## Template Library Fit

- Reuse motion ideas from `animated-list.tsx`, `progress-steps.tsx`, `stat-counter.tsx`, `picture-in-picture.tsx`, and `lower-third.tsx`.
- Do not reuse their full-screen demo shells or default color system.
- Existing `TechRemake9531` and `TechRemakeShousilang` are references for Remotion wiring only, not for visual style.

## Acceptance

- Remotion exposes a `JasonWu` composition.
- The first preview contains the observed modules: background treatment, chapter label, bilingual subtitles, person card, timeline, step list, media card, and metric badge.
- Type checks pass.
- At least one rendered still proves the composition is nonblank and visually aligned with the reference direction.

## Optimization Notes Added 2026-09-07

- Local Node runtime was found at `D:\Users\Administrator\Documents\ChatGPT\oralvideos\_shared_tools\node\node.exe`.
- Edge TTS voices confirmed available for future tests: `zh-CN-YunjianNeural` and `zh-CN-YunxiNeural`. Prefer `zh-CN-YunjianNeural` first for forceful tech/finance narration; use `zh-CN-YunxiNeural` for a younger and brighter delivery.
- Important Arabic numerals should animate upward when they appear, including percent values, CEO rank numbers, valuation/cash figures, years, device counts, and product counts. Chapter and chip sequence labels such as `01` / `02` remain static.
- Chip card entrance animation uses absolute timing: 30 frames for entry and 16 frames between stacked chip starts at 30fps.
- Active chip cards keep a subtle floating glow and one-pass shimmer after entry instead of freezing completely.
- Test-video subtitles are driven by the generated Edge TTS VTT timing, with keyword color emphasis in blue, gold, and green.
- Full renders should use faster settings by default: `--concurrency=75%` and `--x264-preset=veryfast`.
- Long-form videos should be split into scene-range renders and stitched after approval previews, so revisions only re-render changed segments.
