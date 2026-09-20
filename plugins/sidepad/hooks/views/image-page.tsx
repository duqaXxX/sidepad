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
 * @returns the page
 */
export function imagePage(ui: TerminalUi, page: Plan.ImagePlan): RenderElement {
  const { Image } = ui;

  return <Image source={{ file: page.path, format: 'png' }} columns={page.columns} rows={page.rows} alt={page.alt} />;
}
