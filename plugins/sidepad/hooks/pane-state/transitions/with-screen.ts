import type { PaneState } from '../types';

/**
 * The layout a command's `presentation` gives, kept from the first one: it is fixed per session.
 *
 * @returns the same object when the layout is known already
 */
export const withScreen = (state: PaneState, isFullscreen: boolean): PaneState =>
  state.screen === null ? { ...state, screen: isFullscreen ? 'fullscreen' : 'main' } : state;
