import Limits from '../limits';

/**
 * What `/sidepad` does, the one place its toggle is decided: close the pane it has open; else open
 * it, unless the terminal is narrower than the engine draws a pane on, where it answers the resize
 * line instead. A width nobody has reported yet opens, and the pane's first drawing settles it.
 *
 * @param pane whether the pane is open, and the terminal's width when it is known
 * @returns `close`, `open` or `too-narrow`
 */
export function paneToggleOf(pane: { isOpen: boolean; columns: number | null }): 'open' | 'close' | 'too-narrow' {
  if (pane.isOpen) {
    return 'close';
  }

  return pane.columns !== null && pane.columns < Limits.OPEN_MIN_COLUMNS ? 'too-narrow' : 'open';
}
