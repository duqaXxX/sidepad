/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import Limits from '../limits';
import Names from '../names';
import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/**
 * The status line on the body's last row: the page mode on the left, where the page is on the
 * right, dim on a grey band. Drawn over the body rather than in the column, so a page shorter than
 * the window leaves it where it is. The row under the body's is the pane's frame, where nothing
 * drawn shows.
 *
 * @returns the line
 */
export function statusLine(ui: TerminalUi, status: Plan.PanePlan['status'], columns: number): RenderElement {
  const { Box, Text } = ui;

  return (
    <Box
      position="absolute"
      top={status.top}
      left={0}
      width={columns}
      height={1}
      flexDirection="row"
      paddingX={Limits.BAR_PADDING}
      backgroundColor={Names.STATUS_BACKGROUND}
    >
      <Box flexGrow={1} overflow="hidden">
        <Text dimColor wrap="truncate-end">
          {status.left}
        </Text>
      </Box>
      <Text dimColor wrap="truncate-start">
        {status.right}
      </Text>
    </Box>
  );
}
