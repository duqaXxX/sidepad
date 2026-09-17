import type { LoadedFile } from './loaded-file';

/**
 * Whether the lines a page wants are the ones the file holds: always for a file read whole, and for
 * a windowed file when its window starts where the page does and is long enough.
 *
 * @param top the page's 0-based first line
 * @param rows the rows the page draws
 * @returns true when nothing needs reading
 */
export function isWindowHeld(file: LoadedFile, top: number, rows: number): boolean {
  if (file.source === 'whole' || file.note !== null) {
    return true;
  }

  const wanted = Math.min(rows, Math.max(0, file.total - top));

  return file.from === top && file.lines.length >= wanted;
}
