/**
 * What proves each feature in docs/features.md, one entry per `##` section.
 *
 * A proof is a test file, a scenario `bun run check:live` drives in a real terminal, or `manual`
 * with the reason nothing automated reaches it. A section is proved in parts more often than whole,
 * so an entry is a list, and the part no test reaches is named as manual rather than left looking
 * covered. feature-proofs.test.ts fails when a section has no entry, when an entry names a section
 * that is gone, a test file that does not exist or a scenario the runner does not have.
 */

export type Proof = { test: string } | { live: string } | { manual: string };

const needsModelTurn = 'needs a real model turn, which spends tokens';

export const FEATURE_PROOFS: Record<string, readonly Proof[]> = {
  'Opening and closing the pane': [
    { test: 'plugins/sidepad/tests/register.test.ts' },
    { test: 'plugins/sidepad/tests/pane-toggle.test.ts' },
    { test: 'plugins/sidepad/tests/handlers.test.ts' },
    { manual: 'a pane closed with its mark staying closed: the kit cannot close a pane as a person does' },
    { manual: 'the 110-column answer in a real terminal: not yet a live scenario' },
  ],
  "Following Claude's edits": [
    { test: 'plugins/sidepad/tests/follow.test.ts' },
    { test: 'plugins/sidepad/tests/edits.test.ts' },
    { test: 'plugins/sidepad/tests/register.test.ts' },
    { manual: `the pane opening or moving at the end of a turn: ${needsModelTurn}` },
  ],
  Navigating: [
    { test: 'plugins/sidepad/tests/listing.test.ts' },
    { test: 'plugins/sidepad/tests/paths.test.ts' },
    { test: 'plugins/sidepad/tests/handlers.test.ts' },
    { test: 'plugins/sidepad/tests/plan.test.ts' },
    { live: 'locked-directory-notes-why' },
  ],
  'Reading a file': [
    { test: 'plugins/sidepad/tests/files.test.ts' },
    { test: 'plugins/sidepad/tests/line-window.test.ts' },
    { test: 'plugins/sidepad/tests/ensure-window.test.ts' },
    { test: 'plugins/sidepad/tests/plan.test.ts' },
    { test: 'plugins/sidepad/tests/window.test.ts' },
    { manual: "a wheel tick's step: the kit's scroll is not a person's wheel, and not yet a live scenario" },
    { manual: 'a file past the read cap scrolling by windows in a terminal: not yet a live scenario' },
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
    { manual: 'typing right after a drag reaching the prompt box: not yet a live scenario' },
    { manual: "a drag held past the window's edge: not yet a live scenario" },
  ],
  'Asking Claude about a selection': [
    { test: 'plugins/sidepad/tests/ask.test.ts' },
    { test: 'plugins/sidepad/tests/bar.test.ts' },
    { test: 'plugins/sidepad/tests/handlers.test.ts' },
    { manual: `the selection reaching the model: ${needsModelTurn}` },
  ],
  'Files changed outside the pane': [
    { test: 'plugins/sidepad/tests/handlers.test.ts' },
    { test: 'plugins/sidepad/tests/register.test.ts' },
    { manual: `a real Bash call changing the file shown: ${needsModelTurn}` },
  ],
};
