import { describe, expect, test, tier } from 'claude-code/testing';

import Window from '../hooks/window';

tier('user');

describe('window', () => {
  test('a window stays inside what it scrolls', () => {
    expect(Window.clampedTopOf(-3, 100, 10)).toBe(0);
    expect(Window.clampedTopOf(95, 100, 10)).toBe(90);
    expect(Window.clampedTopOf(5, 4, 10)).toBe(0);
  });

  test('a selection below the window scrolls the least that shows all of it', () => {
    expect(Window.revealedTopOf(0, { start: 8, end: 12 }, 12, 10, 100)).toBe(2);
    expect(Window.revealedTopOf(20, { start: 8, end: 12 }, 8, 10, 100)).toBe(7);
    expect(Window.revealedTopOf(5, { start: 8, end: 12 }, 12, 10, 100), 'in view: no scroll').toBe(5);
  });

  test('a selection taller than the window keeps the line the drag ended on in view', () => {
    expect(Window.revealedTopOf(0, { start: 1, end: 40 }, 40, 10, 100)).toBe(30);
  });

  test('a jump keeps context lines above the changed line', () => {
    expect(Window.jumpTopOf(200)).toBe(196);
    expect(Window.jumpTopOf(2)).toBe(0);
  });

  test('a page draws at most the rows one Code holds at its width', () => {
    expect(Window.drawableRowsOf(80)).toBe(113);
    expect(Window.drawableRowsOf(300)).toBe(32);
    expect(Window.drawableRowsOf(20_000), 'always a row').toBe(1);
  });

  test('a block whose last row is hidden scrolls down the least that shows it', () => {
    // Four blocks of three rows, a blank row between them: they start on rows 0, 4, 8 and 12.
    expect(Window.revealedBlockTopOf(0, 12, 3, 10), 'the block ends on row 14').toBe(5);
    expect(Window.revealedBlockTopOf(12, 4, 3, 10), 'above the window: up to its first row').toBe(4);
    expect(Window.revealedBlockTopOf(0, 4, 3, 10), 'already whole in view').toBe(0);
    expect(Window.revealedBlockTopOf(0, 4, 20, 10), 'taller than the window: its first row').toBe(4);
  });
});
