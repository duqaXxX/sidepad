import PaneState from '../pane-state';
import type Sidepad from '../sidepad';

/**
 * The terminal's width, read off the hint line under the prompt, which the engine draws whatever the
 * pane is doing. It is how the width is known before a pane exists, as `diff` learns it.
 *
 * @param columns what the drawing's viewport reported, absent on a surface that reports none
 */
export function learnWidth(sidepad: Sidepad.Sidepad, columns: number | undefined): void {
  sidepad.state = PaneState.withColumns(sidepad.state, columns);
}
