/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import type Plan from '../plan';
import { blocksPage } from './blocks-page';
import { codePage } from './code-page';
import { commandBar } from './command-bar';
import { listPage } from './list-page';
import type { TerminalUi } from './terminal-ui';
import { topRow } from './top-row';

/**
 * The pane body for one drawing: the top row, a blank row, the page, and the command bar over it.
 * The tree fits the body, so the engine never scrolls it: the hooks move the page's window instead.
 *
 * @returns the tree
 */
export function paneView(ui: TerminalUi, plan: Plan.PanePlan): RenderElement {
  const { Box } = ui;
  const page = plan.page;

  return (
    <Box flexDirection="column">
      {topRow(ui, plan.top, plan.columns)}
      <Box height={1} />
      {page.kind === 'code'
        ? codePage(ui, page.props)
        : page.kind === 'blocks'
          ? blocksPage(ui, page.blocks, plan.columns)
          : listPage(ui, page, plan.columns)}
      {plan.bar ? commandBar(ui, plan.bar, plan.columns) : null}
    </Box>
  );
}
