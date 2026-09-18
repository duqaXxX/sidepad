import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { FEATURE_PROOFS } from './feature-proofs';
import { SCENARIOS } from './live/scenarios';

// A feature with nothing claiming to prove it is the gap this map exists to show, so the map is
// keyed on the reference itself: a section added to docs/features.md is red here until it names
// its proof, and a name that no longer resolves is red too, since a stale proof reads as a real one.
const ROOT = resolve(import.meta.dirname, '..', '..');

/** The `##` headings of a Markdown document, fenced blocks skipped. */
function sectionsOf(markdown: string): string[] {
  const sections: string[] = [];
  let isFenced = false;

  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) isFenced = !isFenced;
    const heading = isFenced ? null : /^## (.+)$/.exec(line);
    if (heading) sections.push(heading[1]!.trim());
  }

  return sections;
}

const sections = sectionsOf(readFileSync(join(ROOT, 'docs/features.md'), 'utf8'));

test('the reference has sections to key on', () => {
  assert.ok(sections.length > 0, 'no ## heading found in docs/features.md');
});

test('every section of docs/features.md names what proves it', () => {
  const missing = sections.filter((section) => (FEATURE_PROOFS[section] ?? []).length === 0);

  assert.deepEqual(missing, [], 'add an entry to .github/scripts/feature-proofs.ts');
});

test('every entry names a section that exists', () => {
  const stale = Object.keys(FEATURE_PROOFS).filter((section) => !sections.includes(section));

  assert.deepEqual(stale, []);
});

test('every proof resolves: a test file on disk, a scenario the runner has, a manual with its reason', () => {
  const scenarios = new Set(SCENARIOS.map((scenario) => scenario.id));
  const broken: string[] = [];

  for (const [section, proofs] of Object.entries(FEATURE_PROOFS)) {
    for (const proof of proofs) {
      if ('test' in proof && !(proof.test.endsWith('.test.ts') && existsSync(join(ROOT, proof.test)))) {
        broken.push(`${section}: no test file ${proof.test}`);
      }
      if ('live' in proof && !scenarios.has(proof.live)) broken.push(`${section}: no scenario ${proof.live}`);
      if ('manual' in proof && proof.manual.trim() === '') broken.push(`${section}: manual with no reason`);
    }
  }

  assert.deepEqual(broken, []);
});

test('every scenario the runner has is claimed by a section', () => {
  const claimed = new Set(
    Object.values(FEATURE_PROOFS)
      .flat()
      .flatMap((proof) => ('live' in proof ? [proof.live] : [])),
  );

  assert.deepEqual(
    SCENARIOS.map((scenario) => scenario.id).filter((id) => !claimed.has(id)),
    [],
  );
});

test('a section with a new heading is caught, and fenced headings are not sections', () => {
  assert.deepEqual(sectionsOf('# Title\n\n## One\n\n```\n## Not one\n```\n\n## Two\n'), ['One', 'Two']);
});
