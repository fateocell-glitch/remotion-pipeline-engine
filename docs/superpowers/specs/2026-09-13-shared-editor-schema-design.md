# Shared Editor Schema Design

## Goal
Make the Component Library and Studio Layer inspector render the same component-specific content form from one editor schema, while preserving separate default-template and current-Beat values.

## Data Boundaries
- components.registry.json owns each component default template (mockData) and visual tokens.
- A component editorSchema declares content fields, labels, field types, repeatable capacity, and layout-specific variants.
- A Beat Layer owns category, headline, and payload.contentPayload; it never writes to registry defaults.
- The semantic extractor emits the same contentPayload structure selected by the matching component editorSchema.
- Renderer compatibility aliases are derived from contentPayload in one normalization path.

## UI Behavior
- Admin Component Studio renders editorSchema against mockData as a default template / sandbox example.
- Studio renders the same editorSchema against the selected Layer payload as current Beat semantic content.
- Field label, ordering, input type, and item capacity match between both surfaces.
- Missing items initialize from the template structure; excess generated items remain in Layer data but only render up to a fixed visual capacity.

## Validation
- Every registered visual component has an editorSchema.
- Both editor clients consume a common schema resolver instead of independent component-name conditionals.
- Regression tests cover schema coverage and Studio rendering for narrative, chips, steps, and metrics.
