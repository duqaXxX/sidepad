import PageLayout from '../../page-layout';
import { markdownPageOf } from '../select';
import type { PaneLayout, PaneState } from '../types';
import { clamped } from './clamped';
import { revealed } from './revealed';

/**
 * The composed page kept where the reader was after a width change: a row is a width's own, so the
 * row shown is read as the block drawn on it and taken back to that block's first row at the new
 * width. A block index is what the two layouts share.
 *
 * It runs whichever page is drawn, since the formatted page's first row is kept while `Source`
 * shows, and a resize would otherwise leave it naming another block.
 *
 * @returns `after`, with the page's first row read again when the two widths disagree
 */
function keptOnItsBlock(before: PaneState, after: PaneState): PaneState {
  const file = after.file;
  const view = file?.markdown;
  const was = markdownPageOf(before);
  const now = markdownPageOf(after);

  if (!file || !view || !was || !now) {
    return after;
  }

  const top = now.blocks[PageLayout.blockAtRow(was, view.top)]?.firstRow ?? 0;

  return top === view.top ? after : { ...after, file: { ...file, markdown: { ...view, top } } };
}

/**
 * The state for a drawing's body size: windows kept inside it, and on a new width the Markdown
 * page's first row read again and a selection revealed again, since the bar may take more or fewer
 * rows. A height change alone moves nothing.
 *
 * @returns the same object when the size is the same
 */
export function laidOut(state: PaneState, layout: PaneLayout): PaneState {
  if (layout.rows === state.layout.rows && layout.columns === state.layout.columns) {
    return state;
  }

  if (layout.columns === state.layout.columns) {
    return clamped({ ...state, layout });
  }

  return revealed(clamped(keptOnItsBlock(state, { ...state, layout })));
}
