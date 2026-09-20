import type { MarkdownView, PaneState } from '../types';

/**
 * The view the page draws by composed rows.
 *
 * @returns the view when the file page shows a Markdown file formatted or a delimited file as a
 *   table, else null
 */
export function formattedViewOf(state: PaneState): MarkdownView | null {
  const view = state.page.kind === 'file' ? (state.file?.markdown ?? null) : null;

  return view === null || (view.kind === 'markdown' && view.mode !== 'formatted') ? null : view;
}
