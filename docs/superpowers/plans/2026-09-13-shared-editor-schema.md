# Shared Editor Schema Implementation Plan

Goal: Render the Component Library and each Studio Layer semantic-content form from one component editor schema.

Architecture: Add a schema resolver beside the component content normalizer. Registry assets expose the editor schema to both the React admin client and Studio page payload; each surface supplies its own data object while using the same descriptors and normalizer.

Tech Stack: Node.js CJS Studio server, React 19 admin client, TypeScript component-content helpers, Node test runner.

Spec: docs/superpowers/specs/2026-09-13-shared-editor-schema-design.md

## Global Constraints
- Registry defaults remain isolated from Beat Layer semantic data.
- Preserve existing rendering aliases through contentPayload normalization.
- Do not add component-specific form branches in Studio or admin clients.

### Task 1: Schema Resolver and Coverage Guard
Files: Create src/design/component-editor-schema.ts; modify src/design/types.ts; test src/design/component-editor-schema.test.ts.
- [ ] Write a failing test requiring all registry IDs to resolve a schema, including chapter-card, hud-glow-stack, check-progress, and progress-donut.
- [ ] Implement getComponentEditorSchema(componentId, mockData) and normalizeEditorContent(componentId, value).
- [ ] Run the focused test until green.

### Task 2: Registry and Admin Client Adoption
Files: Modify src/design/components.registry.json and src/design/admin-components-client.tsx; test src/design/componentCatalog.test.ts.
- [ ] Add or derive editorSchema for every asset.
- [ ] Replace content-type-specific admin form selection with the common schema renderer.
- [ ] Run focused client tests.

### Task 3: Studio Layer Adoption and Persistence
Files: Modify scripts/project-editor-web.cjs and scripts/project-studio-page.cjs; test scripts/project-editor-web.test.cjs.
- [ ] Attach schema metadata to Studio layout payload.
- [ ] Render descriptor fields against selected Layer payload and persist only selected Layer data.
- [ ] Run focused Studio test.

### Task 4: Full Validation
- [ ] Run node --test scripts/project-editor-web.test.cjs.
- [ ] Run node scripts/test-runner.cjs.
- [ ] Restart Studio and verify matching fields for narrative, chips, steps, and metrics.
