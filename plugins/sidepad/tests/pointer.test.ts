import { describe, expect, test, tier } from 'claude-code/testing';

import Pointer from '../hooks/pointer';

tier('user');

describe('pointer', () => {
  const window: Pointer.CodeWindow = { firstLine: 10, lineCount: 20, totalLines: 100, barTop: 18 };
  const down = { type: 'down' as const, x: 3, y: 2, button: 'left' as const };

  test('a press that never leaves its line is a click on that line', () => {
    const pressed = Pointer.codePointerStep(Pointer.NO_DRAG, down, window);
    const released = Pointer.codePointerStep(pressed.drag, { type: 'up', x: 3, y: 2 }, window);

    expect(pressed.post).toEqual({ kind: 'drag-start' });
    expect(released.post).toEqual({ kind: 'click', line: 13 });
  });

  test('a drag over lines posts the range and the line it ended on, in either direction', () => {
    const pressed = Pointer.codePointerStep(Pointer.NO_DRAG, { ...down, y: 6 }, window);
    const moved = Pointer.codePointerStep(pressed.drag, { type: 'move', x: 3, y: 2 }, window);
    const released = Pointer.codePointerStep(moved.drag, { type: 'up', x: 3, y: 2 }, window);

    expect(released.post).toEqual({ kind: 'range', start: 13, end: 17, head: 13 });
  });

  test('a press on the bar rows starts nothing', () => {
    expect(Pointer.codePointerStep(Pointer.NO_DRAG, { ...down, y: 18 }, window)).toEqual({
      drag: Pointer.NO_DRAG,
      post: null,
      edge: null,
    });
  });

  test('past an edge the drag reports it, and each tick grows the selection and scrolls a line', () => {
    const pressed = Pointer.codePointerStep(Pointer.NO_DRAG, down, window);
    const past = Pointer.codePointerStep(pressed.drag, { type: 'move', x: 3, y: 25 }, window);
    const tick = Pointer.edgeTick(past.drag, 1, window);

    expect(past.edge).toBe(1);
    expect(tick.post).toEqual({ kind: 'scroll', by: 1 });
    expect(tick.drag.head).toBe(30);
    expect(Pointer.edgeTick(Pointer.NO_DRAG, 1, window).post, 'no drag, no scroll').toBeNull();
  });

  test('a drag over the formatted page posts the page rows pressed and reached', () => {
    // The Client draws rows 6 to 25 of a page of 40, so its row 2 is the page's row 8.
    const page: Pointer.PageWindow = { firstRow: 6, rowCount: 20, totalRows: 40 };
    const pressed = Pointer.pagePointerStep(Pointer.NO_DRAG, down, page);
    const moved = Pointer.pagePointerStep(pressed.drag, { type: 'move', x: 3, y: 7 }, page);
    const released = Pointer.pagePointerStep(moved.drag, { type: 'up', x: 3, y: 7 }, page);

    expect([pressed.post, moved.post, released.post]).toEqual([
      { kind: 'block-down', row: 8 },
      { kind: 'block-move', anchor: 8, head: 13 },
      { kind: 'block-up', anchor: 8, head: 13 },
    ]);
    expect(Pointer.pagePointerStep(Pointer.NO_DRAG, { type: 'move', x: 3, y: 1 }, page).post).toBeNull();
  });

  test('a press that never leaves its row releases on the row it went down on', () => {
    const page: Pointer.PageWindow = { firstRow: 6, rowCount: 20, totalRows: 40 };
    const pressed = Pointer.pagePointerStep(Pointer.NO_DRAG, down, page);

    expect(Pointer.pagePointerStep(pressed.drag, { type: 'up', x: 3, y: 2 }, page).post).toEqual({
      kind: 'block-up',
      anchor: 8,
      head: 8,
    });
  });

  test('past an edge the page drag reports it, and each tick carries the head one row further', () => {
    const page: Pointer.PageWindow = { firstRow: 6, rowCount: 20, totalRows: 40 };
    const pressed = Pointer.pagePointerStep(Pointer.NO_DRAG, down, page);
    const past = Pointer.pagePointerStep(pressed.drag, { type: 'move', x: 3, y: 25 }, page);
    const tick = Pointer.pageEdgeTick(past.drag, 1, page);

    expect(past.edge, 'the edge is reported, the head left where it was').toBe(1);
    expect(past.post).toBeNull();
    expect(tick.post, 'one row below the last row drawn').toEqual({ kind: 'block-move', anchor: 8, head: 26 });
    expect(Pointer.pageEdgeTick(Pointer.NO_DRAG, 1, page).post, 'no drag, no tick').toBeNull();
  });
});
