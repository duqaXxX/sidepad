import { describe, expect, test, tier } from 'claude-code/testing';

import PaneState from '../hooks/pane-state';
import Plan from '../hooks/plan';
import { CWD, SAMPLE_MARKDOWN, SAMPLE_TYPESCRIPT, stateOf } from './fixtures';

tier('user');

describe('plan', () => {
  test('a code page hands the Client its window with the text as the file has it', () => {
    const plan = Plan.panePlanOf(stateOf({ path: `${CWD}/src/report.ts`, text: SAMPLE_TYPESCRIPT, rows: 8 }), 0);

    expect(plan.page).toMatchObject({ kind: 'code', props: { firstLine: 0, totalLines: 11, barTop: null } });
    expect(plan.page.kind === 'code' && plan.page.props.lines).toEqual(SAMPLE_TYPESCRIPT.split('\n').slice(0, 6));
    expect(plan.top.navigation.map((button) => button.label)).toEqual(['..']);
  });

  test('a selection draws the bar on the body foot and tells the Client where it starts', () => {
    const state = PaneState.withDraggedLines(
      stateOf({ path: `${CWD}/src/report.ts`, text: SAMPLE_TYPESCRIPT, rows: 12, columns: 89 }),
      { start: 2, end: 3 },
      3,
    );
    const plan = Plan.panePlanOf(state, 0);

    expect(plan.bar?.top).toBe(10);
    expect(plan.page.kind === 'code' && plan.page.props.barTop).toBe(8);
  });

  test('a formatted Markdown page is one block a Client; Source switches it', () => {
    const state = stateOf({ path: `${CWD}/notes.md`, text: SAMPLE_MARKDOWN, rows: 30 });
    const plan = Plan.panePlanOf(state, 0);

    expect(plan.page.kind === 'blocks' && plan.page.blocks.map((block) => block.text.split('\n')[0])).toEqual([
      '# Notes',
      'A paragraph',
      '| a | b |',
      '- one',
      '```ts',
    ]);
    expect(plan.top.navigation.map((button) => button.label)).toEqual(['..', 'Source']);
  });

  test('a Markdown block too long for one element draws a note instead', () => {
    const long = ['# Title', '', 'z'.repeat(12_000), ''].join('\n');
    const state = stateOf({ path: `${CWD}/long.md`, text: long, rows: 30 });
    const page = Plan.panePlanOf(state, 0).page;

    expect(page.kind === 'blocks' && page.blocks.map((block) => block.note)).toEqual([
      null,
      'Block too long to format: see Source',
    ]);
    expect(page.kind === 'blocks' && page.blocks[1]?.text).toBe('');
  });

  test('a list page: no .. at the session directory, rows keyed by their index in the whole list', () => {
    const entries = Array.from({ length: 30 }, (_, at) => ({
      name: `f${String(at).padStart(2, '0')}`,
      kind: 'file' as const,
      size: 0,
    }));
    const state = PaneState.scrolledBy(PaneState.withDirectory(stateOf({ rows: 12 }), CWD, entries, '', null), {
      by: 5,
      isWheel: false,
    });
    const plan = Plan.panePlanOf(state, 0);

    expect(plan.top.navigation).toEqual([]);
    expect(plan.page.kind === 'list' && plan.page.rows[0]).toEqual({ key: 'row:5', label: '  f05', isDim: true });
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
});
