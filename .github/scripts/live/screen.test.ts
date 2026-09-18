import assert from 'node:assert/strict';
import { test } from 'node:test';
import { barRangeOf, codeRowsOf, columnOf, listingRowOf, paneOf, selectedLinesOf, shownPathOf } from './screen';

// Captures shaped as a docked pane drew them at 200 by 50 (Claude Code 2.1.276): the
// transcript on the left, the border, then the pane. Their content is synthetic.
const TRANSCRIPT = 40;
const captureOf = (paneRows: string[], below = ['─'.repeat(80), '❯ ', '─'.repeat(80)]) => [
  ...paneRows.map((row, at) => `${(at === 1 ? ' Claude Code' : '').padEnd(TRANSCRIPT)}│${row}`),
  ...below,
];

const CODE_PAGE = [
  ' ..                         ./src/report.ts   ✕',
  '',
  '  1 import { total } from "./total";',
  '  2',
  '  3 export function step001(values: number[]) {',
  '▌ 4   const sum = total(',
  '▌ 5     values,',
  '▌ 6   );',
  '  7',
  '  8   log("step 1", sum);',
  '  9   return sum;',
  ' 10 }',
  '',
  ' lines 4-6 [ Explain ] [ Find issues ] [ Rewrite ] [ Ask… ]',
];

test('the pane is found right of its border, from the row carrying the close mark', () => {
  const pane = paneOf(captureOf(CODE_PAGE))!;

  assert.equal(pane.left, TRANSCRIPT + 1);
  assert.equal(pane.top, 0);
  assert.equal(pane.rows.length, CODE_PAGE.length);
  assert.equal(pane.rows[2], CODE_PAGE[2]);
});

test('no pane when no bordered run carries the close mark, or the run is too short to be docked', () => {
  assert.equal(paneOf(captureOf(CODE_PAGE.map((row) => row.replace('✕', ' ')))), null);
  assert.equal(paneOf(captureOf(CODE_PAGE.slice(0, 4))), null);
  assert.equal(paneOf(['❯ ', '']), null);
});

test('the code rows name their gutter line, and the marker says which are selected', () => {
  const pane = paneOf(captureOf(CODE_PAGE))!;

  assert.deepEqual(
    codeRowsOf(pane).map((row) => row.line),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.deepEqual(selectedLinesOf(pane), [4, 5, 6]);
  assert.equal(codeRowsOf(pane)[0]!.row, 2);
});

test('the selection marker over a two-digit gutter still reads as selected', () => {
  const pane = paneOf(captureOf([...CODE_PAGE.slice(0, 11), '▌10 }', ...CODE_PAGE.slice(12)]))!;

  assert.deepEqual(selectedLinesOf(pane), [4, 5, 6, 10]);
});

test('the bar names its range; with no bar there is none', () => {
  assert.deepEqual(barRangeOf(paneOf(captureOf(CODE_PAGE))!), { start: 4, end: 6 });
  assert.equal(barRangeOf(paneOf(captureOf(CODE_PAGE.slice(0, -1)))!), null);
});

test('the top row gives the path shown, the session directory as .', () => {
  assert.equal(shownPathOf(paneOf(captureOf(CODE_PAGE))!), './src/report.ts');
  assert.equal(shownPathOf(paneOf(captureOf(['                .   ✕', ...CODE_PAGE.slice(1)]))!), '.');
});

test('a listing row is found by its label, marked or not, and a column by its text', () => {
  const pane = paneOf(
    captureOf([' ..                ./docs   ✕', '', '  notes.md', '● plan.md', ...CODE_PAGE.slice(4)]),
  )!;

  assert.equal(listingRowOf(pane, 'notes.md'), 2);
  assert.equal(listingRowOf(pane, 'plan.md'), 3);
  assert.equal(listingRowOf(pane, 'absent.md'), null);
  assert.equal(columnOf(pane, 0, '..'), 1);
  assert.equal(columnOf(pane, 2, 'zzz'), null);
});
