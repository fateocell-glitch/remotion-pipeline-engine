# Studio Layer Workflow Design

## Goal
Make every layout preview structurally match its Remotion component and make effect-layer editing safe, discoverable, and reversible.

## Design
- The Studio page owns one explicit 35-layout preview registry. Each layout key maps to a miniature visual renderer and metadata shared by the live preview and add-layer gallery. Preview animations run twice and then settle.
- Inspector ordering is component-specific props, common motion props, then the effect-layer stack.
- Add Effect opens a searchable category gallery. Selecting a card adds a normalized layer with registry defaults, beat-derived headline and compact effect copy, then selects that layer for editing.
- In-memory per-beat history stores up to 15 layer snapshots. Add, delete, reorder, and layer-form edits create snapshots. Undo/redo controls restore snapshots. Deletes show a 6-second undo toast.

## Safety
- Manual project persistence is unchanged. History is local to the current browser session.
- Any change to a rendered layer continues to mark its preview stale.
- No AI Link endpoint, port, base URL, model route, or API key is read or changed.
