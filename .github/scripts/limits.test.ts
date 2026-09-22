import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { LIMITS_DOC, limitsDocOf, limitsIn, limitsOf } from './limits';

const ROOT = resolve(import.meta.dirname, '../..');

test('docs/limits.md is what the // LIMIT: comments say: run bun run limits after changing one', () => {
  assert.equal(readFileSync(join(ROOT, LIMITS_DOC), 'utf8'), limitsDocOf(limitsOf()));
});

test('a limit Claude Code sets names the version it was measured on, so the probe can ask again', () => {
  const unversioned = limitsOf()
    .filter((limit) => limit.isEngine && limit.version === null)
    .map((limit) => `${limit.path}: ${limit.text}`);

  assert.deepEqual(unversioned, []);
});

test('a limit writes a version as Claude Code <version>, and a number with commas, so none is misread', () => {
  const bare = limitsOf()
    .filter((limit) => /(?<!Claude Code )\b\d+\.\d+\.\d+\b/.test(limit.text))
    .map((limit) => `${limit.path}: ${limit.text}`);

  assert.deepEqual(bare, []);
});

test('a doc comment runs to its blank line and names the declaration after it', () => {
  const source = [
    '/**',
    ' * What it does.',
    ' *',
    ' * LIMIT: a first line',
    ' * and its second.',
    ' *',
    ' * @returns nothing',
    ' */',
    'export function drawn(): void {}',
  ].join('\n');

  assert.deepEqual(limitsIn('a.ts', 'plugin', source), [
    {
      path: 'a.ts',
      symbol: 'drawn',
      id: null,
      text: 'a first line and its second.',
      isEngine: false,
      version: null,
      source: 'plugin',
    },
  ]);
});

test('a line comment inside a body names the declaration it sits in, and reads the version', () => {
  const source = [
    'export async function run(): Promise<void> {',
    '  // LIMIT: Claude Code 2.1.277 covers',
    '  // the pane.',
    '  const after = 1;',
    '}',
  ].join('\n');
  const [limit] = limitsIn('b.ts', 'plugin', source);

  assert.equal(limit?.symbol, 'run');
  assert.equal(limit?.text, 'Claude Code 2.1.277 covers the pane.');
  assert.equal(limit?.version, '2.1.277');
});

test('an id written as LIMIT(id): is read, and the text starts after it', () => {
  const [limit] = limitsIn(
    'h.ts',
    'plugin',
    '// LIMIT(wheel-reversal): Claude Code 2.1.280 drops a tick.\nexport const x = 1;',
  );

  assert.deepEqual([limit?.id, limit?.text], ['wheel-reversal', 'Claude Code 2.1.280 drops a tick.']);
});

test('an id is lowercase words joined by hyphens', () => {
  const malformed = limitsOf()
    .filter((limit) => limit.id !== null && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(limit.id))
    .map((limit) => `${limit.path}: ${limit.id}`);

  assert.deepEqual(malformed, []);
});

test('a malformed id is still read, so its limit is not lost', () => {
  const [limit] = limitsIn(
    'i.ts',
    'plugin',
    '// LIMIT(Wheel_Reversal): Claude Code 2.1.280 drops a tick.\nexport const x = 1;',
  );

  assert.equal(limit?.id, 'Wheel_Reversal');
});

test('a line that only mentions LIMIT: is not a limit', () => {
  assert.deepEqual(limitsIn('c.ts', 'plugin', '// The `// LIMIT:` comments are read here.\nconst x = 1;'), []);
});

test('a comment on a method names the method, and one inside it names the method too', () => {
  const source = [
    'export class Pane {',
    '  /** LIMIT: draws one row. */',
    '  draw(): void {',
    '    // LIMIT: counts',
    '    // code points.',
    '    const at = 1;',
    '  }',
    '}',
    'export const after = 1;',
  ].join('\n');

  assert.deepEqual(
    limitsIn('d.ts', 'plugin', source).map(({ symbol, text }) => ({ symbol, text })),
    [
      { symbol: 'draw', text: 'draws one row.' },
      { symbol: 'draw', text: 'counts code points.' },
    ],
  );
});

test('a function nested in another is the one a comment inside it names', () => {
  const source = [
    'export function outer(): void {',
    '  const inner = () => {',
    '    // LIMIT: inner only.',
    '  };',
    '}',
  ].join('\n');

  assert.equal(limitsIn('e.ts', 'plugin', source)[0]?.symbol, 'inner');
});

test('a version counts only after Claude Code: a dotted number alone is not one', () => {
  const [bytes] = limitsIn('f.ts', 'plugin', '// LIMIT: reads up to 4.194.304 bytes.\nexport const cap = 1;');
  const [named] = limitsIn('g.ts', 'plugin', '// LIMIT: the cap on Claude Code 2.1.276.\nexport const cap = 1;');

  assert.deepEqual([bytes?.isEngine, bytes?.version], [false, null]);
  assert.deepEqual([named?.isEngine, named?.version], [true, '2.1.276']);
});
