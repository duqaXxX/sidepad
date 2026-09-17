import { describe, expect, test, tier } from 'claude-code/testing';

import Names from '../hooks/names';

tier('user');

describe('names', () => {
  test('keys carry an index or an id back', () => {
    expect(Names.indexOfKey('row', Names.keyOf('row', 14))).toBe(14);
    expect(Names.indexOfKey('row', 'row:x')).toBeNull();
    expect(Names.indexOfKey('crumb', 'row:1')).toBeNull();
    expect(Names.idOfKey('command', Names.keyOf('command', 'find-issues'))).toBe('find-issues');
  });
});
