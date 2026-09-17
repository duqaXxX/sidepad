import Files from '../../files';
import type { PaneState } from '../types';

/**
 * The window a read landed for the open file, without moving the page.
 *
 * @param from the window's 0-based first line
 * @returns the same object when no file is open
 */
export function withFileWindow(state: PaneState, from: number, lines: readonly string[]): PaneState {
  const file = state.file;

  return file ? { ...state, file: { ...file, loaded: Files.withWindow(file.loaded, from, lines) } } : state;
}
