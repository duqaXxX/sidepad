import type { FsEntry } from 'claude-code';

import type { ListingRow } from './listing-row';

/**
 * A directory page's rows: directories, then everything else, each group by name, hidden entries
 * included. The way up is the top row's `..`, never a row.
 *
 * @param dir the directory shown, without a trailing slash
 * @param entries its listing
 * @returns the rows, top to bottom
 */
export function listingRowsOf(dir: string, entries: readonly Pick<FsEntry, 'name' | 'kind'>[]): ListingRow[] {
  const sorted = [...entries].sort((a, b) =>
    (a.kind === 'dir') === (b.kind === 'dir') ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1,
  );

  return sorted.map((entry) => ({
    kind: entry.kind,
    path: `${dir === '/' ? '' : dir}/${entry.name}`,
    name: entry.name,
  }));
}
