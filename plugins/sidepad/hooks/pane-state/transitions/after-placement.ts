import type { PaneState } from '../types';

/**
 * A drawing's placement read once after an auto-open, when the layout was not known: a dock settles
 * the session as fullscreen; an inline placement (the main screen, two rows tall) settles it as the
 * main screen and closes the pane, so no later edit opens it there.
 *
 * @returns the state, and whether the handler closes the pane
 */
export function afterPlacement(
  state: PaneState,
  placement: 'dock' | 'inline',
): { state: PaneState; shouldClose: boolean } {
  if (!state.isPlacementUnchecked) {
    return { state, shouldClose: false };
  }

  return {
    state: {
      ...state,
      isPlacementUnchecked: false,
      screen: state.screen ?? (placement === 'dock' ? 'fullscreen' : 'main'),
    },
    shouldClose: placement === 'inline',
  };
}
