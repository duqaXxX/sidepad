import type { RenderInput } from 'claude-code';

/**
 * The hint line under the prompt, drawn at a terminal width and in a layout: how the plugin learns
 * both before a pane exists. The terminal reports `isFullscreen` from its first drawing (measured on
 * 2.1.276, both layouts).
 */
export const hintAt = (columns: number, isFullscreen = true): RenderInput<'PromptHint', 'terminal'> => ({
  component: 'PromptHint',
  surface: 'terminal',
  requestId: 'hint',
  viewport: { columns, rows: 40, isFullscreen },
  props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
});
