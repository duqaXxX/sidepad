import type { PaneState } from '../types';

/**
 * The pane opened, by `/sidepad` or by an edit: a person's earlier close is forgotten.
 *
 * @returns the state
 */
export const afterOpened = (state: PaneState): PaneState => ({ ...state, isOpen: true, isClosedByPerson: false });
