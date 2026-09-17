import type { PaneState } from '../types';

/**
 * The state with no selection and no press, the epoch bumped so the code Client drops its drag.
 *
 * @returns the same object when there was neither
 */
export const withoutSelection = (state: PaneState): PaneState =>
  state.selection === null && state.press === null
    ? state
    : { ...state, selection: null, press: null, epoch: state.epoch + 1 };
