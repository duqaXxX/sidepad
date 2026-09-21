/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import Limits from '../limits';
import type Plan from '../plan';
import { blocksPage } from './blocks-page';
import { codePage } from './code-page';
import { commandBar } from './command-bar';
import { imagePage } from './image-page';
import { listPage } from './list-page';
import { statusLine } from './status-line';
import type { TerminalUi } from './terminal-ui';
import { topRow } from './top-row';

/**
 * The pane body for one drawing: the top row, a rule, the page padded off the divider, the command
 * bar over it, and the status line on the body's last row.
 * The tree fits the body, so the engine never scrolls it: the hooks move the page's window instead.
 *
 * @returns the tree
 */
export function paneView(ui: TerminalUi, plan: Plan.PanePlan): RenderElement {
  const { Box, Text } = ui;
  const page = plan.page;

  return (
    <Box flexDirection="column">
      {topRow(ui, plan.top, plan.columns)}
      <Text color={plan.palette.rule}>{'─'.repeat(plan.columns)}</Text>
      <Box flexDirection="column" paddingLeft={Limits.PAGE_PADDING}>
        {page.kind === 'code'
          ? codePage(ui, page.props)
          : page.kind === 'page'
            ? blocksPage(ui, page, plan.pageColumns, plan.palette)
            : page.kind === 'image'
              ? imagePage(ui, page)
              : listPage(ui, page, plan.pageColumns)}
      </Box>
      {plan.bar ? commandBar(ui, plan.bar, plan.columns, plan.palette) : null}
      {statusLine(ui, plan.status, plan.columns, plan.palette)}
    </Box>
  );
}
