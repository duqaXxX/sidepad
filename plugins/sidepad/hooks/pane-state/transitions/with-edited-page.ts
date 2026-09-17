import type { PaneState } from '../types';
import { withoutSelection } from './without-selection';

/**
 * The page listing the files Claude edited, the open file marked; its `•` is cleared.
 *
 * @returns the state
 */
export const withEditedPage = (state: PaneState): PaneState => ({
  ...withoutSelection(state),
  page: { kind: 'edited', cameFrom: state.file?.loaded.path ?? '', top: 0 },
  edited: { ...state.edited, hasUnseen: false },
});
