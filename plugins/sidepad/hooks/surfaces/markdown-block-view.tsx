/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { ClientModule, ClientPointerEvent } from 'claude-code';

import Limits from '../limits';
import Names from '../names';
import type Plan from '../plan';
import Pointer from '../pointer';

/** The instance's own state: the rows it last reported, and whether it holds the pointer. */
type BlockViewState = { reportedRows: number; isHolding: boolean };

/**
 * One Markdown block drawn by the engine's renderer in a region of its own. The instance polls its
 * laid-out height (`surface.rows`, known only after a layout) and reports it, and posts the pointer
 * as it presses, drags and releases, so the hooks can map a row to a block.
 */
const markdownBlockView: ClientModule<Plan.BlockViewProps, BlockViewState> = (props, surface) => {
  const { Box, Markdown, Text } = surface.elements;
  // The key carries the index, so an instance keeps one index for its whole life.
  const index = props.index;

  if (surface.state === undefined) {
    surface.setState({ reportedRows: 0, isHolding: false });

    surface.every(Limits.BLOCK_ROWS_POLL_MS, () => {
      const state = surface.state;

      if (state && surface.rows > 0 && surface.rows !== state.reportedRows) {
        surface.setState({ ...state, reportedRows: surface.rows });
        surface.post({ kind: 'block-rows', index, rows: surface.rows });
      }
    });

    surface.onPointer((event: ClientPointerEvent) => {
      const state = surface.state ?? { reportedRows: 0, isHolding: false };
      const step = Pointer.blockPointerStep(state.isHolding, event, index);

      if (step.isHolding !== state.isHolding) {
        surface.setState({ ...state, isHolding: step.isHolding });
      }

      if (step.post !== null) {
        surface.post(step.post);
      }
    });
  }

  const block =
    props.table !== null ? (
      <Box flexDirection="column">
        {props.table.map((row, at) => (
          <Text key={Names.keyOf('table', at)} bold={row.isHeader} wrap="truncate-end">
            {row.text}
          </Text>
        ))}
      </Box>
    ) : props.note === null ? (
      <Markdown text={props.text} />
    ) : (
      <Text dimColor wrap="truncate-end">
        {props.note}
      </Text>
    );

  return props.isSelected ? <Box backgroundColor={Names.SELECTION_BACKGROUND}>{block}</Box> : <Box>{block}</Box>;
};

export default markdownBlockView;
