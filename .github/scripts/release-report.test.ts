import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isMoreThanPatch, releaseReport, shippedVersionOf } from './release-report';

const release = { latest: '2.1.280', shipped: '2.1.274', outcome: 'pass' as const, lastCommented: '' };

test('the body names both versions and what the tests said', () => {
  const { body } = releaseReport(release);

  assert.match(body, /Claude Code released: \*\*2\.1\.280\*\*/);
  assert.match(body, /Declarations in this repository: \*\*2\.1\.274\*\*/);
  assert.match(body, /tests pass on 2\.1\.280/);
});

test('the body says how far the declarations are behind, without repeating the number', () => {
  assert.match(releaseReport(release).body, /\*\*2\.1\.274\*\* \(2\.1\.280 is newer\)/);
  assert.match(releaseReport({ ...release, latest: '2.1.274' }).body, /\(the same release\)/);
});

test('a patch release passes in silence: the body says it, nobody is pinged', () => {
  assert.equal(releaseReport(release).comment, null);
});

test('failing tests are worth a comment, whatever the version distance', () => {
  const { comment } = releaseReport({ ...release, latest: '2.1.275', outcome: 'fail' });

  assert.match(String(comment), /tests fail on Claude Code 2\.1\.275/);
});

test('a minor release is worth a comment even when the tests pass', () => {
  assert.match(String(releaseReport({ ...release, latest: '2.2.0' }).comment), /more than a patch release/);
});

test('the same version is not commented twice', () => {
  const twice = releaseReport({ ...release, latest: '2.2.0', lastCommented: '2.2.0' });

  assert.equal(twice.comment, null);
});

test('what counts as more than a patch', () => {
  assert.equal(isMoreThanPatch('2.1.274', '2.1.999'), false);
  assert.equal(isMoreThanPatch('2.1.274', '2.2.0'), true);
  assert.equal(isMoreThanPatch('2.1.274', '3.0.0'), true);
});

test('the shipped version is read off the declarations themselves', () => {
  assert.match(shippedVersionOf(process.cwd()), /^[0-9]+\.[0-9]+\.[0-9]+$/);
});
