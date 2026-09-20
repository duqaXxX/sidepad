/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import Names from '../names';
import type PageLayout from '../page-layout';
import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/** One run of segments a single Client draws: where it starts, its rows, and what it holds. */
type Run = { firstRow: number; rows: number; segments: PageLayout.PlacedSegment[] };

/**
 * Whether a Client can draw a segment. A `Client`'s element table is the terminal's less `Image`, so
 * a picture is drawn by the hooks' own tree and breaks the run it sits in.
 */
const isDrawable = (placed: PageLayout.PlacedSegment) =>
  placed.segment.kind === 'rows' || placed.segment.kind === 'code' || placed.segment.kind === 'note';

/** The window's segments cut into the runs one Client each draws, the rest left out. */
function runsOf(segments: readonly PageLayout.PlacedSegment[]): Run[] {
  const runs: Run[] = [];
  let open: Run | null = null;

  for (const placed of segments) {
    if (!isDrawable(placed)) {
      open = null;
      continue;
    }

    if (open === null) {
      open = { firstRow: placed.firstRow, rows: 0, segments: [] };
      runs.push(open);
    }

    open.rows += placed.rows;
    open.segments.push(placed);
  }

  return runs;
}

/**
 * A formatted Markdown page: the rows the hooks composed, handed to one Client per run of segments
 * a Client can draw. The hooks laid every block out, so a row's place on the page is theirs to know
 * and no Client reports its height.
 *
 * @returns the page
 */
export function blocksPage(ui: TerminalUi, page: Plan.PagePlan, columns: number): RenderElement {
  const { Box, Client } = ui;

  return (
    <Box flexDirection="column" width={columns}>
      {runsOf(page.segments).map((run, at) => (
        <Client
          key={Names.keyOf('page', at)}
          module="../surfaces/markdown-page-view.tsx"
          props={{
            segments: run.segments,
            firstRow: run.firstRow,
            rows: run.rows,
            totalRows: page.totalRows,
            range: page.range,
            epoch: page.epoch,
          }}
        />
      ))}
    </Box>
  );
}
