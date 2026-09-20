import type MarkdownBlocks from '../../markdown-blocks';
import PageLayout from '../../page-layout';
import type { PaneState } from '../types';
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
    ? PageLayout.pageLayoutOf(blocks, lines, pageColumnsOf(state))
    : PageLayout.unmeasuredPageOf(blocks);

/**
 * The open Markdown file's page: where every block sits and how many rows the page takes.
 *
 * It does not depend on the mode shown. The formatted page's own first row is a row of this layout
 * whichever page is drawn, so `Source` and back leaves the reader where they were.
 *
 * @returns the page, or null when no Markdown file is open
 */
export function markdownPageOf(state: PaneState): PageLayout.PageLayout | null {
  const view = state.file?.markdown;
  const lines = state.file?.loaded.lines;

  return view && lines ? pageOfBlocks(state, view.blocks, lines) : null;
}
