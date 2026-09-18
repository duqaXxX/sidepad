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

test('a limit that names only a version is still one Claude Code sets', () => {
  const [limit] = limitsIn('f.ts', 'plugin', '// LIMIT: the cap on 2.1.276.\nexport const cap = 1;');

  assert.equal(limit?.isEngine, true);
  assert.equal(limit?.version, '2.1.276');
});
