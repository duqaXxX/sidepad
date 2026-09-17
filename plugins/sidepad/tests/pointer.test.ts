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

  test('a Markdown block posts press, moves and release while held', () => {
    const held = Pointer.blockPointerStep(false, down, 4);
    const moved = Pointer.blockPointerStep(held.isHolding, { type: 'move', x: 0, y: 7 }, 4);
    const released = Pointer.blockPointerStep(moved.isHolding, { type: 'up', x: 0, y: 8 }, 4);

    expect([held.post, moved.post, released.post]).toEqual([
      { kind: 'block-down', index: 4 },
      { kind: 'block-move', index: 4, y: 7 },
      { kind: 'block-up', index: 4, y: 8 },
    ]);
    expect(Pointer.blockPointerStep(false, { type: 'move', x: 0, y: 1 }, 4).post).toBeNull();
  });
});
