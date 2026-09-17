import type { FsStat } from 'claude-code';

import Limits from '../limits';
import Names from '../names';
import { fileKindOf } from './file-kind-of';
import { isBinaryText } from './is-binary-text';
import type { LoadedFile } from './loaded-file';

/**
 * A file as the page shows it, from its stat and, when it was read whole, its text: the lines split
 * on `\n` without altering them (a trailing newline ends the last line, it opens none), or a note.
 *
 * LIMIT: the `\r` of a CRLF file stays at its line's end.
 *
 * @param path the file's absolute path
 * @param stat the stat, null when it failed
 * @param text the text, null when not read or the read failed
 * @returns the loaded file
 */
export function loadedFileOf(path: string, stat: FsStat | null, text: string | null): LoadedFile {
  const base = {
    path,
    kind: fileKindOf(path),
    source: 'whole' as const,
    lines: [],
    from: 0,
    total: 0,
    stamp: stat && { size: stat.size, mtimeMs: stat.mtimeMs },
  };

  if (stat === null || stat.kind !== 'file') {
    return { ...base, note: Names.READ_FAILED_NOTE };
  }

  if (stat.size > Limits.READ_MAX_BYTES) {
    return { ...base, note: Names.tooLargeNoteOf(stat.size) };
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
