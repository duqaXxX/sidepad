import type { RenderElement, RenderInput } from 'claude-code';
import Names from '../names';
import PaneState from '../pane-state';
import Plan from '../plan';
import type Sidepad from '../sidepad';
import Views from '../views';
import { ensureWindow } from './ensure-window';

/**
 * One drawing of the pane: the first drawing after an auto-open whose layout was unknown closes a
 * pane placed inline; otherwise the state is laid out for this body and drawn.
 *
 * @returns the tree, or null when the pane was closed and the engine draws its own
 */
export function drawPane(
  sidepad: Sidepad.Sidepad,
  e: RenderInput<'Pane', 'terminal'>,
  ui: Views.TerminalUi,
): RenderElement | null {
  sidepad.state = PaneState.withColumns(sidepad.state, e.viewport?.columns);

  const placed = PaneState.afterPlacement(sidepad.state, e.props.placement);

  sidepad.state = placed.state;

  if (placed.shouldClose) {
    void sidepad.host.closePane({ id: Names.PANE_ID }).catch(() => undefined);

    return null;
  }

  sidepad.state = PaneState.laidOut(sidepad.state, { rows: e.props.scroll.bodyRows, columns: e.props.bodyColumns });
  // The body's size is known only here, so a first drawing or a resize is where a windowed file
  // learns how many lines to read; the page draws the window it holds until the read lands.
  void ensureWindow(sidepad);

  return Views.paneView(ui, Plan.panePlanOf(sidepad.state, e.props.scroll.offset));
}
