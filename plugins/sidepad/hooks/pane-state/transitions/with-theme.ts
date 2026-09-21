import type { PaneState } from '../types';

/**
 * The pane's theme, or Claude Code's `theme` setting, as just set or read. Either part left out
 * stays as it was.
 *
 * @returns the same object when nothing changed
 */
export const withTheme = (state: PaneState, theme: Partial<PaneState['theme']>): PaneState => {
  const next = { ...state.theme, ...theme };

  return next.name === state.theme.name && next.claude === state.theme.claude ? state : { ...state, theme: next };
};
