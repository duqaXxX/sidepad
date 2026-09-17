/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import Names from '../names';
import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/**
 * A code or Markdown source page: the Client that draws the window and reports the selection.
 *
 * @returns the Client
 */
export function codePage(ui: TerminalUi, props: Plan.CodeViewProps): RenderElement {
  const { Client } = ui;

  return <Client key={Names.CODE_VIEW_KEY} module="../surfaces/code-view.tsx" props={props} />;
}
