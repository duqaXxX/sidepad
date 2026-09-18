import type { DirectoryListing, PaneState } from '../types';
import { clamped } from './clamped';

/**
 * The directory page listed again in place, its window and note kept, its failure the new listing's.
 *
 * @returns the same object on any other page
 */
export const withDirectoryRelisted = (state: PaneState, { entries, failure }: DirectoryListing): PaneState =>
  state.page.kind === 'directory' ? clamped({ ...state, page: { ...state.page, entries, failure } }) : state;
