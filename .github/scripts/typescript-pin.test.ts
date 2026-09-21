import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

/**
 * The plugin is type-checked twice, by `bun run typecheck` before a push and by the CI job that
 * gates a merge, and the two answers count only while they come from one compiler (#26).
 */

const ROOT = resolve(import.meta.dirname, '..', '..');

test('the CI job installs the TypeScript package.json pins', () => {
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  const pinned: string = manifest.devDependencies.typescript;
  const workflow = readFileSync(resolve(ROOT, '.github/workflows/mod-tests.yml'), 'utf8');
  const installed = workflow.match(/\btypescript@(\S+)/)?.[1];

  assert.match(pinned, /^\d+\.\d+\.\d+$/, 'package.json pins an exact version, not a range');
  assert.equal(installed, pinned);
});
