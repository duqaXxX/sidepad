/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { ClientModule, ClientPointerEvent, ClientSurface } from 'claude-code';

import Limits from '../limits';
import Names from '../names';
import type Plan from '../plan';
import Pointer from '../pointer';

// The listeners are set once, at mount, and read the latest props through this box.
// LIMIT: one box for the module: the pane draws a single code Client.
const latest: { props: Plan.CodeViewProps | null } = { props: null };

const windowOf = (props: Plan.CodeViewProps): Pointer.CodeWindow => ({
  firstLine: props.firstLine,
  lineCount: props.lines.length,
  totalLines: props.totalLines,
  barTop: props.barTop,
});

// No `surface.onKey`, on purpose: while a Client has a key listener a click hands it the keyboard,
// and typing after a selection never reached the prompt box. Without one the keys stay with the
// prompt, and page keys on a focused pane still reach the hooks' `ui.scroll`.
function listen(surface: ClientSurface<Pointer.CodeDrag>) {
  let edge: -1 | 0 | 1 = 0;
  let stopEdge: (() => void) | null = null;

  const apply = (drag: Pointer.CodeDrag, post: Parameters<typeof surface.post>[0] | null) => {
    if (drag !== surface.state) {
      surface.setState(drag);
    }

    if (post !== null) {
      surface.post(post);
    }
  };

  surface.onPointer((event: ClientPointerEvent) => {
    const props = latest.props;

    if (!props) {
      return;
    }

    const step = Pointer.codePointerStep(surface.state ?? Pointer.NO_DRAG, event, windowOf(props));

    apply(step.drag, step.post);

    if (step.edge === null) {
      return;
    }

    edge = step.edge;

    if (edge === 0) {
      stopEdge?.();
      stopEdge = null;
    } else {
      stopEdge ??= surface.every(Limits.EDGE_SCROLL_MS, () => {
        const now = latest.props;

        if (now) {
          const tick = Pointer.edgeTick(surface.state ?? Pointer.NO_DRAG, edge, windowOf(now));

          apply(tick.drag, tick.post);
        }
      });
    }
  });
}

/**
 * The code or Markdown source page: one `Code` for the window with the engine's own gutter, the
 * selection as a background behind it and a `▌` column over the gutter's first cell.
 *
 * `Code` drops empty lines unless it draws its own gutter (`startLine`), and each `Code` drops its
 * trailing blank lines, so the window is one `Code` and the text is handed over exactly as the file
 * has it. `Code` paints its own background under its text and gutter, so the selection's background
 * shows only in the cells right of each line; the `▌` marks the rows. The gutter keeps a blank first
 * cell at every width of line number, so the marker covers no digit.
 *
 * The column is as tall as the window, not as the `Code`: a window ending on blank lines draws no row
 * for them, and a column sized by what `Code` drew would clip the marker and the background there.
 * LIMIT: those rows also carry no gutter number (Claude Code 2.1.277, #39), which is the engine's.
 */
const codeView: ClientModule<Plan.CodeViewProps, Pointer.CodeDrag> = (props, surface) => {
  const { Box, Code, Text } = surface.elements;

  latest.props = props;

  if (surface.state === undefined) {
    listen(surface);
    surface.setState({ ...Pointer.NO_DRAG, epoch: props.epoch });
  }

  const stored = surface.state ?? Pointer.NO_DRAG;
  const drag = stored.epoch === props.epoch ? stored : { ...Pointer.NO_DRAG, epoch: props.epoch };

  if (drag !== stored) {
    surface.setState(drag);
  }

  const range = drag.isDragging && drag.hasMoved ? Pointer.draggedRangeOf(drag) : props.range;
  const low = range === null ? -1 : Math.max(range.start, props.firstLine + 1);
  const high = range === null ? -1 : Math.min(range.end, props.firstLine + props.lines.length);
  const hasRows = range !== null && low <= high;
  const top = low - props.firstLine - 1;
  const height = high - low + 1;

  return (
    <Box flexDirection="column" height={props.lines.length}>
      {hasRows ? (
        <Box
          position="absolute"
          top={top}
          left={0}
          width="100%"
          height={height}
          backgroundColor={Names.SELECTION_BACKGROUND}
        />
      ) : null}
      <Code source={props.lines.join('\n')} startLine={props.firstLine + 1} path={props.path} wrap="truncate-end" />
      {hasRows ? (
        <Box position="absolute" top={top} left={0} width={1} height={height} flexDirection="column">
          {Array.from({ length: height }, () => (
            <Text color={Names.ACCENT}>▌</Text>
          ))}
        </Box>
      ) : null}
    </Box>
  );
};

export default codeView;
