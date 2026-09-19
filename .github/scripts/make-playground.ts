#!/usr/bin/env bun
/**
 * Builds a synthetic project to try sidepad on, and prints the command that opens it.
 *
 * Every size here is derived from the plugin's own limits rather than written down, so the
 * playground cannot quietly stop crossing them: raise MAX_ELEMENT_CHARS and the long line grows
 * with it. What the generated project must exercise is asserted in make-playground.test.ts.
 *
 * Nothing in it comes from a real project, which is what makes a screenshot of it publishable:
 * the pane draws file contents and a file tree.
 *
 *   bun run playground [dir]
 */
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { MAX_ELEMENT_CHARS, READ_MAX_BYTES } from '../../plugins/sidepad/hooks/limits/sizes';

/** Where the playground goes when no directory is named: the runner's sessions trust this one. */
export const DEFAULT_PLAYGROUND = join(process.env.TMPDIR ?? '/tmp', 'sidepad-playground');

/** A file past what `$.fs.read` returns is read one window at a time; this one is comfortably past. */
const HUGE_BYTES = Math.ceil(READ_MAX_BYTES * 1.5);

/** A line the engine would refuse inside one `Code`, so the page has to cut it. */
const LONG_LINE_CHARS = Math.ceil(MAX_ELEMENT_CHARS * 1.5);

/** A Markdown block the engine would refuse, so the formatted page draws its note instead. */
const LONG_BLOCK_CHARS = Math.ceil(MAX_ELEMENT_CHARS * 1.2);

/** A directory with no permissions, so listing it fails and its page notes why. */
export const LOCKED_DIRECTORY = 'locked';

/** A directory with more entries than a pane has rows, so its listing is drawn a window at a time. */
export const LONG_DIRECTORY = 'many';

/** Past the rows of any terminal the live check or a person is likely to use. */
const LONG_DIRECTORY_ENTRIES = 120;

/** The file past the read cap, read a window at a time. */
export const HUGE_FILE = 'huge.log';

/**
 * Deletes a playground, the locked directory opened first: removing it fails while it stays unreadable.
 *
 * @param root the playground's directory; nothing happens when it is absent
 */
export function removePlayground(root: string) {
  if (existsSync(join(root, LOCKED_DIRECTORY))) {
    chmodSync(join(root, LOCKED_DIRECTORY), 0o755);
  }

  rmSync(root, { recursive: true, force: true });
}

/** The lines of a source file with blank lines, nested brackets and paragraphs: what a click cuts. */
function reportSource(): string {
  const lines = ['import { total } from "./total";', ''];

  for (let step = 1; step <= 45; step += 1) {
    const number = String(step).padStart(3, '0');

    lines.push(
      `export function step${number}(values: number[]) {`,
      '  const sum = total(',
      '    values,',
      '  );',
      '',
      `  log("step ${step}", sum);`,
      '  return sum;',
      '}',
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

/** Markdown holding every block kind the renderer draws differently. */
const NOTES = [
  '# Synthetic notes',
  '',
  'A paragraph',
  'on two lines.',
  '',
  '| column | value |',
  '|---|---|',
  '| alpha | 1 |',
  '| beta | 2 |',
  '',
  '- one item',
  '- two items',
  '',
  '```ts',
  'const a = 1;',
  '',
  'const b = 2;',
  '```',
  '',
  '> A quoted line.',
  '',
  '---',
  '',
  // The blocks a regex cutter reads wrong: a setext heading, an HTML block, and a list item a line
  // continues without indenting it.
  'A setext heading',
  '================',
  '',
  '<details>',
  '<summary>A raw HTML block</summary>',
  '</details>',
  '',
  '- a list item',
  'continued on the next line',
  '',
  // A table no pane fits: its widest row passes the width the pane needs to open at all.
  '| Limit | Set by | Measured on |',
  '|:--|:-:|--:|',
  '| Read cap | sidepad | a file past 4 MiB is read one window of lines at a time and never whole, so a page of it is what the pane holds |',
  '| Element cap | Claude Code | one Markdown element holds at most 10,000 characters of source, and a longer block draws a note instead |',
  '',
  'The last paragraph.',
  '',
].join('\n');

/**
 * Writes the playground.
 *
 * @param dir where it goes; anything already there is replaced
 * @returns the directory written
 */
export function makePlayground(dir: string): string {
  const root = resolve(dir);

  removePlayground(root);
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'docs'), { recursive: true });

  writeFileSync(join(root, 'src/report.ts'), reportSource());
  writeFileSync(
    join(root, 'src/total.ts'),
    'export const total = (values: number[]) => values.reduce((a, b) => a + b, 0);\n',
  );
  writeFileSync(join(root, 'docs/notes.md'), NOTES);
  writeFileSync(join(root, 'docs/plan.md'), '# Plan\n\nA synthetic plan file.\n');

  // One line no pane is wide enough to show, and longer than one `Code` may hold.
  const pairs = Math.ceil(LONG_LINE_CHARS / 12);
  const minified = `const data = {${Array.from({ length: pairs }, (_, at) => `"key${at}":${at}`).join(',')}};`;

  writeFileSync(join(root, 'minified.js'), `${minified}\nconst after = 1;\n`);
  writeFileSync(
    join(root, 'long-block.md'),
    `# Title\n\nA short paragraph.\n\n${'z'.repeat(LONG_BLOCK_CHARS)}\n\nThe paragraph after it.\n`,
  );

  // Past the read cap: this one is read a window at a time, with a line count first.
  const line = 'line of the synthetic large file with some padding to widen it';
  const rows = Math.ceil(HUGE_BYTES / (line.length + 8));

  writeFileSync(join(root, HUGE_FILE), Array.from({ length: rows }, (_, at) => `${at + 1} ${line}`).join('\n'));

  // A binary file: the page says so instead of drawing it. A NUL is what tells one.
  writeFileSync(join(root, 'asset.bin'), Buffer.from(Array.from({ length: 4096 }, (_, at) => at % 256)));

  // A listing taller than the pane: the arrows walk it past its first window.
  mkdirSync(join(root, LONG_DIRECTORY));
  for (let at = 1; at <= LONG_DIRECTORY_ENTRIES; at += 1) {
    writeFileSync(join(root, LONG_DIRECTORY, `file-${String(at).padStart(3, '0')}.txt`), `entry ${at}\n`);
  }

  // A directory nobody but root can list: the engine refuses it, and the page says why.
  mkdirSync(join(root, LOCKED_DIRECTORY));
  chmodSync(join(root, LOCKED_DIRECTORY), 0o000);

  return root;
}

if (import.meta.main) {
  const root = makePlayground(process.argv[2] ?? DEFAULT_PLAYGROUND);
  const plugin = resolve(import.meta.dirname, '../../plugins/sidepad');

  console.log(`playground: ${root}`);
  console.log(`  a line of ${LONG_LINE_CHARS} characters, a Markdown block of ${LONG_BLOCK_CHARS},`);
  console.log(`  a file of about ${(HUGE_BYTES / 1_000_000).toFixed(1)} MB, a binary one,`);
  console.log(`  a directory taller than the pane (${LONG_DIRECTORY}/),`);
  console.log(`  and a directory that cannot be listed (${LOCKED_DIRECTORY}/)`);
  console.log('');
  console.log('Open it with:');
  console.log(`  cd ${root} && CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir ${plugin}`);
  console.log('Then type /sidepad');
}
