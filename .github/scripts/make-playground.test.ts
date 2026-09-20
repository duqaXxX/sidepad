import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isBinaryText } from '../../plugins/sidepad/hooks/files/is-binary-text';
import { OPEN_MIN_COLUMNS } from '../../plugins/sidepad/hooks/limits/columns';
import { MAX_ELEMENT_CHARS, READ_MAX_BYTES } from '../../plugins/sidepad/hooks/limits/sizes';
import { markdownBlocksOf } from '../../plugins/sidepad/hooks/markdown-blocks/markdown-blocks-of';
import { pageLayoutOf } from '../../plugins/sidepad/hooks/page-layout/page-layout-of';
import { ROWS } from './live/session';
import { HUGE_FILE, LOCKED_DIRECTORY, LONG_DIRECTORY, makePlayground, removePlayground } from './make-playground';

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
