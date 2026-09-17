/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/**
 * A list page: its dim note, then a plain Button a row (files dim, directories bright).
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
      {list.note === null ? null : (
        <Text dimColor wrap="truncate-end">
          {list.note}
        </Text>
      )}
      {list.rows.map((row) => (
        <Button key={row.key} plain dimColor={row.isDim} onPress={() => undefined}>
          {row.label}
        </Button>
      ))}
    </Box>
  );
}
