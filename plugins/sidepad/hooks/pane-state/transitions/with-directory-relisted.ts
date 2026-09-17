import type { FsEntry } from 'claude-code';

import type { PaneState } from '../types';
import { clamped } from './clamped';

/**
 * The directory page listed again in place, its window and note kept.
 *
 * @returns the same object on any other page
 */
export const withDirectoryRelisted = (state: PaneState, entries: readonly FsEntry[]): PaneState =>
  state.page.kind === 'directory' ? clamped({ ...state, page: { ...state.page, entries } }) : state;
