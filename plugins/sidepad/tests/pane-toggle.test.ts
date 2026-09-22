import { describe, expect, test, tier } from 'claude-code/testing';

import PaneToggle from '../hooks/pane-toggle';

tier('user');

describe('pane-toggle', () => {
  test('a drawn pane closes, whatever the width', () => {
    expect(PaneToggle.paneToggleOf({ isOpen: true, isPlaced: true, columns: 40 })).toBe('close');
  });

  test('a pane waiting undrawn opens, so the engine draws it', () => {
    expect(PaneToggle.paneToggleOf({ isOpen: true, isPlaced: false, columns: 120 })).toBe('open');
    expect(PaneToggle.paneToggleOf({ isOpen: true, isPlaced: false, columns: 109 })).toBe('too-narrow');
  });

  test('a wide enough terminal opens, a narrower one says so', () => {
    expect(PaneToggle.paneToggleOf({ isOpen: false, isPlaced: false, columns: 110 })).toBe('open');
    expect(PaneToggle.paneToggleOf({ isOpen: false, isPlaced: false, columns: 109 })).toBe('too-narrow');
  });

  test('a width nobody has reported yet opens, and the first drawing settles it', () => {
    expect(PaneToggle.paneToggleOf({ isOpen: false, isPlaced: false, columns: null })).toBe('open');
  });
});
