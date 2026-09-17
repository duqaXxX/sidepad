import Listing from '../../listing';
import Paths from '../../paths';
import type { PaneState } from '../types';

/**
 * The rows of the list page shown: a directory's entries, or the edited files as the pane names them.
 *
 * @returns the rows, top to bottom; none on the file page
 */
export function pageRowsOf(state: PaneState): Listing.ListingRow[] {
  const page = state.page;

  if (page.kind === 'directory') {
    return Listing.listingRowsOf(page.path, page.entries);
  }

  if (page.kind === 'edited') {
    return state.edited.paths.map((path) => ({ kind: 'file', path, name: Paths.shownPathOf(path, state.cwd) }));
  }

  return [];
}
