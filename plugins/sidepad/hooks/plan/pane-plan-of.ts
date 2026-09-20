import Bar from '../bar';
import Images from '../images';
import Limits from '../limits';
import Listing from '../listing';
import Names from '../names';
import PageLayout from '../page-layout';
import PaneState from '../pane-state';
import Paths from '../paths';
import { codeSourceLinesOf } from './code-source-lines-of';
import { navigationOf } from './navigation-of';
import type { PanePlan } from './pane-plan';
import { selectedRowsOf } from './selected-rows-of';
import { statusOf } from './status-of';

/**
 * One drawing of the pane, decided: the top row's Buttons and the path in the room they leave; the
 * page as a window of lines for the code Client, a window of composed rows for the formatted page,
 * or a window of list rows; the command bar over a selection; and the status line.
 *
 * @param state the state, already laid out for this drawing
 * @param offset the body's scroll offset the drawing reports
 * @returns the plan
 */
export function panePlanOf(state: PaneState.PaneState, offset: number): PanePlan {
  const { columns, rows } = state.layout;
  const pageColumns = PaneState.pageColumnsOf(state);
  const navigation = navigationOf(state);
  const navigationWidth = navigation.reduce(
    (sum, button, at) => sum + [...button.label].length + (at > 0 ? Limits.NAVIGATION_GAP : 0),
    0,
  );
  const room = Math.max(
    1,
    columns - Limits.TOP_ROW_PADDING - Limits.CLOSE_MARK_CLEAR - Limits.NAVIGATION_GAP - navigationWidth,
  );
  const page = state.page;
  const file = state.file;
  const target = page.kind === 'file' ? file?.loaded.path : page.kind === 'directory' ? page.path : undefined;
  const crumbs: Paths.Crumb[] =
    target === undefined ? [{ kind: 'text', label: Names.EDITED_PAGE_TITLE }] : Paths.crumbsOf(target, state.cwd, room);
  const selection = state.selection;
  const layout =
    selection && page.kind === 'file' ? Bar.barLayoutOf(selection.range, selection.isAsking, columns) : null;
  const bar = layout && { top: offset + Math.max(0, rows - Limits.STATUS_ROWS - (1 + layout.length)), layout };
  const status = { top: offset + Math.max(0, rows - Limits.STATUS_ROWS), ...statusOf(state) };

  return { columns, pageColumns, top: { navigation, crumbs }, page: pageOf(), bar, status };

  function pageOf(): PanePlan['page'] {
    if (page.kind === 'file' && file) {
      if (file.loaded.note !== null) {
        return {
          kind: 'list',
          noteRows: PaneState.noteRowsOf(file.loaded.note, PaneState.listColumnsOf(state)),
          rows: [],
        };
      }

      const image = file.loaded.image;

      if (image !== null) {
        // The terminal reads the file itself: a whole PNG inline would pass the tree's character cap.
        const box = Images.imageBoxOf(
          image,
          pageColumns,
          Math.min(Limits.IMAGE_MAX_ROWS, PaneState.shownLinesOf(state)),
        );

        return {
          kind: 'image',
          path: image.path,
          alt: Names.imageAltOf(Paths.nameOf(image.path), image),
          generation: image.generation,
          ...box,
        };
      }

      const view = PaneState.formattedViewOf(state);
      const laid = PaneState.markdownPageOf(state);

      if (view && laid) {
        const shown = PaneState.shownLinesOf(state);

        return {
          kind: 'page',
          segments: PageLayout.pageSegmentsOf(laid, view.top, shown),
          firstRow: view.top,
          rows: shown,
          totalRows: laid.rows,
          range: selectedRowsOf(laid, view.blocks, selection?.range ?? null, state.press?.blocks ?? null),
          epoch: state.epoch,
        };
      }

      // A windowed file holds the window it was read into, so the page draws from there; until a
      // new window lands, the one held keeps showing rather than a blank page.
      const start = Math.max(0, file.top - file.loaded.from);

      return {
        kind: 'code',
        props: {
          path: file.loaded.path,
          lines: codeSourceLinesOf(file.loaded.lines, start, PaneState.shownLinesOf(state), pageColumns),
          firstLine: file.loaded.from + start,
          totalLines: file.loaded.total,
          barTop: bar ? bar.top - offset - Limits.HEADER_ROWS : null,
          range: selection?.range ?? null,
          epoch: state.epoch,
        },
      };
    }

    const listRows = PaneState.pageRowsOf(state);
    const top = page.kind === 'file' ? 0 : page.top;
    const cameFrom = page.kind === 'file' ? '' : page.cameFrom;
    const labelColumns = PaneState.listColumnsOf(state);

    return {
      kind: 'list',
      noteRows: PaneState.pageNoteRowsOf(state),
      rows: listRows.slice(top, top + PaneState.listRowsShownOf(state)).map((row, at) => ({
        key: Names.keyOf('row', top + at),
        label: Listing.listingLabelOf(row, row.path === cameFrom, labelColumns),
        isDim: row.kind !== 'dir',
      })),
    };
  }
}
