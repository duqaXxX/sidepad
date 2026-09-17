import { describe, expect, test, tier } from 'claude-code/testing';

import Files from '../hooks/files';
import PaneState from '../hooks/pane-state';
import { CWD, SAMPLE_MARKDOWN, SAMPLE_TYPESCRIPT, stateOf } from './fixtures';

tier('user');

const CODE = `${CWD}/src/report.ts`;
const NOTES = `${CWD}/docs/notes.md`;
const LONG = Array.from({ length: 100 }, (_, at) => (at % 10 === 4 ? '' : `line ${at + 1}`)).join('\n');

describe('pane-state', () => {
  test('a file opens at its top, or a few lines above the line jumped to', () => {
    const state = stateOf({ path: CODE, text: LONG, rows: 12 });
    const stat = { kind: 'file' as const, size: LONG.length, mtimeMs: 1 };

    expect(state.file?.top).toBe(0);
    expect(PaneState.withFile(state, Files.loadedFileOf(CODE, stat, LONG), 50).file?.top).toBe(46);
    expect(PaneState.withFile(state, Files.loadedFileOf(CODE, stat, LONG), 100).file?.top, 'clamped').toBe(90);
  });

  test('a scroll moves lines, three a wheel tick, and stays inside the file', () => {
    const state = stateOf({ path: CODE, text: LONG, rows: 12 });
    const wheeled = PaneState.scrolledBy(state, { by: 2, isWheel: true });

    expect(wheeled.file?.top).toBe(6);
    expect(PaneState.scrolledBy(wheeled, { by: -1, isWheel: false }).file?.top).toBe(5);
    expect(PaneState.scrolledBy(state, { by: -1, isWheel: true }), 'nothing moved: same object').toBe(state);
  });

  test('a drag settles a selection revealed above the bar', () => {
    const state = stateOf({ path: CODE, text: LONG, rows: 12, columns: 89 });
    const selected = PaneState.withDraggedLines(PaneState.withPress(state), { start: 8, end: 10 }, 10);

    expect(selected.selection).toEqual({ range: { start: 8, end: 10 }, head: 10, isAsking: false });
    // 10 page rows, 2 under the bar: line 10 must sit on the 8th row.
    expect(selected.file?.top).toBe(2);
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

    expect(state.file?.markdown?.mode).toBe('source');
    expect(PaneState.withClick(PaneState.withPress(state), 7).selection?.range).toEqual({ start: 6, end: 8 });
  });

  test('a formatted drag from one block to another selects their source lines; a click toggles', () => {
    let state = stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 30 });

    for (const [index, rows] of [
      [0, 1],
      [1, 2],
      [2, 7],
      [3, 2],
      [4, 5],
    ] as const) {
      state = PaneState.withBlockRows(state, index, rows);
    }

    const dragged = PaneState.withBlockDrag(PaneState.withBlockPress(state, 0), 2, 3, true);
    const clicked = PaneState.withBlockDrag(PaneState.withBlockPress(dragged, 1), 1, 0, true);
    const toggled = PaneState.withBlockDrag(PaneState.withBlockPress(clicked, 1), 1, 0, true);

    expect(dragged.selection?.range).toEqual({ start: 1, end: 8 });
    expect(clicked.selection?.range).toEqual({ start: 3, end: 4 });
    expect(toggled.selection).toBeNull();
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

  test('a formatted drag whose press never arrived starts on the block reporting it', () => {
    // The Client the press went down on holds the pointer until the release, so a move names the
    // block the drag started on even when `block-down` was the message that got replaced.
    let state = stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 30 });

    for (const [index, rows] of [
      [0, 1],
      [1, 2],
      [2, 7],
      [3, 2],
      [4, 5],
    ] as const) {
      state = PaneState.withBlockRows(state, index, rows);
    }

    const pressed = PaneState.withBlockDrag(PaneState.withBlockPress(state, 1), 1, 0, true);
    const dropped = PaneState.withBlockDrag(pressed, 1, 0, true);

    expect(pressed.selection?.range).toEqual({ start: 3, end: 4 });
    expect(dropped.selection, 'a click on the selected block clears it, press message or not').toBeNull();
  });

  test('a press from an instance the view no longer holds is not taken', () => {
    // A Client can outlive the blocks it was drawn for (the file was written while it was held),
    // and a press kept under an index past them would be read as a block on the release.
    const state = stateOf({ path: NOTES, text: SAMPLE_MARKDOWN, rows: 30 });
    const pressed = PaneState.withBlockPress(state, 99);

    expect(pressed, 'nothing to press').toBe(state);
    expect(PaneState.withBlockDrag(state, 99, 0, true), 'and nothing to drag').toBe(state);
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
    }));
    const state = PaneState.withDirectory(stateOf({ rows: 12 }), `${CWD}/src`, entries, `${CWD}/src/f30`, null);

    expect(state.page.kind === 'directory' && state.page.top).toBe(25);
  });

  test('a width change reveals the selection again; a height change alone does not', () => {
    const selected = PaneState.withDraggedLines(
      stateOf({ path: CODE, text: LONG, rows: 14, columns: 89 }),
      { start: 9, end: 10 },
      10,
    );
    const narrowed = PaneState.laidOut(selected, { rows: 14, columns: 30 });

    expect(selected.file?.top).toBe(0);
    expect(narrowed.file?.top).toBe(2);
  });

  test('the layout from a placement: an inline first drawing closes and settles the main screen', () => {
    const unchecked = PaneState.afterOpened(PaneState.initialStateOf(CWD), true);
    const inline = PaneState.afterPlacement(unchecked, 'inline');
    const dock = PaneState.afterPlacement(unchecked, 'dock');

    expect(inline.shouldClose).toBe(true);
    expect(inline.state.screen).toBe('main');
    expect(dock).toMatchObject({ shouldClose: false, state: { screen: 'fullscreen' } });
    expect(PaneState.afterPlacement(inline.state, 'inline').shouldClose, 'checked once').toBe(false);
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
