import type { FsStat } from 'claude-code';

import Limits from '../limits';

/**
 * Whether the pane reads a file's text after its stat: a regular file within the size cap.
 *
 * @returns true when `$.fs.read` should run
 */
export const shouldRead = (stat: FsStat | null) =>
  stat !== null && stat.kind === 'file' && stat.size <= Limits.READ_MAX_BYTES;
