import type { FsStat } from 'claude-code';

import Limits from '../limits';
import Names from '../names';
import type { LoadedFile } from './loaded-file';
import { NO_IMAGES } from './page-image';

/**
 * A PNG as the page shows it: no lines and no text, the picture drawn from the file's own path by
 * the terminal. A file the pane could not size shows a note in its place.
 *
 * @param path the file's absolute path
 * @param stat the stat, null when it failed
 * @param size the pixel size read from the file's header, null when it is not a readable PNG
 * @returns the loaded file
 */
export function imageFileOf(
  path: string,
  stat: FsStat | null,
  size: { width: number; height: number } | null,
): LoadedFile {
  const base = {
    path,
    kind: 'image' as const,
    source: 'whole' as const,
    lines: [],
    from: 0,
    total: 0,
    image: null,
    images: NO_IMAGES,
    stamp: stat && { size: stat.size, mtimeMs: stat.mtimeMs },
  };

  if (stat === null || stat.kind !== 'file') {
    return { ...base, note: Names.READ_FAILED_NOTE };
  }

  if (stat.size > Limits.READ_MAX_BYTES) {
    return { ...base, note: Names.tooLargeNoteOf(stat.size) };
  }

  if (size === null) {
    return { ...base, note: Names.BINARY_NOTE };
  }

  return { ...base, image: { path, ...size }, note: null };
}
