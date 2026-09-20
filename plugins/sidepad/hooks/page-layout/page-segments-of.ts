import type BlockLayout from '../block-layout';
import Limits from '../limits';
import type { Row, Span } from '../spans';
import type { PageLayout, PlacedSegment } from './page-layout';

/** Whether two spans are drawn the same way, so only their text tells them apart. */
const isSameStyle = (a: Span, b: Span) =>
  a.bold === b.bold &&
  a.italic === b.italic &&
  a.strikethrough === b.strikethrough &&
  a.dim === b.dim &&
  a.color === b.color &&
  a.isCode === b.isCode;

/**
 * A row with each run of same-styled spans joined into one. Wrapping emits a span per word, and a
 * Client's tree is bounded at 20,000 nodes and 100,000 characters serialized: a page of prose spends
 * both on `Text` elements drawing the same thing. A row of plain prose comes back as one span.
 *
 * @returns the same object when nothing merges
 */
function merged(row: Row): Row {
  const spans: Span[] = [];

  for (const span of row.spans) {
    const last = spans[spans.length - 1];

    if (last && isSameStyle(last, span)) {
      spans[spans.length - 1] = { ...last, text: last.text + span.text };
    } else {
      spans.push(span);
    }
  }

  return spans.length === row.spans.length ? row : { spans };
}

/**
 * The segments a window of the page draws, sliced to the rows it shows. Consecutive composed rows
 * are gathered into one segment, so a window of ordinary blocks comes out as a single row list; a
 * fence, a picture and a note keep segments of their own, since each is drawn by an element of its
 * own.
 *
 * Every row between `from` and `from + count` is accounted for, the blank row between two blocks
 * included, so a Client drawing the segments in order puts each row where the page has it. Each
 * segment carries the run it belongs to, counted over the whole page rather than the window, so a
 * run keeps its number as the window moves over it.
 *
 * LIMIT: a picture the window cuts is scaled into the rows it shows rather than cropped, since an
 * Image scales to fill the box it is given.
 *
 * @param from the page's first row shown, 0-based
 * @param count how many rows the window shows
 * @returns the segments, in order, each with the page row it starts on
 */
export function pageSegmentsOf(page: PageLayout, from: number, count: number): PlacedSegment[] {
  const until = from + count;
  const out: PlacedSegment[] = [];
  let pending: Row[] = [];
  let pendingRow = 0;
  let run = 0;

  function flush(): void {
    if (pending.length > 0) {
      out.push({ firstRow: pendingRow, rows: pending.length, run, segment: { kind: 'rows', rows: pending } });
      pending = [];
    }
  }

  function addRow(row: Row, at: number): void {
    if (pending.length === 0) {
      pendingRow = at;
    }

    pending.push(row);
  }

  /** Places one segment at `row` and returns the page row after it. */
  function place(segment: BlockLayout.Segment, row: number): number {
    switch (segment.kind) {
      case 'rows':
        segment.rows.forEach((drawn, at) => {
          if (row + at >= from && row + at < until) {
            addRow(merged(drawn), row + at);
          }
        });

        return row + segment.rows.length;
      case 'code': {
        const lines = segment.source === '' ? [] : segment.source.split('\n');
        const first = Math.max(0, from - row);
        const past = Math.min(segment.rows, until - row);

        if (past > first) {
          flush();
          out.push({
            firstRow: row + first,
            rows: past - first,
            run,
            segment: {
              kind: 'code',
              source: lines.slice(first, past).join('\n'),
              language: segment.language,
              rows: past - first,
            },
          });
        }

        return row + segment.rows;
      }
      case 'image': {
        const first = Math.max(0, from - row);
        const past = Math.min(segment.rows, until - row);

        // The page is cut here whether the picture is drawn or not: a Client may not draw an
        // `Image`, so the rows above it and the rows below never share one.
        flush();

        if (past > first) {
          out.push({
            firstRow: row + first,
            rows: past - first,
            run,
            segment: { ...segment, rows: past - first },
          });
        }

        run += 1;

        return row + segment.rows;
      }
      case 'note':
        if (row >= from && row < until) {
          flush();
          out.push({ firstRow: row, rows: 1, run, segment });
        }

        return row + 1;
      default:
        // A segment kind added later places itself here; until it does, it draws nothing and takes
        // no row, which is what an empty layout already means.
        return row;
    }
  }

  page.blocks.forEach((placed, at) => {
    let row = placed.firstRow;

    for (const segment of placed.layout.segments) {
      row = place(segment, row);
    }

    // The blank row between two blocks is drawn, so the rows under it keep the places the page gives
    // them; the last block has none.
    if (at < page.blocks.length - 1) {
      for (let gap = 0; gap < Limits.BLOCK_GAP_ROWS; gap += 1) {
        const blank = placed.firstRow + placed.layout.rows + gap;

        if (blank >= from && blank < until) {
          addRow({ spans: [] }, blank);
        }
      }
    }
  });

  flush();

  return out;
}
