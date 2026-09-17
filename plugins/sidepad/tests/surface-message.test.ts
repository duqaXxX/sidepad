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
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'block-up', index: 1, y: 0 })).toEqual({
      kind: 'block-up',
      index: 1,
      y: 0,
    });
  });

  test('a negative index is no block', () => {
    // An index addresses `view.blocks`; a negative one would read past its start.
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'block-down', index: -1 })).toBeNull();
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'block-move', index: -2, y: 0 })).toBeNull();
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'block-rows', index: -1, rows: 3 })).toBeNull();
  });

  test('a payload of another shape, or with a field of the wrong type, is none', () => {
    expect(SurfaceMessage.surfaceMessageOf(null)).toBeNull();
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'click', line: '3' })).toBeNull();
    expect(SurfaceMessage.surfaceMessageOf({ kind: 'unknown' })).toBeNull();
  });
});
