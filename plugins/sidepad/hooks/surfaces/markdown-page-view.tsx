/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { ClientElements, ClientModule, ClientSurface, RenderElement } from 'claude-code';

import type PageLayout from '../page-layout';
import type Plan from '../plan';
import Pointer from '../pointer';
import type { Row, Span } from '../spans';
import type Theme from '../theme';

// The listeners are set once, at mount, and read the latest props through this instance's surface.
// `ClientSurface` is called again with the same `surface` on new props, after `setState` and on a
// resize (plugins/types/claude-code.d.ts, ClientSurface), so it addresses the instance. A page cut
// around a picture draws a Client per run, and one box for the module would have them all reading
// the props of the last one drawn.
const latest = new WeakMap<ClientSurface<Pointer.CodeDrag>, Plan.PageViewProps>();

const windowOf = (props: Plan.PageViewProps): Pointer.PageWindow => ({
  firstRow: props.windowFirstRow,
  rowCount: props.windowRows,
  totalRows: props.totalRows,
  clientFirstRow: props.firstRow,
});

/**
 * One composed row: a `Text` per span, side by side; a row with no span still takes its row.
 *
 * A selected row carries the selection's background on its own `Text` elements. A `Text` paints the
 * cells it covers, so a background behind it shows only right of its text (measured on Claude Code
 * 2.1.278), and the page has no spare column for a marker of its own: every row is drawn at the
 * page's left edge, where the code page has the blank first cell of the engine's gutter.
 *
 * Inline code takes the theme's inline code style, which is how it is told from the prose around it
 * now that the pane draws the text rather than the engine's renderer. A selected row drops the rule
 * and link colours for the terminal's own, which reads on every theme's selection; a theme that gives
 * selected text a colour of its own draws every span of the row in it, inline code included.
 *
 * A link's text is a `Link`, which the engine underlines and, on a terminal it takes for one that
 * opens hyperlinks, sends as an OSC 8 span.
 *
 * LIMIT: on a terminal Claude Code does not take for one that opens hyperlinks, a `Link` draws its URL
 * after its text, which the row was not laid out to hold: the row is cut at the page's edge and loses
 * its end (Claude Code 2.1.280). No declaration says which case holds.
 */
function rowOf(elements: ClientElements, row: Row, isSelected: boolean, palette: Theme.Palette): RenderElement {
  const { Box, Link, Text } = elements;
  const background = isSelected ? palette.selectionBackground : undefined;
  const selectedText = isSelected ? palette.selectionText : null;

  if (row.spans.length === 0) {
    return <Text backgroundColor={background}> </Text>;
  }

  return (
    <Box flexDirection="row">
      {row.spans.map((span: Span) => {
        const code = span.isCode ? palette.inlineCode : null;
        const tone = span.tone && !isSelected ? palette[span.tone] : null;
        const color = selectedText ?? (code ? code.color : tone);

        return (
          <Text
            color={color ?? undefined}
            backgroundColor={background}
            bold={span.bold ?? code?.bold}
            italic={span.italic}
            underline={code?.underline}
            dimColor={span.dim}
            strikethrough={span.strikethrough}
            wrap="truncate-end"
          >
            {span.href === undefined ? span.text : <Link href={span.href}>{span.text}</Link>}
          </Text>
        );
      })}
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
  palette: Theme.Palette,
): RenderElement | null {
  const { Box, Code, Text } = elements;
  const segment = placed.segment;

  switch (segment.kind) {
    case 'rows':
      return (
        <Box flexDirection="column">
          {segment.rows.map((row, at) => rowOf(elements, row, isSelected(placed.firstRow + at), palette))}
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
          color={isSelected(placed.firstRow) ? (palette.selectionText ?? undefined) : undefined}
          backgroundColor={isSelected(placed.firstRow) ? palette.selectionBackground : undefined}
          wrap="truncate-end"
        >
          {segment.text}
        </Text>
      );
    default:
      // A picture never reaches a Client (`ClientElements` omits `Image`): the run stops at it, and
      // the hooks' own tree draws it. A segment kind added later draws itself here.
      return null;
  }
}

/**
 * The formatted page, Markdown or a table: the rows the hooks composed, one `Text` a span, the selection painted
 * on the rows it covers and behind them in the cells their text leaves.
 *
 * The hooks own the selection, drag included: a row belongs to a block, and only they know which,
 * so the rows drawn as selected are the ones they hand over rather than the ones the drag covers.
 */
const markdownPageView: ClientModule<Plan.PageViewProps, Pointer.CodeDrag> = (props, surface) => {
  const { Box } = surface.elements;

  latest.set(surface, props);

  if (surface.state === undefined) {
    Pointer.listenForDrag(
      surface,
      () => {
        const now = latest.get(surface);

        return now ? windowOf(now) : null;
      },
      Pointer.pagePointerStep,
      Pointer.pageEdgeTick,
    );
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
          backgroundColor={props.palette.selectionBackground}
        />
      ) : null}
      {props.segments.map((placed) => segmentOf(surface.elements, placed, isSelected, props.palette))}
    </Box>
  );
};

export default markdownPageView;
