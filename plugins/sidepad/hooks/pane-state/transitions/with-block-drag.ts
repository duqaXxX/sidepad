import LineRange from '../../line-range';
import MarkdownBlocks from '../../markdown-blocks';
import Window from '../../window';
import { formattedViewOf, rowsOfBlockIn, shownLinesOf, windowRowsOf } from '../select';
import type { PaneState } from '../types';

/**
 * The pointer over formatted Markdown while pressed: the row under it names the block the press is
 * over now, a row past the window's edge scrolls a block; on release the blocks between the press
 * and the pointer settle as their source lines, or a click on the block selected before clears it.
 *
 * @param index the block whose Client reported the pointer
 * @param y the pointer's row inside that block
 * @param isRelease whether the pointer was released
 * @returns the same object when the page is not formatted Markdown, or the index names no block
 */
export function withBlockDrag(state: PaneState, index: number, y: number, isRelease: boolean): PaneState {
  const view = formattedViewOf(state);
  const file = state.file;

  if (!view || !file || view.blocks.length === 0 || index >= view.blocks.length) {
    return state;
  }

  // The press that opened the drag can have been dropped: `surface.post` delivers one message per
  // frame, and the poll reporting a block's height competes for that slot. The Client the press
  // went down on holds the pointer until the release, so the index reporting this move names the
  // block the drag started on, and the selection still standing is what the press would have kept.
  const held = state.press?.blocks ?? null;
  const before = held ? (state.press?.before ?? null) : (state.selection?.range ?? null);

  const rowsOf = rowsOfBlockIn(view);
  const count = view.blocks.length;
  const windowRows = windowRowsOf(state);
  const row = MarkdownBlocks.rowOfBlock(rowsOf, view.blockTop, index) + y;
  let blockTop = view.blockTop;
  let head: number;

  if (row < 0) {
    blockTop = Math.max(0, blockTop - 1);
    head = blockTop;
  } else if (row >= windowRows) {
    blockTop = Math.min(count - 1, blockTop + 1);
    head = MarkdownBlocks.blockAtRow(rowsOf, blockTop, count, windowRows - 1);
  } else {
    head = MarkdownBlocks.blockAtRow(rowsOf, blockTop, count, row);
  }

  // The blocks can have been cut again since the press (the file was written while it was held),
  // so the anchor is kept inside the view it is read against.
  const anchor = Math.min(held?.anchor ?? index, count - 1);
  const moved: PaneState = {
    ...state,
    // A press hides the selection it started from, whether its message arrived or not.
    selection: null,
    file: { ...file, markdown: { ...view, blockTop } },
    press: { before, blocks: { anchor, head } },
  };

  if (!isRelease) {
    return moved;
  }

  const range = {
    start: view.blocks[Math.min(anchor, head)]!.start,
    end: view.blocks[Math.max(anchor, head)]!.end,
  };

  if (anchor === head && LineRange.isSameRange(before, range)) {
    return { ...moved, selection: null, press: null, epoch: state.epoch + 1 };
  }

  const selected: PaneState = {
    ...moved,
    selection: { range, head: view.blocks[head]!.end, isAsking: false },
    press: null,
  };
  const revealedTop = Window.revealedBlockTopOf(rowsOf, blockTop, head, shownLinesOf(selected));

  return { ...selected, file: { ...file, markdown: { ...view, blockTop: revealedTop } } };
}
