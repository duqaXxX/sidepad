import type { FsStat } from 'claude-code';

import { fileKindOf } from './file-kind-of';
import type { LoadedFile } from './loaded-file';

/**
 * A file past the engine's read cap, held one window at a time: nothing read yet, the line count
 * from counting them.
 *
 * LIMIT: its Markdown is never formatted, since cutting a document into blocks needs all of it, and
 * a click selects a block only within the window held.
 *
 * @returns the loaded file, its window empty
 */
export const windowedFileOf = (path: string, stat: FsStat, total: number): LoadedFile => ({
  path,
  kind: fileKindOf(path),
  source: 'windowed',
  lines: [],
  from: 0,
  total,
  note: null,
  stamp: { size: stat.size, mtimeMs: stat.mtimeMs },
});
