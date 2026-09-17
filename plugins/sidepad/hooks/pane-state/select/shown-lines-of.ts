import Bar from '../../bar';
import Window from '../../window';
import type { PaneState } from '../types';
import { windowRowsOf } from './window-rows-of';

/**
 * The page rows a file shows above the command bar: the window less the bar's rows when a selection
 * draws it, and never more lines than one `Code` can hold at this width, so the last line of a file
 * of very long lines is still reachable.
 *
 * @returns at least 1
 */
export function shownLinesOf(state: PaneState): number {
  const selection = state.selection;
  const covered = Bar.barRowsOf(selection?.range ?? null, selection?.isAsking ?? false, state.layout.columns);
  const rows = windowRowsOf(state) - covered;

  return Math.max(1, Math.min(rows, Window.drawableRowsOf(state.layout.columns)));
}
