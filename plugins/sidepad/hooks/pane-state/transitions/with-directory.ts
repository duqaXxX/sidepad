import Listing from '../../listing';
import { listRowsShownOf } from '../select';
import type { DirectoryListing, PaneState } from '../types';
import { clamped } from './clamped';
import { withoutSelection } from './without-selection';

/**
 * A directory's page, its window centred on the row it was entered from; the selection is cleared.
 *
 * @param cameFrom the path of the file or directory left behind, `''` for none
 * @param note a dim first row, or null
 * @returns the state
 */
export function withDirectory(
  state: PaneState,
  path: string,
  { entries, failure }: DirectoryListing,
  cameFrom: string,
  note: string | null,
): PaneState {
  const next: PaneState = {
    ...withoutSelection(state),
    page: { kind: 'directory', path, entries, cameFrom, top: 0, note, failure },
  };
  const index = Listing.listingRowsOf(path, entries).findIndex((row) => row.path === cameFrom);
  const top = Math.max(0, index - Math.floor(listRowsShownOf(next) / 2));

  return clamped({ ...next, page: { kind: 'directory', path, entries, cameFrom, top, note, failure } });
}
