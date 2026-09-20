/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { ClientElements, ClientModule, ClientPointerEvent, ClientSurface, RenderElement } from 'claude-code';

import Limits from '../limits';
import Names from '../names';
import type PageLayout from '../page-layout';
import type Plan from '../plan';
import Pointer from '../pointer';
import type { Row, Span } from '../spans';

// The listeners are set once, at mount, and read the latest props through this box.
// LIMIT: one box for the module: the formatted page draws a single Client, and a page cut into
// several runs would need one box per instance.
const latest: { props: Plan.PageViewProps | null } = { props: null };

const windowOf = (props: Plan.PageViewProps): Pointer.PageWindow => ({
  firstRow: props.firstRow,
  rowCount: props.rows,
  totalRows: props.totalRows,
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

    const step = Pointer.pagePointerStep(surface.state ?? Pointer.NO_DRAG, event, windowOf(props));

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
          const tick = Pointer.pageEdgeTick(surface.state ?? Pointer.NO_DRAG, edge, windowOf(now));

          apply(tick.drag, tick.post);
        }
      });
    }
  });
}

/**
 * One composed row: a `Text` per span, side by side; a row with no span still takes its row.
 *
 * A selected row carries the selection's background on its own `Text` elements. A `Text` paints the
 * cells it covers, so a background behind it shows only right of its text (measured on Claude Code
 * 2.1.278), and the page has no spare column for a marker of its own: every row is drawn at the
 * page's left edge, where the code page has the blank first cell of the engine's gutter.
 *
 * Inline code takes INLINE_CODE over whatever colour its span carries, which is how it is told from
 * the prose around it now that the pane draws the text rather than the engine's renderer.
 */
function rowOf(elements: ClientElements, row: Row, isSelected: boolean): RenderElement {
  const { Box, Text } = elements;
  const background = isSelected ? Names.SELECTION_BACKGROUND : undefined;

  if (row.spans.length === 0) {
    return <Text backgroundColor={background}> </Text>;
  }

  return (
    <Box flexDirection="row">
      {row.spans.map((span: Span) => (
        <Text
          color={span.isCode ? Names.INLINE_CODE : span.color}
          backgroundColor={background}
          bold={span.bold}
          italic={span.italic}
          dimColor={span.dim}
          strikethrough={span.strikethrough}
          wrap="truncate-end"
        >
          {span.text}
        </Text>
      ))}
    </Box>
  );
}

/**
 * A fence's source with each empty line carrying one space.
 *
 * LIMIT: a `Code` drawing no gutter of its own draws no row for an empty line (Claude Code 2.1.278),
 * so a blank line inside a fence came out at the fence's foot and the lines under it a row high.
 */
const fenceSourceOf = (source: string) =>
  source
    .split('\n')
    .map((line) => (line === '' ? ' ' : line))
    .join('\n');

/**
 * One segment of the window: composed rows, a fence the engine highlights, or a dim note.
 *
 * @param isSelected whether the page row given is one the selection covers
 */
function segmentOf(
  elements: ClientElements,
  placed: PageLayout.PlacedSegment,
  isSelected: (row: number) => boolean,
): RenderElement | null {
  const { Box, Code, Text } = elements;
  const segment = placed.segment;

  switch (segment.kind) {
    case 'rows':
      return (
        <Box flexDirection="column">
          {segment.rows.map((row, at) => rowOf(elements, row, isSelected(placed.firstRow + at)))}
        </Box>
      );
    case 'code':
      // The fence keeps the height the layout counted, whatever `Code` draws: a row of the page
      // below it would otherwise sit one row off the block it belongs to. `Code` paints its own
      // background, so a selected fence is marked only in the cells it leaves, as on the code page.
      return (
        <Box flexDirection="column" height={segment.rows}>
          <Code source={fenceSourceOf(segment.source)} language={segment.language ?? undefined} wrap="truncate-end" />
        </Box>
      );
    case 'note':
      return (
        <Text
          dimColor
          backgroundColor={isSelected(placed.firstRow) ? Names.SELECTION_BACKGROUND : undefined}
          wrap="truncate-end"
        >
          {segment.text}
        </Text>
      );
    default:
      // A segment kind added later draws itself here; until then it takes no row, as the layout says.
      return null;
  }
}

/**
 * The formatted Markdown page: the rows the hooks composed, one `Text` a span, the selection painted
 * on the rows it covers and behind them in the cells their text leaves.
 *
 * The hooks own the selection, drag included: a row belongs to a block, and only they know which,
 * so the rows drawn as selected are the ones they hand over rather than the ones the drag covers.
 */
const markdownPageView: ClientModule<Plan.PageViewProps, Pointer.CodeDrag> = (props, surface) => {
  const { Box } = surface.elements;

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

  const range = props.range;
  const low = range === null ? -1 : Math.max(range.start, props.firstRow);
  const high = range === null ? -1 : Math.min(range.end, props.firstRow + props.rows - 1);
  const hasRows = range !== null && low <= high;
  const top = low - props.firstRow;
  const height = high - low + 1;
  const isSelected = (row: number) => hasRows && row >= low && row <= high;

  return (
    <Box flexDirection="column" height={props.rows}>
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
      {props.segments.map((placed) => segmentOf(surface.elements, placed, isSelected))}
    </Box>
  );
};

export default markdownPageView;
