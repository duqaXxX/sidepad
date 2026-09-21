import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { delimitedTableOf } from '../../plugins/sidepad/hooks/delimited/delimited-table-of';
import { isBinaryText } from '../../plugins/sidepad/hooks/files/is-binary-text';
import { isUnifiedDiff } from '../../plugins/sidepad/hooks/files/is-unified-diff';
import { imageBoxOf } from '../../plugins/sidepad/hooks/images/image-box-of';
import { pngSizeOf } from '../../plugins/sidepad/hooks/images/png-size-of';
import { OPEN_MIN_COLUMNS, PAGE_PADDING } from '../../plugins/sidepad/hooks/limits/columns';
import { IMAGE_CELL_ASPECT, IMAGE_MAX_ROWS } from '../../plugins/sidepad/hooks/limits/rows';
import { MAX_ELEMENT_CHARS, READ_MAX_BYTES } from '../../plugins/sidepad/hooks/limits/sizes';
import { imageTargetsOf } from '../../plugins/sidepad/hooks/markdown-blocks/lone-image-of';
import { markdownBlocksOf } from '../../plugins/sidepad/hooks/markdown-blocks/markdown-blocks-of';
import { pageLayoutOf } from '../../plugins/sidepad/hooks/page-layout/page-layout-of';
import { tableRowsOf } from '../../plugins/sidepad/hooks/tables/table-rows-of';
import { ROWS } from './live/session';
import {
  DATA_FILE,
  DIFF_FILE,
  DRAFT_DIFF,
  HUGE_FILE,
  LOCKED_DIRECTORY,
  LONG_DIRECTORY,
  makePlayground,
  PICTURE,
  PICTURE_PAGE,
  removePlayground,
  WIDE_PICTURE,
} from './make-playground';

// The playground is what a person tries sidepad on, and what a published screenshot is taken from.
// Its only failure mode is silence: a generated file that no longer crosses the limit it exists to
// cross still opens, still looks right, and no longer tests anything. So every property it is meant
// to have is asserted here against the plugin's own constants, and drift is a red test.
const ROOT = makePlayground(mkdtempSync(join(tmpdir(), 'sidepad-playground-test-')));
const read = (name: string) => readFileSync(join(ROOT, name), 'utf8');

process.on('exit', () => removePlayground(ROOT));

test('a file past the read cap, so the pane reads it one window at a time', () => {
  assert.ok(statSync(join(ROOT, HUGE_FILE)).size > READ_MAX_BYTES);
});

test('a line past what one Code holds, so the page has to cut it', () => {
  const longest = Math.max(
    ...read('minified.js')
      .split('\n')
      .map((line) => line.length),
  );

  assert.ok(longest > MAX_ELEMENT_CHARS, `longest line is ${longest}`);
});

test('a Markdown block past what one Markdown element holds, so the formatted page notes it', () => {
  const lines = read('long-block.md').split('\n');
  const blocks = markdownBlocksOf(lines);
  const longest = Math.max(...blocks.map((block) => lines.slice(block.start - 1, block.end).join('\n').length));

  assert.ok(longest > MAX_ELEMENT_CHARS, `longest block is ${longest}`);
});

test("a directory with more entries than the live check's terminal has rows, so its listing is windowed", () => {
  const entries = readdirSync(join(ROOT, LONG_DIRECTORY)).length;

  assert.ok(entries > ROWS, `${entries} entries`);
});

test('a binary file, told by the same test the pane uses', () => {
  assert.equal(isBinaryText(readFileSync(join(ROOT, 'asset.bin')).toString('utf8')), true);
});

test('a Markdown file holding every block kind the renderer draws differently', () => {
  const kinds = new Set(markdownBlocksOf(read('docs/notes.md').split('\n')).map((block) => block.kind));

  assert.deepEqual([...kinds].sort(), ['code', 'heading', 'html', 'list', 'paragraph', 'quote', 'rule', 'table']);
});

test("a formatted Markdown page taller than two of the live check's windows, so a page key moves a whole one", () => {
  const lines = read('docs/notes.md').split('\n');
  const page = pageLayoutOf(markdownBlocksOf(lines), lines, OPEN_MIN_COLUMNS);

  assert.ok(page.rows > 2 * ROWS, `${page.rows} rows at ${OPEN_MIN_COLUMNS} columns`);
});

test("a paragraph one file line long and several pane rows tall, so the wrap is the pane's", () => {
  const lines = read('docs/notes.md').split('\n');
  const at = lines.findIndex((line) => line.startsWith('A paragraph written on one line'));
  const page = pageLayoutOf(markdownBlocksOf(lines), lines, OPEN_MIN_COLUMNS);
  const rows = page.blocks[markdownBlocksOf(lines).findIndex((block) => block.start === at + 1)]?.layout.rows ?? 0;

  assert.ok(rows > 1, `${rows} rows at ${OPEN_MIN_COLUMNS} columns`);
});

