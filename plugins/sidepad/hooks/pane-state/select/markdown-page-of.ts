import type MarkdownBlocks from '../../markdown-blocks';
import PageLayout from '../../page-layout';
import TablePage from '../../table-page';
import type { MarkdownView, PaneState } from '../types';
import { pageColumnsOf } from './page-columns-of';

/**
 * A block list laid out at the width the pane draws in, or the cheap one row a block while no
 * drawing has reported a width: a layout at a guessed width costs what the real one costs and the
 * first drawing replaces it.
 *
 * @returns the page
 */
export const pageOfBlocks = (
  state: PaneState,
  blocks: readonly MarkdownBlocks.MarkdownBlock[],
  lines: readonly string[],
): PageLayout.PageLayout =>
  state.layout.columns > 0
    ? PageLayout.pageLayoutOf(blocks, lines, pageColumnsOf(state), state.file?.loaded.images)
    : PageLayout.unmeasuredPageOf(blocks);

/**
 * The page a view draws at the width the pane reports: a Markdown file's blocks laid out, or the
 * table a delimited file parsed to.
 *
 * @returns the page
 */
export const pageOfView = (state: PaneState, view: MarkdownView, lines: readonly string[]): PageLayout.PageLayout =>
  view.kind === 'table'
    ? state.layout.columns > 0
      ? TablePage.tablePageOf(view.table, view.blocks, pageColumnsOf(state))
      : TablePage.unmeasuredTablePageOf(view.blocks)
    : pageOfBlocks(state, view.blocks, lines);

/**
 * The open file's composed page: where every block sits and how many rows the page takes.
 *
 * For Markdown it does not depend on the mode shown. The formatted page's own first row is a row of
 * this layout whichever page is drawn, so `Source` and back leaves the reader where they were.
 *
 * @returns the page, or null when the open file has none
 */
export function markdownPageOf(state: PaneState): PageLayout.PageLayout | null {
  const view = state.file?.markdown;
  const lines = state.file?.loaded.lines;

  return view && lines ? pageOfView(state, view, lines) : null;
}
