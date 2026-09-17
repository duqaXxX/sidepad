import type { PaneState } from '../types';

/**
 * The file the file page shows.
 *
 * @returns its path, or null on a list page
 */
export const shownFileOf = (state: PaneState) =>
  state.page.kind === 'file' ? (state.file?.loaded.path ?? null) : null;
