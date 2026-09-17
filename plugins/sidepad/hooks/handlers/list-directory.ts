import type { FsEntry } from 'claude-code';

import type Host from '../host';

/**
 * A directory's entries for its page.
 *
 * @returns the entries, none when the listing failed
 */
export const listDirectory = (host: Host.Host, path: string): Promise<readonly FsEntry[]> =>
  host.list(path).catch(() => []);
