import LineRange from '../../line-range';
import PageLayout from '../../page-layout';
import Window from '../../window';
import { formattedViewOf, markdownPageOf, shownLinesOf } from '../select';
import type { PaneState } from '../types';

/**
 * The pointer over formatted Markdown while pressed: each row names the block drawn on it, a row
 * past the window's edge brings itself into view; on release the blocks between the two rows settle
 * as their source lines, or a click on the block selected before clears it.
 *
 * @param anchor the page row the press went down on
 * @param head the page row the pointer is over now, which may sit past the window
 * @param isRelease whether the pointer was released
 * @returns the same object when the page is not formatted Markdown
 */
export function withBlockDrag(state: PaneState, anchor: number, head: number, isRelease: boolean): PaneState {
  const view = formattedViewOf(state);
  const page = markdownPageOf(state);
  const file = state.file;

  if (!view || !page || !file || view.blocks.length === 0) {
    return state;
  }

  // The press is read from the state when its own message arrived, and from the selection still
  // standing when it did not: `surface.post` delivers one message per frame, so a press and the
  // release that follows it in the same frame reach the hooks as the release alone.
  const before = state.press?.before ?? state.selection?.range ?? null;
  const shown = shownLinesOf(state);
  const wanted = head < view.top ? head : head >= view.top + shown ? head - shown + 1 : view.top;
  const top = Window.clampedTopOf(wanted, page.rows, shown);
  const from = PageLayout.blockAtRow(page, anchor);
  const to = PageLayout.blockAtRow(page, head);
  const moved: PaneState = {
    ...state,
    // A press hides the selection it started from, whether its message arrived or not.
    selection: null,
    file: { ...file, markdown: { ...view, top } },
    press: { before, blocks: { anchor: from, head: to } },
  };

  if (!isRelease) {
    return moved;
  }

  const range = {
    start: view.blocks[Math.min(from, to)]!.start,
    end: view.blocks[Math.max(from, to)]!.end,
  };

  if (from === to && LineRange.isSameRange(before, range)) {
    return { ...moved, selection: null, press: null, epoch: state.epoch + 1 };
  }

  const selected: PaneState = {
    ...moved,
    selection: { range, head: view.blocks[to]!.end, isAsking: false },
    press: null,
  };
  const placed = page.blocks[to]!;
  const rows = shownLinesOf(selected);
  const revealedTop = Window.clampedTopOf(
    Window.revealedBlockTopOf(top, placed.firstRow, placed.layout.rows, rows),
    page.rows,
    rows,
  );

  return { ...selected, file: { ...file, markdown: { ...view, top: revealedTop } } };
}