test('a Markdown table no pane fits, so the page must lay it out itself', () => {
  const widest = Math.max(
    ...read('docs/notes.md')
      .split('\n')
      .filter((line) => line.startsWith('| Read cap') || line.startsWith('| Element cap'))
      .map((line) => line.length),
  );

  assert.ok(widest > OPEN_MIN_COLUMNS, `${widest} characters`);
});

test('a source file with blank lines and a bracketed block to click', () => {
  const lines = read('src/report.ts').split('\n');

  assert.ok(
    lines.some((line) => line === ''),
    'blank lines are where Code used to drop rows',
  );
  assert.ok(
    lines.some((line) => line.endsWith('{')),
    'a line that opens a bracket',
  );
  assert.ok(
    lines.some((line) => line.startsWith('  ')),
    'an indented block',
  );
});

test('a directory to enter and a file to come back to', () => {
  assert.ok(statSync(join(ROOT, 'src')).isDirectory());
  assert.ok(statSync(join(ROOT, 'docs/plan.md')).isFile());
});

test('a directory that cannot be listed, so its page notes why', () => {
  assert.throws(() => readdirSync(join(ROOT, LOCKED_DIRECTORY)), { code: 'EACCES' });
});

test('a PNG the pane reads with its own header, tall enough that its box hits the row cap', () => {
  const size = pngSizeOf(readFileSync(join(ROOT, PICTURE)).toString('base64'));

  assert.ok(size !== null, 'the plugin reads the generated file as a PNG');

  const columns = OPEN_MIN_COLUMNS - PAGE_PADDING;
  const natural = Math.round(((size.height / size.width) * columns) / IMAGE_CELL_ASPECT);

  assert.ok(natural > IMAGE_MAX_ROWS, `${natural} rows at ${columns} columns`);
  assert.equal(imageBoxOf(size, columns, IMAGE_MAX_ROWS).rows, IMAGE_MAX_ROWS);
});

test('a second PNG, wide, whose box fits under the row cap at its own proportion', () => {
  const size = pngSizeOf(readFileSync(join(ROOT, WIDE_PICTURE)).toString('base64'));

  assert.ok(size !== null, 'the plugin reads the generated file as a PNG');

  const columns = OPEN_MIN_COLUMNS - PAGE_PADDING;
  const natural = Math.round(((size.height / size.width) * columns) / IMAGE_CELL_ASPECT);

  assert.ok(natural < IMAGE_MAX_ROWS, `${natural} rows at ${columns} columns`);
  assert.equal(imageBoxOf(size, columns, IMAGE_MAX_ROWS).rows, natural);
});

test('a Markdown page naming that picture on its own, and one target that leads nowhere', () => {
  const targets = imageTargetsOf(read(PICTURE_PAGE).split('\n'));

  assert.deepEqual(targets, ['./logo.png', './gone.png']);
  assert.throws(() => statSync(join(ROOT, 'docs/gone.png')), { code: 'ENOENT' });
});

test('a unified diff whose hunk is taller than the live check terminal, so a window sits inside it', () => {
  const lines = read(DIFF_FILE).split('\n');
  const header = lines.findIndex((line) => line.startsWith('@@'));

  assert.ok(isUnifiedDiff(lines), 'the plugin reads the generated file as a unified diff');
  assert.ok(lines.length - header > ROWS, `${lines.length - header} lines under the hunk header`);
});

test('a delimited file the plugin parses, with a cell that must wrap and a record of two lines', () => {
  const text = read(DATA_FILE);
  const table = delimitedTableOf(text, ',');

  assert.ok(table !== null, 'the plugin parses the generated file');

  // Nothing wrapped, the table draws three rules, one header row and one row a record.
  const drawn = tableRowsOf(table, OPEN_MIN_COLUMNS - PAGE_PADDING);

  assert.ok(drawn.length > 4 + table.rows.length, `${drawn.length} rows for ${table.rows.length} records`);

  assert.ok(
    table.records.some((record) => record.end > record.start),
    'a quoted newline, so one record covers two source lines',
  );
  assert.ok(table.records.length > ROWS, `${table.records.length} records, more than a pane draws at once`);
});

test('a .diff that is not a unified diff, holding the lines the diff grammar would colour', () => {
  const lines = read(DRAFT_DIFF).split('\n');

  assert.equal(isUnifiedDiff(lines), false, 'no hunk header, so the pane must hand Code no path');
  assert.ok(
    lines.some((line) => line.startsWith('--- ')),
    'a line the diff grammar colours, so drawing it plain is visible',
  );
});
