import PageLayout from '../page-layout';
import PaneState from '../pane-state';

const countOf = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The status line's two texts: on the left a Markdown file's mode, on the right where the page is,
 * as the source lines it shows (a formatted page by its whole blocks) or the rows a list holds.
 *
 * @returns the texts, empty where there is nothing to say
 */
export function statusOf(state: PaneState.PaneState): { left: string; right: string } {
  const page = state.page;
  const file = state.file;

  if (page.kind === 'directory') {
    return { left: '', right: countOf(PaneState.pageRowsOf(state).length, 'entry', 'entries') };
  }

  if (page.kind === 'edited') {
    return { left: '', right: countOf(PaneState.pageRowsOf(state).length, 'file', 'files') };
  }

  if (!file || file.loaded.note !== null) {
    return { left: '', right: '' };
  }

  const left = file.markdown ? (file.markdown.mode === 'formatted' ? 'Formatted' : 'Source') : '';
  const total = file.loaded.total;

  if (total === 0) {
    return { left, right: '' };
  }

  const view = PaneState.formattedViewOf(state);
  const laid = PaneState.formattedPageOf(state);

  if (view && laid) {
    const shown = PaneState.shownLinesOf(state);
    const first = view.blocks[PageLayout.blockAtRow(laid, view.top)]?.start ?? 1;
    const last = view.blocks[PageLayout.blockAtRow(laid, view.top + shown - 1)]?.end ?? total;

    return { left, right: `lines ${first}–${last} of ${total}` };
  }

  const first = Math.min(total, file.top + 1);
  const last = Math.min(total, file.top + PaneState.shownLinesOf(state));

  return { left, right: `lines ${first}–${last} of ${total}` };
}
