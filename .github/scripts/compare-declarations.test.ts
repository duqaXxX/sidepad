import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { type Change, compareShapes, differingParts, formatChanges, shapesOf } from './compare-declarations';
import { SHIPPED_DECLARATIONS } from './release-report';

// The real declarations, edited the way a release edits them: a fixture written for the test would
// only have the shapes the test's author thought of.
const shipped = readFileSync(SHIPPED_DECLARATIONS, 'utf8');
const shippedShapes = shapesOf(shipped);

/** The shipped file with each edit applied, failing when an edit's text is not in it. */
function edited(...edits: [from: string, to: string][]): string {
  return edits.reduce((text, [from, to]) => {
    assert.equal(text.split(from).length, 2, `expected exactly one ${JSON.stringify(from)}`);
    return text.replace(from, to);
  }, shipped);
}

const compared = (after: string) => compareShapes(shippedShapes, shapesOf(after));
const kinds = (changes: Change[]) => changes.map((change) => `${change.kind} ${change.path}`);

test('the declarations compared with themselves have no difference', () => {
  assert.deepEqual(compared(shipped), []);
  assert.equal(formatChanges([]), 'No difference.');
});

test('a member of a $ noun removed, added and changed is named by its path', () => {
  const changes = compared(
    edited(
      ['          panes: () => Promise<readonly UiPane[]>;\n', ''],
      ['      fs: {\n', '      fs: {\n          watch: (path: string) => Promise<void>;\n'],
      ['log: (text: string, options?: UiLogOptions) => void;', 'log: (text: string) => void;'],
    ),
  );

  assert.deepEqual(kinds(changes), [
    'added CoreEngineInterface.fs.watch',
    'changed CoreEngineInterface.ui.log',
    'removed CoreEngineInterface.ui.panes',
  ]);
});

test('an event added to the engine is named under its map', () => {
  const changes = compared(
    edited([
      "      'session.end': SessionEndInput;\n",
      "      'session.end': SessionEndInput;\n      'pane.close': NoArgs;\n",
    ]),
  );

  assert.deepEqual(kinds(changes), ["added EngineEventOf.'pane.close'"]);
});

test('a JSDoc that changes alone is a documentation change, and formatting is none', () => {
  const changes = compared(
    edited(
      ['wraps or truncates, as its Text', 'is cut at this width, as its Text'],
      ['  export type RenderViewport = {\n      /**', '  export type RenderViewport = {\n\n      /**'],
    ),
  );

  assert.deepEqual(kinds(changes), ['docs RenderViewport.columns']);
});

test('a changed signature is shown by the part that differs', () => {
  const was = `log: (text: string) => void; ${'x'.repeat(100)}`;
  const now = `log: (text: string, options?: UiLogOptions) => void; ${'x'.repeat(100)}`;
  const [before, after] = differingParts(was, now);

  assert.ok(before.length < was.length && after.includes('options?: UiLogOptions'));
  assert.ok(before.endsWith('…') && after.endsWith('…'));
});
