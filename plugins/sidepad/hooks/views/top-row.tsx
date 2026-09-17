/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import Limits from '../limits';
import Names from '../names';
import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/**
 * The top row: plain Buttons on the left, the path on the right with each directory a Button, on a
 * grey lighter than the pane. One row at any width: a wrapped row pushed the page down and cut its
 * last line. The engine draws the close mark at the row's right end, so the path keeps clear of it.
 * A Button keeps its own background, so the grey shows around the Buttons, not under them.
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
      backgroundColor={Names.TOP_ROW_BACKGROUND}
    >
      <Box flexDirection="row" gap={Limits.NAVIGATION_GAP}>
        {top.navigation.map((button) => (
          <Button key={button.key} plain onPress={() => undefined}>
            {button.label}
          </Button>
        ))}
      </Box>
      <Box flexGrow={1} flexDirection="row" justifyContent="flex-end" overflow="hidden">
        {top.crumbs.map((crumb) =>
          crumb.kind === 'link' ? (
            <Button key={crumb.key} plain dimColor onPress={() => undefined}>
              {crumb.label}
            </Button>
          ) : (
            <Text dimColor>{crumb.label}</Text>
          ),
        )}
      </Box>
    </Box>
  );
}
