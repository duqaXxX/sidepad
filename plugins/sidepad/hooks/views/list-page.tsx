/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/**
 * A list page: its dim note a row at a time, then a plain Button a row (files dim, directories bright).
 * With the pane holding the keyboard the arrows and Tab move the engine's focus ring over these rows.
 *
 * LIMIT: the ring knows only the rows drawn, and wraps from the last one to `..`; a window moved
 * under it keeps the ring's place on screen, not its row (Claude Code 2.1.277). The rows past the
 * window are reached with Page Down, never by the arrows alone.
 *
 * @returns the page
 */
export function listPage(
  ui: TerminalUi,
  list: Extract<Plan.PanePlan['page'], { kind: 'list' }>,
  columns: number,
): RenderElement {
  const { Box, Button, Text } = ui;

  return (
    <Box flexDirection="column" width={columns}>
      {list.noteRows.map((row) => (
        <Text dimColor wrap="truncate-end">
          {row}
        </Text>
      ))}
      {list.rows.map((row) => (
        <Button key={row.key} plain dimColor={row.isDim} onPress={() => undefined}>
          {row.label}
        </Button>
      ))}
    </Box>
  );
}
