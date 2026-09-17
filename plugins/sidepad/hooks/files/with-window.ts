import type { LoadedFile } from './loaded-file';

/**
 * A windowed file holding the lines a window command printed.
 *
 * @param from the window's 0-based first line
 * @returns the file; a file held whole is returned as it is
 */
export const withWindow = (file: LoadedFile, from: number, lines: readonly string[]): LoadedFile =>
  file.source === 'windowed' ? { ...file, from, lines } : file;
