import Bar from '../bar';
import Limits from '../limits';
import Listing from '../listing';
import MarkdownBlocks from '../markdown-blocks';
import Names from '../names';
import PaneState from '../pane-state';
import Paths from '../paths';
import Tables from '../tables';
import { codeSourceLinesOf } from './code-source-lines-of';
import { navigationOf } from './navigation-of';
import type { PanePlan } from './pane-plan';
import { statusOf } from './status-of';

/**
 * One drawing of the pane, decided: the top row's Buttons and the path in the room they leave; the
 * page as a window of lines for the code Client, a window of blocks each for its own Client, or a
 * window of list rows; the command bar over a selection; and the status line.
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
  const windowRows = PaneState.windowRowsOf(state);
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

      const view = PaneState.formattedViewOf(state);

      if (view) {
        const rowsOf = PaneState.rowsOfBlockIn(view);
        const dragged = state.press?.blocks;
        const low = dragged ? Math.min(dragged.anchor, dragged.head) : -1;
        const high = dragged ? Math.max(dragged.anchor, dragged.head) : -1;
        const shown = MarkdownBlocks.shownBlocksOf(rowsOf, view.blockTop, view.blocks.length, windowRows);

        return {
          kind: 'blocks',
          blocks: shown.map((index) => {
            const block = view.blocks[index]!;
            const isInRange =
              selection !== null && block.start >= selection.range.start && block.end <= selection.range.end;

            // The engine refuses a whole drawing holding a Markdown element past its cap, so a block
            // that long is drawn as a note instead; its source is still selectable under Source.
            const source = file.loaded.lines.slice(block.start - 1, block.end);
            const text = MarkdownBlocks.flowedTextOf(source);
            const isTooLong = text.length > Limits.MAX_ELEMENT_CHARS;
            // The engine sizes a table by a width of its own (#51), so the pane draws its own.
            const table = block.kind === 'table' && !isTooLong ? Tables.tableOf(source) : null;

            return {
              index,
              text: isTooLong || table ? '' : text,
              table: table && Tables.tableRowsOf(table, pageColumns),
              note: isTooLong ? Names.BLOCK_TOO_LONG_NOTE : null,
              isSelected: dragged ? index >= low && index <= high : isInRange,
            };
          }),
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
