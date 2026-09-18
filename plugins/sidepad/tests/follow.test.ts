import { describe, expect, test, tier } from 'claude-code/testing';

import Follow from '../hooks/follow';
import { CWD } from './fixtures';

tier('user');

describe('follow', () => {
  const a = `${CWD}/a.md`;
  const b = `${CWD}/b.md`;
  const facts: Follow.FollowFacts = {
    edits: [
      { path: a, changedLine: 4 },
      { path: b, changedLine: 9 },
    ],
    latestBefore: a,
    clearedOn: [],
    isOpen: true,
    isAutoOpenOn: true,
    isClosedByPerson: false,
    screen: 'fullscreen',
    columns: 200,
    shownFile: a,
  };

  test('no edit: stay', () => {
    expect(Follow.followAtTurnEnd({ ...facts, edits: [] })).toEqual({ kind: 'stay' });
  });

  test('closed: open on the last edited file, unless off, closed by the person, or not known to dock', () => {
    const closed = { ...facts, isOpen: false };

    expect(Follow.followAtTurnEnd(closed)).toEqual({ kind: 'open', path: b, line: 9 });
    expect(Follow.followAtTurnEnd({ ...closed, isAutoOpenOn: false })).toEqual({ kind: 'stay' });
    expect(Follow.followAtTurnEnd({ ...closed, isClosedByPerson: true })).toEqual({ kind: 'stay' });
    expect(Follow.followAtTurnEnd({ ...closed, screen: 'main' })).toEqual({ kind: 'stay' });
    expect(Follow.followAtTurnEnd({ ...closed, screen: null }), 'a layout nobody reported opens nothing').toEqual({
      kind: 'stay',
    });
    expect(Follow.followAtTurnEnd({ ...closed, columns: 120 }), 'a pane nobody asked for needs 144').toEqual({
      kind: 'stay',
    });
    expect(Follow.followAtTurnEnd({ ...closed, columns: null }), 'a width nobody reported opens').toEqual({
      kind: 'open',
      path: b,
      line: 9,
    });
  });

  test('on the latest file before the turn, or on its last file: follow', () => {
    expect(Follow.followAtTurnEnd(facts)).toEqual({ kind: 'follow', path: b, line: 9 });
    expect(Follow.followAtTurnEnd({ ...facts, latestBefore: null, shownFile: b })).toEqual({
      kind: 'follow',
      path: b,
      line: 9,
    });
  });

  test('an edit that cleared the selection on the file shown keeps the view', () => {
    expect(Follow.followAtTurnEnd({ ...facts, shownFile: b, clearedOn: [b] })).toEqual({ kind: 'stay' });
  });

  test('reading something else: mark', () => {
    expect(Follow.followAtTurnEnd({ ...facts, shownFile: `${CWD}/other.ts` })).toEqual({ kind: 'mark' });
    expect(Follow.followAtTurnEnd({ ...facts, shownFile: null })).toEqual({ kind: 'mark' });
  });
});
