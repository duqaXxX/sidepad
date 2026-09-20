import PageLayout from '../../page-layout';
import { formattedViewOf, markdownPageOf } from '../select';
import type { PaneState } from '../types';

/**
 * A press started on a formatted Markdown row: the bar is hidden, the selection before it kept.
 *
 * @param row the page row the press went down on
 * @returns the same object when the page is not formatted Markdown
 */
export function withBlockPress(state: PaneState, row: number): PaneState {
  const view = formattedViewOf(state);
  const page = markdownPageOf(state);

  if (!view || !page || view.blocks.length === 0) {
    return state;
  }

  const index = PageLayout.blockAtRow(page, row);

  return {
    ...state,
    selection: null,
    press: { before: state.selection?.range ?? null, blocks: { anchor: index, head: index } },
  };
}
