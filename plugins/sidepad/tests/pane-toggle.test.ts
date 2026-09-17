import { describe, expect, test, tier } from 'claude-code/testing';

import PaneToggle from '../hooks/pane-toggle';

tier('user');

describe('pane-toggle', () => {
  test('an open pane closes, whatever the width', () => {
    expect(PaneToggle.paneToggleOf({ isOpen: true, columns: 40 })).toBe('close');
  });

  test('a wide enough terminal opens, a narrower one says so', () => {
    expect(PaneToggle.paneToggleOf({ isOpen: false, columns: 110 })).toBe('open');
    expect(PaneToggle.paneToggleOf({ isOpen: false, columns: 109 })).toBe('too-narrow');
  });

  test('a width nobody has reported yet opens, and the first drawing settles it', () => {
    expect(PaneToggle.paneToggleOf({ isOpen: false, columns: null })).toBe('open');
  });
});
