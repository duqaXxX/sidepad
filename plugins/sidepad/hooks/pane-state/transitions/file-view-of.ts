import type Files from '../../files';
import MarkdownBlocks from '../../markdown-blocks';
import TablePage from '../../table-page';
import type { MarkdownView, PaneState } from '../types';

/**
 * The Markdown mode a file just opened takes: the one the last Markdown file was shown in.
 *
 * @returns `formatted` when no Markdown file was open
 */
export const markdownModeOf = (state: PaneState): 'formatted' | 'source' =>
  state.file?.markdown?.kind === 'markdown' ? state.file.markdown.mode : 'formatted';

/**
 * How a file the pane read is drawn as a page of composed rows: a Markdown file by its blocks, a
 * `.csv` or `.tsv` as its table. Every other file, and one held a window at a time, has none and
 * draws as code.
 *
 * @param loaded the file the pane read
 * @param mode the Markdown mode to open in
 * @returns the view at the page's first row, or null when the file has no composed page
 */
export function fileViewOf(loaded: Files.LoadedFile, mode: 'formatted' | 'source'): MarkdownView | null {
  if (loaded.kind === 'markdown' && loaded.note === null && loaded.source === 'whole') {
    return { kind: 'markdown', mode, blocks: MarkdownBlocks.markdownBlocksOf(loaded.lines), top: 0 };
  }

  const table = TablePage.tableViewOf(loaded);

  return table === null ? null : { kind: 'table', table: table.table, blocks: table.records, top: 0 };
}
