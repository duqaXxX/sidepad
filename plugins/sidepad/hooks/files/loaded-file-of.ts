import type { FsStat } from 'claude-code';

import Images from '../images';
import Limits from '../limits';
import Names from '../names';
import { fileKindOf } from './file-kind-of';
import { isBinaryText } from './is-binary-text';
import type { LoadedFile } from './loaded-file';
import { NO_IMAGES, type PageImage } from './page-image';

/**
 * A file as the page shows it, from its stat and, when it was read whole, its text: the lines split
 * on `\n` without altering them (a trailing newline ends the last line, it opens none), or a note.
 *
 * LIMIT: the `\r` of a CRLF file stays at its line's end.
 *
 * @param path the file's absolute path
 * @param stat the stat, null when it failed
 * @param text the text, null when not read or the read failed
 * @param images the PNGs the file's own blocks name, for a Markdown file that names any
 * @returns the loaded file
 */
export function loadedFileOf(
  path: string,
  stat: FsStat | null,
  text: string | null,
  images: Readonly<Record<string, PageImage>> = NO_IMAGES,
): LoadedFile {
  const base = {
    path,
    kind: fileKindOf(path),
    source: 'whole' as const,
    lines: [],
    from: 0,
    total: 0,
    image: null,
    images,
    stamp: stat && { size: stat.size, mtimeMs: stat.mtimeMs },
  };

  if (stat === null || stat.kind !== 'file') {
    return { ...base, note: Names.READ_FAILED_NOTE };
  }

  if (stat.size > Limits.READ_MAX_BYTES) {
    return { ...base, note: Names.tooLargeNoteOf(stat.size) };
  }

  // A JPEG, a GIF or a WebP: an Image takes a whole PNG or raw pixels, and nothing decodes the rest.
  if (Images.imageKindOf(path) === 'other') {
    return { ...base, note: Names.IMAGE_FORMAT_NOTE };
  }

  if (text === null) {
    return { ...base, note: Names.READ_FAILED_NOTE };
  }

  if (isBinaryText(text)) {
    return { ...base, note: Names.BINARY_NOTE };
  }

  const lines = (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n');

  return { ...base, lines, total: lines.length, note: null };
}
