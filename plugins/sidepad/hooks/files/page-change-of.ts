import type { FsStat } from 'claude-code';

import type { FileStamp } from './file-stamp';

/**
 * How a file shown changed on disk since the pane read it.
 *
 * @param stamp what the read saw, null when its stat failed
 * @param stat the stat now, null when it failed
 * @returns `gone` when it is no longer a file, `changed` when its size or modification time moved, else `same`
 */
export function pageChangeOf(stamp: FileStamp | null, stat: FsStat | null): 'gone' | 'changed' | 'same' {
  if (stat === null || stat.kind !== 'file') {
    return 'gone';
  }

  return stamp !== null && stamp.size === stat.size && stamp.mtimeMs === stat.mtimeMs ? 'same' : 'changed';
}
