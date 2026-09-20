/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import Limits from '../limits';
import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/**
 * The top row: plain Buttons on the left, the path on the right with each directory a dim Button and
 * the file or directory shown bold at its end. One row at any width: a wrapped row pushed the page
 * down and cut its last line. The engine draws the close mark at the row's right end, so the path
 * keeps clear of it.
 *
 * @returns the row
 */
export function topRow(ui: TerminalUi, top: Plan.PanePlan['top'], columns: number): RenderElement {
  const { Box, Button, Text } = ui;

  return (
    <Box
      width={columns}
      height={1}
      flexDirection="row"
      paddingLeft={Limits.TOP_ROW_PADDING}
      paddingRight={Limits.CLOSE_MARK_CLEAR}
    >
      <Box flexDirection="row" gap={Limits.NAVIGATION_GAP}>
        {top.navigation.map((button) => (
          <Button key={button.key} plain onPress={() => undefined}>
            {button.label}
          </Button>
        ))}
      </Box>
      <Box flexGrow={1} flexDirection="row" justifyContent="flex-end" overflow="hidden">
        {top.crumbs.map((crumb, at) =>
          crumb.kind === 'link' ? (
            <Button key={crumb.key} plain dimColor onPress={() => undefined}>
              {crumb.label}
            </Button>
          ) : at === top.crumbs.length - 1 ? (
            <Text bold>{crumb.label}</Text>
          ) : (
            <Text dimColor>{crumb.label}</Text>
          ),
        )}
      </Box>
    </Box>
  );
}
