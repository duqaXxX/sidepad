/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import Names from '../names';
import type PageLayout from '../page-layout';
import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/** One run of segments a single Client draws: which run it is, where it starts, and what it holds. */
type Run = { kind: 'run'; run: number; firstRow: number; rows: number; segments: PageLayout.PlacedSegment[] };

/** What the page draws in order: a run inside one Client, or a picture the hooks' own tree draws. */
type Part = Run | { kind: 'picture'; placed: PageLayout.PlacedSegment };

/**
 * Whether a Client can draw a segment. A `Client`'s element table is the terminal's less `Image`, so
 * a picture is drawn by the hooks' own tree and breaks the run it sits in.
 */
const isDrawable = (placed: PageLayout.PlacedSegment) =>
  placed.segment.kind === 'rows' || placed.segment.kind === 'code' || placed.segment.kind === 'note';

/** The window's segments in order, each run gathered into one part and each picture its own. */
function partsOf(segments: readonly PageLayout.PlacedSegment[]): Part[] {
  const parts: Part[] = [];
  let open: Run | null = null;

  for (const placed of segments) {
    if (!isDrawable(placed)) {
      open = null;

      if (placed.segment.kind === 'image') {
        parts.push({ kind: 'picture', placed });
      }

      continue;
    }

    if (open === null || open.run !== placed.run) {
      open = { kind: 'run', run: placed.run, firstRow: placed.firstRow, rows: 0, segments: [] };
      parts.push(open);
    }

    open.rows += placed.rows;
    open.segments.push(placed);
  }

  return parts;
}

/**
 * A picture between two runs, drawn from its own path: the terminal opens and decodes the file, with
 * the file's modification time as `generation` so new content under that path is a new source. No
 * `key`: see `image-page.tsx`.
 */
function pictureOf(ui: TerminalUi, placed: PageLayout.PlacedSegment): RenderElement | null {
  const { Image } = ui;
  const segment = placed.segment;

  if (segment.kind !== 'image') {
    return null;
  }

  return (
    <Image
      source={{ file: segment.path, format: 'png', generation: segment.generation }}
      columns={segment.columns}
      rows={placed.rows}
      alt={segment.alt}
    />
  );
}

/** One run of the window, inside the Client that draws it and forwards its pointer. */
function runOf(ui: TerminalUi, run: Run, page: Plan.PagePlan): RenderElement {
  const { Client } = ui;

  return (
    <Client
      key={Names.keyOf('page', run.run)}
      module="../surfaces/markdown-page-view.tsx"
      props={{
        segments: run.segments,
        firstRow: run.firstRow,
        rows: run.rows,
        windowFirstRow: page.firstRow,
        windowRows: page.rows,
        totalRows: page.totalRows,
        range: page.range,
        epoch: page.epoch,
      }}
    />
  );
}

/**
 * A formatted page, Markdown or a table: the rows the hooks composed, handed to one Client per run of segments
 * a Client can draw, with each picture drawn between two runs by the hooks' own tree. The hooks laid
 * every block out, so a row's place on the page is theirs to know and no Client reports its height.
 *
 * A run is keyed by the pictures the page draws above it, never by its place in the window: a run
 * scrolling a picture out of view would otherwise take the key of the run before it, and with it the
 * drag that Client still held.
 *
 * @returns the page
 */
export function blocksPage(ui: TerminalUi, page: Plan.PagePlan, columns: number): RenderElement {
  const { Box } = ui;

  return (
    <Box flexDirection="column" width={columns}>
      {partsOf(page.segments).map((part) =>
        part.kind === 'picture' ? pictureOf(ui, part.placed) : runOf(ui, part, page),
      )}
    </Box>
  );
}
