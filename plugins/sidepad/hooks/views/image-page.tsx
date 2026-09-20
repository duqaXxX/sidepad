/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/**
 * An image file's page: one picture, as wide as the page and as tall as its proportion allows. The
 * terminal opens and decodes the file itself, so no pixel crosses `$`, and a terminal that draws no
 * pixels shows the `alt` in its place.
 *
 * `generation` is the file's modification time: a source equal to the last drawn sends nothing, so a
 * picture overwritten under the same path would otherwise keep its old pixels beside its new size.
 *
 * No `key`: a key is the address `$.ui.blit` names to swap one picture for another, which the pane
 * never does, and absent one a redraw changes the picture, which is how the pane draws every frame.
 *
 * @returns the page
 */
export function imagePage(ui: TerminalUi, page: Plan.ImagePlan): RenderElement {
  const { Image } = ui;

  return (
    <Image
      source={{ file: page.path, format: 'png', generation: page.generation }}
      columns={page.columns}
      rows={page.rows}
      alt={page.alt}
    />
  );
}
