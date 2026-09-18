/**
 * What proves each feature in docs/features.md, one entry per `##` section.
 *
 * A proof is a test file, a scenario `bun run check:live` drives in a real terminal, or `modelTurn`
 * naming a part only a model turn reaches: the scenarios run none, since a turn spends tokens and
 * its outcome is the model's. Nothing else may stay unchecked, so a part the kit cannot reach gets a
 * scenario, and a feature added or changed gets its scenario in the same change. A section is proved
 * in parts more often than whole, so an entry is a list. feature-proofs.test.ts fails when a section
 * has no entry, when an entry names a section that is gone, a test file that does not exist or a
 * scenario the runner does not have, and when a section has neither a scenario nor a model turn.
 */

export type Proof = { test: string } | { live: string } | { modelTurn: string };

export const FEATURE_PROOFS: Record<string, readonly Proof[]> = {
  'Opening and closing the pane': [
    { test: 'plugins/sidepad/tests/register.test.ts' },
    { test: 'plugins/sidepad/tests/pane-toggle.test.ts' },
    { test: 'plugins/sidepad/tests/handlers.test.ts' },
    { live: 'close-mark-closes-pane' },
    { live: 'narrow-terminal-answers-width' },
    { live: 'reload-lists-open-pane' },
    { live: 'clear-closes-pane-and-forgets-selection' },
    { live: 'dismissed-resume-keeps-pane' },
    { live: 'diff-panel-covers-pane' },
    { modelTurn: "a pane closed with its mark staying closed through Claude's edits" },
  ],
  "Following Claude's edits": [
    { test: 'plugins/sidepad/tests/follow.test.ts' },
    { test: 'plugins/sidepad/tests/edits.test.ts' },
    { test: 'plugins/sidepad/tests/register.test.ts' },
    { modelTurn: 'the pane opening or moving at the end of a turn' },
  ],
  Navigating: [
    { test: 'plugins/sidepad/tests/listing.test.ts' },
    { test: 'plugins/sidepad/tests/paths.test.ts' },
    { test: 'plugins/sidepad/tests/handlers.test.ts' },
    { test: 'plugins/sidepad/tests/plan.test.ts' },
    { live: 'locked-directory-notes-why' },
    { live: 'arrows-walk-the-listing' },
  ],
  'Reading a file': [
    { test: 'plugins/sidepad/tests/files.test.ts' },
    { test: 'plugins/sidepad/tests/line-window.test.ts' },
    { test: 'plugins/sidepad/tests/ensure-window.test.ts' },
    { test: 'plugins/sidepad/tests/plan.test.ts' },
    { test: 'plugins/sidepad/tests/window.test.ts' },
    { live: 'wheel-moves-code-three-lines' },
    { live: 'wheel-moves-markdown-one-block' },
    { live: 'huge-file-reads-by-windows' },
    { live: 'page-keys-move-a-code-page' },
  ],
  'Selecting a passage': [
    { test: 'plugins/sidepad/tests/pane-state.test.ts' },
    { test: 'plugins/sidepad/tests/pointer.test.ts' },
    { test: 'plugins/sidepad/tests/code-blocks.test.ts' },
    { test: 'plugins/sidepad/tests/markdown-blocks.test.ts' },
    { test: 'plugins/sidepad/tests/surface-message.test.ts' },
    { live: 'drag-selects-lines' },
    { live: 'click-toggles-block' },
    { live: 'click-selects-markdown-table' },
    { live: 'typing-after-drag-reaches-prompt' },
    { live: 'drag-held-past-edge-scrolls' },
    { live: 'selection-ending-on-blank-line-marks-it' },
  ],
  'Asking Claude about a selection': [
    { test: 'plugins/sidepad/tests/ask.test.ts' },
    { test: 'plugins/sidepad/tests/bar.test.ts' },
    { test: 'plugins/sidepad/tests/handlers.test.ts' },
    { modelTurn: 'the selection reaching the model' },
  ],
  'Files changed outside the pane': [
    { test: 'plugins/sidepad/tests/handlers.test.ts' },
    { test: 'plugins/sidepad/tests/register.test.ts' },
    { modelTurn: 'a real Bash call changing the file shown' },
  ],
};
