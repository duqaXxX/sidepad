import type { MarkdownView, PaneState } from '../types';

/**
 * The view whose page the pane composes row by row: a Markdown file under `Formatted`, a delimited
 * file drawn as its table.
 *
 * @returns the view when the file page shows one composed, else null (the file's own lines draw)
 */
export const formattedViewOf = (state: PaneState): MarkdownView | null =>
  state.page.kind === 'file' && state.file?.markdown?.mode === 'formatted' ? state.file.markdown : null;
