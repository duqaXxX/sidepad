import { describe, expect, test, tier } from 'claude-code/testing';

import Listing from '../hooks/listing';
import { CWD } from './fixtures';

tier('user');

describe('listing', () => {
  test('directories first, then the rest, each by name, hidden entries included', () => {
    const rows = Listing.listingRowsOf(`${CWD}/docs`, [
      { name: 'zeta.md', kind: 'file' },
      { name: 'src', kind: 'dir' },
      { name: '.hidden', kind: 'file' },
      { name: 'alpha.md', kind: 'file' },
    ]);

    expect(rows.map((row) => row.name)).toEqual(['src', '.hidden', 'alpha.md', 'zeta.md']);
    expect(rows[0]?.path).toBe(`${CWD}/docs/src`);
  });

  test('labels mark the row the person came from, end directories with /, and fit their width', () => {
    const file = { kind: 'file' as const, path: `${CWD}/a-very-long-file-name.ts`, name: 'a-very-long-file-name.ts' };
    const label = Listing.listingLabelOf(file, true, 12);

    expect(label).toBe('● a-very-lo…');
    expect(Listing.listingLabelOf({ kind: 'dir', path: `${CWD}/src`, name: 'src' }, false, 80)).toBe('  src/');
  });
});
