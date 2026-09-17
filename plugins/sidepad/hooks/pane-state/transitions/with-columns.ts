import type { PaneState } from '../types';

/**
 * The terminal's width as a drawing or a command reported it. It decides whether a pane would be
 * drawn at all, so it is kept fresh rather than settled once: a person resizes a terminal.
 *
 * @returns the same object when the width is the one already known
 */
export const withColumns = (state: PaneState, columns: number | undefined): PaneState =>
  columns === undefined || columns === state.columns ? state : { ...state, columns };
