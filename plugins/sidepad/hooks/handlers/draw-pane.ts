import type { RenderElement, RenderInput } from 'claude-code';
import PaneState from '../pane-state';
import Plan from '../plan';
import type Sidepad from '../sidepad';
import Views from '../views';
import { ensureWindow } from './ensure-window';

/**
 * One drawing of the pane: the state laid out for this body, and drawn.
 *
 * @returns the tree
 */
export function drawPane(
  sidepad: Sidepad.Sidepad,
  e: RenderInput<'Pane', 'terminal'>,
  ui: Views.TerminalUi,
): RenderElement {
  sidepad.state = PaneState.withColumns(sidepad.state, e.viewport?.columns);
  sidepad.state = PaneState.laidOut(sidepad.state, { rows: e.props.scroll.bodyRows, columns: e.props.bodyColumns });
  // The body's size is known only here, so a first drawing or a resize is where a windowed file
  // learns how many lines to read; the page draws the window it holds until the read lands.
  void ensureWindow(sidepad);

  return Views.paneView(ui, Plan.panePlanOf(sidepad.state, e.props.scroll.offset));
}
