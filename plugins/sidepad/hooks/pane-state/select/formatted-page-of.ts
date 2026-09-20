import PageLayout from '../../page-layout';
import type { PaneState } from '../types';
import { formattedViewOf } from './formatted-view-of';
import { pageColumnsOf } from './page-columns-of';

/**
 * The formatted Markdown page laid out at the width it is drawn in: where every block sits and how
 * many rows the page takes.
 *
 * @returns the page, or null when the file page is not showing Markdown formatted
 */
export function formattedPageOf(state: PaneState): PageLayout.PageLayout | null {
  const view = formattedViewOf(state);
  const lines = state.file?.loaded.lines;

  return view && lines ? PageLayout.pageLayoutOf(view.blocks, lines, pageColumnsOf(state)) : null;
}
