import { describe, expect, test, tier } from 'claude-code/testing';

import Files from '../hooks/files';
import PaneState from '../hooks/pane-state';
import Plan from '../hooks/plan';
import { CWD, SAMPLE_MARKDOWN, SAMPLE_TYPESCRIPT, stateOf } from './fixtures';

tier('user');

/** The text of every composed row a formatted page draws, in the order drawn. */
const rowsOf = (page: Plan.PagePlan | null) =>
  (page?.segments ?? []).flatMap((placed) =>
    placed.segment.kind === 'rows' ? placed.segment.rows.map((row) => row.spans.map((span) => span.text).join('')) : [],
  );

describe('plan', () => {
  test('a code page hands the Client its window with the text as the file has it', () => {
    const plan = Plan.panePlanOf(stateOf({ path: `${CWD}/src/report.ts`, text: SAMPLE_TYPESCRIPT, rows: 8 }), 0);

    expect(plan.page).toMatchObject({ kind: 'code', props: { firstLine: 0, totalLines: 11, barTop: null } });
    expect(plan.page.kind === 'code' && plan.page.props.lines).toEqual(SAMPLE_TYPESCRIPT.split('\n').slice(0, 5));
    expect(plan.top.navigation.map((button) => button.label)).toEqual(['..']);
  });

  test('a selection draws the bar on the body foot and tells the Client where it starts', () => {
    const state = PaneState.withDraggedLines(
      stateOf({ path: `${CWD}/src/report.ts`, text: SAMPLE_TYPESCRIPT, rows: 12, columns: 89 }),
      { start: 2, end: 3 },
      3,
    );
    const plan = Plan.panePlanOf(state, 0);

    expect(plan.bar?.top).toBe(9);
    expect(plan.page.kind === 'code' && plan.page.props.barTop).toBe(7);
    expect(plan.status.top, 'the status line under the bar').toBe(11);
  });

  test('the status line names the Markdown mode and where the page is, on the body foot', () => {
    const code = Plan.panePlanOf(stateOf({ path: `${CWD}/src/report.ts`, text: SAMPLE_TYPESCRIPT, rows: 8 }), 0);
    const markdown = stateOf({ path: `${CWD}/notes.md`, text: SAMPLE_MARKDOWN, rows: 30 });
    const one = [{ name: 'only.ts', kind: 'file' as const, size: 0, isLink: false }];
    const listed = PaneState.withDirectory(stateOf({ rows: 12 }), CWD, { entries: one, failure: null }, '', null);

    expect(code.status).toEqual({ top: 7, left: '', right: 'lines 1–5 of 11' });
    expect(Plan.panePlanOf(markdown, 0).status).toMatchObject({ left: 'Formatted', right: 'lines 1–17 of 17' });
    expect(Plan.panePlanOf(PaneState.withMarkdownMode(markdown), 0).status.left).toBe('Source');
    expect(Plan.panePlanOf(listed, 0).status.right).toBe('1 entry');
  });

  test('a formatted Markdown page hands over the rows it draws, not the file; Source switches it', () => {
    const state = stateOf({ path: `${CWD}/notes.md`, text: SAMPLE_MARKDOWN, rows: 30 });
    const plan = Plan.panePlanOf(state, 0);
    const page = plan.page.kind === 'page' ? plan.page : null;

    expect(page).toMatchObject({ firstRow: 0, totalRows: 16, range: null });
    // One run of rows the hooks composed, then the fence the engine highlights.
    expect(page?.segments.map((placed) => [placed.segment.kind, placed.firstRow, placed.rows])).toEqual([
      ['rows', 0, 13],
      ['code', 13, 3],
    ]);
    expect(rowsOf(page).slice(0, 5)).toEqual([
      'Notes',
      '',
      // The block's two source lines, flowed into one paragraph.
      'A paragraph on two lines.',
      '',
      // The table is drawn by the pane, at the page's width.
      '┌───┬───┐',
    ]);
    expect(plan.top.navigation.map((button) => button.label)).toEqual(['..', 'Source']);
  });

  test('a selection names the rows its blocks cover, so the Client marks them', () => {
    const state = stateOf({ path: `${CWD}/notes.md`, text: SAMPLE_MARKDOWN, rows: 30 });
    // The table is lines 6 to 8 of the source, rows 4 to 8 of the page.
    const selected = PaneState.withBlockDrag(PaneState.withBlockPress(state, 7), 7, 7, true);
    const page = Plan.panePlanOf(selected, 0).page;

    expect(page.kind === 'page' && page.range).toEqual({ start: 4, end: 8 });
  });

  test('a Markdown block too long for one element draws a note instead', () => {
    const long = ['# Title', '', 'z'.repeat(12_000), ''].join('\n');
    const state = stateOf({ path: `${CWD}/long.md`, text: long, rows: 30 });
    const page = Plan.panePlanOf(state, 0).page;

    expect(page.kind === 'page' && page.segments.map((placed) => placed.segment.kind)).toEqual(['rows', 'note']);
    expect(page.kind === 'page' && page.segments[1]?.segment).toMatchObject({
      kind: 'note',
      text: 'Block too long to format: see Source',
    });
  });

  test('a list page: no .. at the session directory, rows keyed by their index in the whole list', () => {
    const entries = Array.from({ length: 30 }, (_, at) => ({
      name: `f${String(at).padStart(2, '0')}`,
      kind: 'file' as const,
      size: 0,
      isLink: false,
    }));
    const state = PaneState.scrolledBy(
      PaneState.withDirectory(stateOf({ rows: 12 }), CWD, { entries, failure: null }, '', null),
      {
        by: 5,
        isWheel: false,
      },
    );
    const plan = Plan.panePlanOf(state, 0);

    expect(plan.top.navigation).toEqual([]);
    expect(plan.page.kind === 'list' && plan.page.rows[0]).toEqual({ key: 'row:5', label: '  f05', isDim: true });
  });

  test('a note wider than the list is cut into rows that fit, and the list gives up those rows', () => {
    const entries = Array.from({ length: 30 }, (_, at) => ({
      name: `f${String(at).padStart(2, '0')}`,
      kind: 'file' as const,
      size: 0,
      isLink: false,
    }));
    const failure = 'Could not list this directory: denied, forty-five';
    const laid = stateOf({ rows: 12, columns: 21 });
    const plan = Plan.panePlanOf(PaneState.withDirectory(laid, CWD, { entries, failure }, '', null), 0);
    const page = plan.page.kind === 'list' ? plan.page : null;

    expect(page?.noteRows.map((row) => row.length)).toEqual([19, 19, 11]);
    expect(page?.noteRows.join('')).toBe(failure);
    expect(page?.rows.length).toBe(PaneState.windowRowsOf(laid) - 3);
  });

  test('the edited list shows once Claude edited, marked when unseen', () => {
    const state = PaneState.afterTurn(
      PaneState.withEditRecorded(stateOf({ path: `${CWD}/a.ts`, text: 'a' }), { path: `${CWD}/b.ts`, changedLine: 1 }),
      true,
    ).state;

    expect(Plan.panePlanOf(state, 0).top.navigation.map((button) => button.label)).toEqual(['..', 'Edited 1 •']);
  });

  test('a window of long lines holds what one Code can, a longer line cut to the cap', () => {
    const lines = Array.from({ length: 60 }, () => 'x'.repeat(4_000));

    expect(Plan.codeSourceLinesOf(lines, 0, 5, 80).map((line) => line.length)).toEqual([88, 88, 88, 88, 88]);
    expect(Plan.codeSourceLinesOf(lines, 0, 60, 80), 'every row of a tall page').toHaveLength(60);
    expect(Plan.codeSourceLinesOf(['y'.repeat(20_000)], 0, 5, 80).map((line) => line.length)).toEqual([88]);
    expect(Plan.codeSourceLinesOf(['a', 'b', 'c'], 1, 5, 80)).toEqual(['b', 'c']);
    expect(Plan.codeSourceLinesOf(lines, 0, 60, 300), 'a wide page draws what one Code holds').toHaveLength(32);
  });

  test('a PNG is drawn whole, as wide as the page and as tall as its proportion allows', () => {
    const png = `${CWD}/docs/logo.png`;
    const stat = { kind: 'file' as const, size: 32, mtimeMs: 1, isLink: false };
    const opened = (size: { width: number; height: number }) =>
      Plan.panePlanOf(PaneState.withFile(stateOf({ rows: 12 }), Files.imageFileOf(png, stat, size), null), 0);

    // 79 columns of page, a 320 by 40 picture: 5 rows once a cell counts twice as tall as it is wide.
    expect(opened({ width: 320, height: 40 }).page).toEqual({
      kind: 'image',
      path: png,
      alt: 'logo.png (320×40)',
      columns: 79,
      rows: 5,
    });
    expect(
      opened({ width: 100, height: 4_000 }).page,
      'a picture taller than the page is cut to the rows the page has',
    ).toMatchObject({ rows: 9 });
    expect(opened({ width: 320, height: 40 }).status).toMatchObject({ left: '', right: '' });
  });
});
