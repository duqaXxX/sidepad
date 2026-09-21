/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import type Bar from '../bar';
import Limits from '../limits';
import Names from '../names';
import type Plan from '../plan';
import type Theme from '../theme';
import type { TerminalUi } from './terminal-ui';

/**
 * The command bar over a selection, on the body's last rows: a blank row, then the accent band.
 *
 * Drawn by the hooks, not inside the Client: a press here hands the keys back to the prompt box,
 * where Ask… sends the person, while a press inside the Client kept them. The row under the body's
 * last one is the pane's frame, where nothing drawn shows, so the band ends on the body's last row.
 * The blank row is a Text of spaces: an empty Box is transparent and the code under it showed.
 *
 * @returns the bar
 */
export function commandBar(
  ui: TerminalUi,
  bar: NonNullable<Plan.PanePlan['bar']>,
  columns: number,
  palette: Theme.Palette,
): RenderElement {
  const { Box, Button, Text } = ui;
  const itemOf = (item: Bar.BarItem): RenderElement =>
    item.kind === 'button' ? (
      <Button key={Names.keyOf('command', item.id)} onPress={() => undefined}>
        {item.label}
      </Button>
    ) : (
      <Text bold={item.kind === 'label'} color={palette.barText}>
        {item.text}
      </Text>
    );

  return (
    <Box position="absolute" top={bar.top} left={0} width={columns} flexDirection="column">
      <Text>{' '.repeat(columns)}</Text>
      <Box width={columns} flexDirection="column" paddingX={Limits.BAR_PADDING} backgroundColor={palette.accent}>
        {bar.layout.map((row) => (
          <Box flexDirection="row" gap={1} height={1}>
            {row.map(itemOf)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
