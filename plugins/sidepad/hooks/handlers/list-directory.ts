import type Host from '../host';
import Names from '../names';
import type PaneState from '../pane-state';

/**
 * A directory's entries for its page.
 *
 * @returns the entries, or none and a note carrying the engine's reason when the listing failed
 */
export const listDirectory = (host: Host.Host, path: string): Promise<PaneState.DirectoryListing> =>
  host.list(path).then(
    (entries) => ({ entries, failure: null }),
    // The note is one row: a reason spanning lines keeps its first.
    (error: unknown) => ({
      entries: [],
      failure: Names.listFailedNoteOf(String(error instanceof Error ? error.message : error).split('\n')[0]!),
    }),
  );
