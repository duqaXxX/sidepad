import type Files from '../../files';
import MarkdownBlocks from '../../markdown-blocks';
import TablePage from '../../table-page';
import type { PageView, PaneState } from '../types';

/**
 * The mode a file just opened is shown in: the one the last file with two pages was shown in, so a
 * reader who asked for `Source` keeps it from one file to the next.
 *
 * @returns `formatted` when no such file was open
 */
export const pageModeOf = (state: PaneState): 'formatted' | 'source' => state.file?.view?.mode ?? 'formatted';

/**
 * How a file the pane read is drawn as a page of composed rows: a Markdown file by its blocks, a
 * `.csv` or `.tsv` as its table. Every other file, and one held a window at a time, has none and
 * draws as code.
 *
 * @param loaded the file the pane read
 * @param mode the mode to open in, which `Source` switches
 * @returns the view at the page's first row, or null when the file has no composed page
 */
export function fileViewOf(loaded: Files.LoadedFile, mode: 'formatted' | 'source'): PageView | null {
  if (loaded.kind === 'markdown' && loaded.note === null && loaded.source === 'whole') {
    return { kind: 'markdown', mode, blocks: MarkdownBlocks.markdownBlocksOf(loaded.lines), top: 0 };
  }

  const table = TablePage.tableViewOf(loaded);

  return table === null ? null : { kind: 'table', mode, table: table.table, blocks: table.records, top: 0 };
}
