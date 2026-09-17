import type { RenderInput } from 'claude-code';

/**
 * The hint line under the prompt, drawn at a terminal width: how the plugin learns the width before
 * a pane exists.
 */
export const hintAt = (columns: number): RenderInput<'PromptHint', 'terminal'> => ({
  component: 'PromptHint',
  surface: 'terminal',
  requestId: 'hint',
  viewport: { columns, rows: 40 },
  props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
});
