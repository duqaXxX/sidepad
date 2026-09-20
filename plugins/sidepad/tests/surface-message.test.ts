import { describe, expect, test, tier } from 'claude-code/testing';

import SurfaceMessage from '../hooks/surface-message';

tier('user');

describe('surface-message', () => {
  test('each message the Clients post reads back whole', () => {
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'range', start: 2, end: 4, head: 4 })).toEqual({
      kind: 'range',
      start: 2,
      end: 4,
      head: 4,
    });
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'block-up', anchor: 1, head: 4 })).toEqual({
      kind: 'block-up',
      anchor: 1,
      head: 4,
    });
  });

  test('a negative row is no row of the page', () => {
    // A row addresses the page's rows; a negative one would read past its start.
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'block-down', row: -1 })).toBeNull();
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'block-move', anchor: -2, head: 0 })).toBeNull();
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'block-up', anchor: 0, head: -3 })).toBeNull();
  });

  test('a payload of another shape, or with a field of the wrong type, is none', () => {
    expect(SurfaceMessage.surfaceMessageOf(null)).toBeNull();
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'click', line: '3' })).toBeNull();
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'unknown' })).toBeNull();
  });
});
