import type { PaneState } from '../types';
import { withoutSelection } from './without-selection';

/**
 * The file page on the file already open, where it was.
 *
 * @returns the same object when no file is open
 */
export const withFileShown = (state: PaneState): PaneState =>
  state.file ? { ...withoutSelection(state), page: { kind: 'file' } } : state;
