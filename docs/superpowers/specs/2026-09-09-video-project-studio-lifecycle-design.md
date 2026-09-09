# Video Project Studio Lifecycle Design

## Goal

Turn the local Video Project Studio into a closed-loop editor where every
beat can be prepared, edited, rendered, revisited, and included in a durable
full-video export.

## Scope

- Keep `scripts/project-editor-web.cjs` as the active web application.
- Keep the legacy `scripts/zhuzige-tail-editor-server.cjs` untouched.
- Preserve local whisper.cpp onboarding and never access or alter AI Link
  endpoints, ports, base URLs, or API keys.
- Use the existing project JSON files under `src/JasonWu/projects/`.

## User Workflow

1. Create a project, upload media, transcribe locally, generate captions,
   split beats, extract beat drafts, and assign layouts.
2. Enter the Studio before any full render.
3. Select a beat, edit its fields, render it, and play its current preview.
4. Any edit to a rendered beat immediately hides its old preview and marks
   the beat as needing render.
5. Start a full render. The Studio renders every beat whose current version
   lacks a completed asset, then merges the current assets.
6. Reopen a completed project later. The final video and each current beat
   preview remain available for playback and further editing.
7. Re-slicing invalidates every beat preview and the current full-video
   export. The user confirms this before the beat list is replaced.

## Project Data

Each beat gains a `render` record:

```json
{
  "revision": 3,
  "status": "ready",
  "previewPath": "out/project-assets/example/beat-004-r3.mp4",
  "renderedAt": "2026-09-09T16:00:00.000Z",
  "error": null
}
```

Allowed `status` values are:

- `idle`: never rendered.
- `rendering`: current revision is rendering.
- `ready`: current revision has a playable asset.
- `stale`: the beat was edited after its most recent render. Its preview is
  immediately hidden.
- `failed`: the latest render failed. The error is retained for display.

Project-level rendering is persisted in `project.render`:

```json
{
  "status": "idle",
  "progress": 0,
  "outputPath": null,
  "renderedAt": null,
  "error": null
}
```

The project JSON is the source of truth. Files under
`out/project-assets/<projectId>/` are the current render assets referenced by
that JSON.

## Content Draft Rules

Beat text is derived from overlapping captions:

```js
caption.end > beat.start && caption.start < beat.end
```

For each beat:

- `eyebrow` is a meaningful numbered topic label.
- `subtitle` is a concise hook derived from the opening caption.
- `zh` is a readable, compact selection of the Chinese captions in that
  time window.
- `en` combines matching translated caption text.

No `Key Point`, `CHAPTER`, `Core point`, or Chinese placeholder text may enter
a generated project. A silent trailing beat reuses the nearest prior caption
as a closing draft.

## Studio Layout

The active editor is a fixed-height three-column workspace at widths of
1200px and above:

- Left, 280px: project selection, new project action, scrollable beat cards,
  status markers, timecodes, layout badges, lock indicators, count, and
  re-slice control.
- Center, flexible: beat inspector with a two-column field grid, dynamic
  layout props, and bottom actions.
- Right, 480px: sticky 16:9 current-preview player, player status, full
  render progress, final-video link, and subtitle-proofreading action.

Below 1200px, the beat navigator becomes a drawer and the preview moves above
the inspector.

## Render Rules

- A current beat asset is playable only when `render.status === "ready"` and
  its revision matches the beat revision.
- Saving an edit increments `revision`, clears `previewPath`, sets
  `status` to `stale`, and clears the right-side preview immediately.
- A single-beat render writes a revision-specific asset and updates the
  corresponding beat record only when that revision still matches.
- Full render first ensures every beat has a `ready` current asset, then
  concatenates the asset list and muxes project audio.
- A full-render output is marked stale whenever a beat is edited or
  re-sliced.

## Re-slice Rules

Re-slicing requires confirmation because it replaces beat boundaries. It:

1. Regenerates beats from captions using the selected target duration.
2. Clears all beat asset records and the full-video record.
3. Removes only asset files under the selected project's asset directory.
4. Preserves captions and source media.

## APIs

The web service will expose:

- `GET /api/projects/:id/assets` for durable beat and full-render state.
- `POST /api/projects/:id/beats/:beatId/render` for current revision preview.
- `POST /api/projects/:id/render-all` for current-version full export.
- `POST /api/projects/:id/re-slice` for confirmed beat replacement.
- Existing save and auto-match routes will invalidate changed beat assets.

## Validation

Automated tests cover:

- Real caption draft generation without placeholders.
- Edit invalidation hides an existing preview.
- Single-beat render records a current revision asset.
- Full render uses only current ready assets.
- Re-slice clears only the selected project's assets.
- Project reopen reports durable preview and full-output state.
- Desktop and responsive browser scripts parse successfully.
