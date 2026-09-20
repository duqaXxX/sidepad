import { describe, expect, test, tier } from 'claude-code/testing';

import Files from '../hooks/files';
import PageLayout from '../hooks/page-layout';
import PaneState from '../hooks/pane-state';
import { CWD, SAMPLE_MARKDOWN, SAMPLE_TYPESCRIPT, stateOf } from './fixtures';

tier('user');

const CODE = `${CWD}/src/report.ts`;
const NOTES = `${CWD}/docs/notes.md`;
const LONG = Array.from({ length: 100 }, (_, at) => (at % 10 === 4 ? '' : `line ${at + 1}`)).join('\n');

describe('pane-state', () => {
  test('a file opens at its top, or a few lines above the line jumped to', () => {
    const state = stateOf({ path: CODE, text: LONG, rows: 12 });
    const stat = { kind: 'file' as const, size: LONG.length, mtimeMs: 1, isLink: false };

    expect(state.file?.top).toBe(0);
    expect(PaneState.withFile(state, Files.loadedFileOf(CODE, stat, LONG), 50).file?.top).toBe(46);
    expect(PaneState.withFile(state, Files.loadedFileOf(CODE, stat, LONG), 100).file?.top, 'clamped').toBe(91);
  });

  test('a scroll moves lines, three a wheel tick, and stays inside the file', () => {
    const state = stateOf({ path: CODE, text: LONG, rows: 12 });
    const wheeled = PaneState.scrolledBy(state, { by: 2, isWheel: true });

    expect(wheeled.file?.top).toBe(6);
    expect(PaneState.scrolledBy(wheeled, { by: -1, isWheel: false }).file?.top).toBe(5);
    expect(PaneState.scrolledBy(state, { by: -1, isWheel: true }), 'nothing moved: same object').toBe(state);
  });

  test('a scroll key moves a page by the lines it shows, a list by the rows it shows', () => {
    const state = stateOf({ path: CODE, text: LONG, rows: 12 });
    const shown = PaneState.shownLinesOf(state);
    const paged = PaneState.pagedBy(state, 1);
    const entries = Array.from({ length: 40 }, (_, at) => ({
      name: `f${at}`,
      kind: 'file' as const,
      size: 0,
      isLink: false,
    }));
    const listed = PaneState.withDirectory(stateOf({ rows: 12 }), `${CWD}/src`, { entries, failure: null }, '', null);
    const listPaged = PaneState.pagedBy(listed, 1);

    expect(paged.file?.top, 'no line goes by unseen').toBe(shown);
    expect(PaneState.pagedBy(paged, -1).file?.top).toBe(0);
    expect(listPaged.page.kind === 'directory' && listPaged.page.top).toBe(PaneState.listRowsShownOf(listed));
    expect(PaneState.pagedBy(state, -1), 'at the top: same object').toBe(state);
  });

  test('a drag settles a selection revealed above the bar', () => {
    const state = stateOf({ path: CODE, text: LONG, rows: 12, columns: 89 });
    const selected = PaneState.withDraggedLines(PaneState.withPress(state), { start: 8, end: 10 }, 10);

    expect(selected.selection).toEqual({ range: { start: 8, end: 10 }, head: 10, isAsking: false });
    // 9 page rows, 2 under the bar: line 10 must sit on the 7th row.
    expect(selected.file?.top).toBe(3);
  });

  test('a click selects the code block under it; a second click on it clears it', () => {
    const state = stateOf({ path: CODE, text: SAMPLE_TYPESCRIPT, rows: 30 });
    const clicked = PaneState.withClick(PaneState.withPress(state), 3);
    const again = PaneState.withClick(PaneState.withPress(clicked), 3);

    expect(clicked.selection?.range).toEqual({ start: 3, end: 10 });
    expect(again.selection).toBeNull();
    expect(again.epoch).toBeTruthy();
  });

  test('a click on Markdown source selects its Markdown block', () => {
    const state = PaneState.withMarkdownMode(stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 30 }));

    expect(state.file?.markdown).toMatchObject({ kind: 'markdown', mode: 'source' });
    expect(PaneState.withClick(PaneState.withPress(state), 7).selection?.range).toEqual({ start: 6, end: 8 });
  });

  test('a formatted drag from one row to another selects both blocks source lines; a click toggles', () => {
    // SAMPLE_MARKDOWN laid out at 79 columns: the heading on row 0, the paragraph on row 2, the
    // table on rows 4 to 8, the list on 10 and 11, the fence on 13 to 15.
    const state = stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 30 });
    const dragged = PaneState.withBlockDrag(PaneState.withBlockPress(state, 0), 0, 7, true);
    const clicked = PaneState.withBlockDrag(PaneState.withBlockPress(dragged, 2), 2, 2, true);
    const toggled = PaneState.withBlockDrag(PaneState.withBlockPress(clicked, 2), 2, 2, true);

    expect(dragged.selection?.range, 'the heading through the table').toEqual({ start: 1, end: 8 });
    expect(clicked.selection?.range, 'the paragraph alone').toEqual({ start: 3, end: 4 });
    expect(toggled.selection).toBeNull();
  });

  test('a formatted page scrolls by rows: three a wheel tick, a page key the rows it shows', () => {
    const state = stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 8 });
    const shown = PaneState.shownLinesOf(state);
    const wheeled = PaneState.scrolledBy(state, { by: 1, isWheel: true });

    expect(state.file?.markdown?.top).toBe(0);
    expect(wheeled.file?.markdown?.top).toBe(3);
    expect(PaneState.pagedBy(state, 1).file?.markdown?.top, 'no row goes by unseen').toBe(shown);
    expect(PaneState.scrolledBy(state, { by: -1, isWheel: true }), 'at the top: same object').toBe(state);
  });

  test('a click whose press never arrived still toggles the block it lands on', () => {
    // `surface.post` delivers one message per frame and a later post replaces an undelivered one,
    // so a press and the release right after it reach the hooks as the release alone. The selection
    // still standing is then what the press would have kept.
    const state = stateOf({ path: CODE, text: SAMPLE_TYPESCRIPT, rows: 30 });
    const clicked = PaneState.withClick(PaneState.withPress(state), 3);
    const toggled = PaneState.withClick(clicked, 3);

    expect(clicked.selection?.range).toEqual({ start: 3, end: 10 });
    expect(toggled.selection, 'the press message was dropped, the click still clears').toBeNull();
  });

  test('a formatted release whose press never arrived carries the rows the press went down on', () => {
    // The Client holds the pointer from the press to the release and posts both rows every time, so
    // a `block-down` replaced before the engine delivered it costs the gesture nothing.
    const state = stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 30 });
    const pressed = PaneState.withBlockDrag(state, 2, 2, true);
    const dropped = PaneState.withBlockDrag(pressed, 2, 2, true);

    expect(pressed.selection?.range).toEqual({ start: 3, end: 4 });
    expect(dropped.selection, 'a click on the selected block clears it, press message or not').toBeNull();
  });

  test('a file opened before any drawing places its jump without laying the page out', () => {
    // Nothing has reported a width yet, so the page is the cheap one row a block: a real layout
    // here would wrap the file at one column and the first drawing would throw it away.
    const unlaid = PaneState.afterOpened(PaneState.initialStateOf(CWD));
    const stat = { kind: 'file' as const, size: SAMPLE_MARKDOWN.length, mtimeMs: 1, isLink: false };
    const opened = PaneState.withFile(unlaid, Files.loadedFileOf(NOTES, stat, SAMPLE_MARKDOWN), 14);
    const page = PaneState.markdownPageOf(opened);
    const top = opened.file?.markdown?.top ?? -1;

    expect(page?.rows, 'five blocks, a blank row between each pair').toBe(9);
    expect(top, 'line 14 is in the fence, block 4 of five').toBe(8);
    expect(page && PageLayout.blockAtRow(page, top), 'and the row reads back as that block').toBe(4);
  });

  test('a formatted page keeps its first row through Source and back, and while Source scrolls', () => {
    // The page's rows do not depend on the mode, so clamping it against a page of none while Source
    // shows used to send the reader back to the top of the file.
    const scrolled = PaneState.scrolledBy(stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 8 }), {
      by: 3,
      isWheel: false,
    });
    const source = PaneState.withMarkdownMode(scrolled);
    const paged = PaneState.scrolledBy(source, { by: 2, isWheel: false });

    expect(scrolled.file?.markdown?.top).toBe(3);
    expect(source.file?.markdown?.top, 'Source leaves the formatted page where it was').toBe(3);
    expect(paged.file?.markdown?.top, 'and scrolling the source page does not move it').toBe(3);
    expect(PaneState.withMarkdownMode(paged).file?.markdown?.top, 'Formatted lands where it was left').toBe(3);
  });

  test('a press on a page showing Markdown source is not taken', () => {
    const source = PaneState.withMarkdownMode(stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 30 }));

    expect(PaneState.withBlockPress(source, 0), 'nothing to press').toBe(source);
    expect(PaneState.withBlockDrag(source, 0, 3, true), 'and nothing to drag').toBe(source);
  });

  test('an edit of the selected file records that it cleared the selection; the list keeps one entry a file', () => {
    const selected = PaneState.withDraggedLines(stateOf({ path: CODE, text: LONG }), { start: 2, end: 3 }, 3);
    const first = PaneState.withEditRecorded(selected, { path: CODE, changedLine: 5 });
    const second = PaneState.withEditRecorded(first, { path: NOTES, changedLine: 1 });
    const third = PaneState.withEditRecorded(second, { path: CODE, changedLine: 9 });

    expect(third.edited.paths).toEqual([CODE, NOTES]);
    expect(third.turn.clearedOn).toEqual([CODE]);
    expect(third.turn.latestBefore).toBeNull();
    expect(third.turn.edits).toHaveLength(3);
  });

  test('the turn end follows, marks or opens, and forgets the turn', () => {
    const open = PaneState.withEditRecorded(stateOf({ path: CODE, text: LONG }), { path: NOTES, changedLine: 1 });
    const marked = PaneState.afterTurn(open, true);

    expect(marked.action).toEqual({ kind: 'mark' });
    expect(marked.state.edited.hasUnseen).toBe(true);
    expect(marked.state.turn.edits).toEqual([]);

    const closed = PaneState.afterClose(open, 'person');

    expect(PaneState.afterTurn(closed, true).action, 'closed by the person').toEqual({ kind: 'stay' });
  });

  test('a directory page centres on the row it came from and lists hidden entries', () => {
    const entries = Array.from({ length: 40 }, (_, at) => ({
      name: `f${String(at).padStart(2, '0')}`,
      kind: 'file' as const,
      size: 0,
      isLink: false,
    }));
    const state = PaneState.withDirectory(
      stateOf({ rows: 12 }),
      `${CWD}/src`,
      { entries, failure: null },
      `${CWD}/src/f30`,
      null,
    );

    expect(state.page.kind === 'directory' && state.page.top).toBe(26);
  });

  test('a width change reveals the selection again; a height change alone does not', () => {
    const selected = PaneState.withDraggedLines(
      stateOf({ path: CODE, text: LONG, rows: 15, columns: 89 }),
      { start: 9, end: 10 },
      10,
    );
    const narrowed = PaneState.laidOut(selected, { rows: 15, columns: 30 });

    expect(selected.file?.top).toBe(0);
    expect(narrowed.file?.top).toBe(2);
  });

  test('/clear forgets the edits, the selection and a person close; keeps the page', () => {
    const edited = PaneState.withEditRecorded(stateOf({ path: CODE, text: LONG }), { path: CODE, changedLine: 1 });
    const reset = PaneState.afterNewSession(PaneState.afterClose(edited, 'person'));

    expect(reset).toMatchObject({
      isOpen: false,
      isClosedByPerson: false,
      edited: { paths: [] },
      page: { kind: 'file' },
    });
  });
});
