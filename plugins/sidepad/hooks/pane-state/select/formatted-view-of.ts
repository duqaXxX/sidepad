import type { MarkdownView, PaneState } from '../types';

/**
 * The Markdown view the page draws by blocks.
 *
 * @returns the view when the file page shows a Markdown file formatted, else null
 */
export const formattedViewOf = (state: PaneState): MarkdownView | null =>
  state.page.kind === 'file' && state.file?.markdown?.mode === 'formatted' ? state.file.markdown : null;
