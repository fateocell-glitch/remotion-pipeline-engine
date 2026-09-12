# Caption Review Gate Design

## Goal
Require user-confirmed timed captions before semantic slicing, Beat text extraction, 43-component matching, and rendering.

## State Model
- TRANSCRIBING: Faster-Whisper is producing captions.
- CAPTIONS_REVIEW: raw, cleaned, and draft captions exist; no Beats exist.
- READY: confirmed captions have produced editable timed Beats.
- RENDERING: the automatic branch is rendering Beat assets and assembling output.

## Persistent Caption Data
- source/captions.json: raw Faster-Whisper output.
- source/captions.cleaned.json: deterministic cleaned output.
- source/captions.draft.json: review autosave.
- source/captions.confirmed.json: the only Stage 2 source.

## Workflow
1. Stage 1 extracts audio, runs Faster-Whisper, writes raw, cleaned, and draft captions, then persists a CAPTIONS_REVIEW project shell with no Beats.
2. The review modal supports inline bilingual edits, terminology cleanup, find/replace, autosave, and reopening a draft.
3. Smart confirmation writes the confirmed file, executes Stage 2, then opens READY Studio with unrastered Beats.
4. Automatic confirmation writes the confirmed file, executes Stage 2, launches the existing full render worker, and opens Studio only when all Beat assets and the assembled output are done.

## Interaction Requirements
- The caption table scroll region has a 500px maximum height.
- Clicking a row focuses its Chinese input.
- Enter without Shift saves draft and focuses the next row.
- Find/replace reports changed row count.
- Terminology cleanup uses the existing deterministic cleaner and reports changed row count.
- Abandon removes only a CAPTIONS_REVIEW shell and temporary media.

## Constraints
- No semantic slicing may run before captions are confirmed.
- Existing READY projects and render cache assets must remain untouched.
- All disk writes use Node.js filesystem operations and project-file replacements remain atomic.
