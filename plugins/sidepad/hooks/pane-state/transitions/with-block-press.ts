import { formattedViewOf } from '../select';
import type { PaneState } from '../types';

/**
 * A press started on a formatted Markdown block: the bar is hidden, the selection before it kept.
 *
 * @param index the block the instance draws
 * @returns the same object when that block is not one the page draws now
 */
export function withBlockPress(state: PaneState, index: number): PaneState {
  const view = formattedViewOf(state);

  // An instance can outlive the view it was drawn for, and its index then names no block: the drag
  // that follows reads `press.blocks.anchor` as a block, so a press is taken only when it is one.
  if (!view || index >= view.blocks.length) {
    return state;
  }

  return {
    ...state,
    selection: null,
    press: { before: state.selection?.range ?? null, blocks: { anchor: index, head: index } },
  };
}
