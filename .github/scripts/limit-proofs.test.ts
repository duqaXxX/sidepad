import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { shapesOf } from './compare-declarations';
import { LIMIT_PROOFS } from './limit-proofs';
import { limitsOf } from './limits';
import { LIMIT_SCENARIOS } from './live/limit-scenarios';
import { SCENARIOS } from './live/scenarios';
import { SHIPPED_DECLARATIONS_FILE } from './release-report';

// A limit is one release's behaviour: without a check to run again it goes stale unnoticed, which is
// what this map exists to prevent. It is keyed on the limit's own id, so a limit added without a
// proof is red here, and so is a proof whose limit, scenario or declaration is gone.
const engineLimits = limitsOf().filter((limit) => limit.isEngine);
const declarations = shapesOf(readFileSync(SHIPPED_DECLARATIONS_FILE, 'utf8'));

/** Whether a dotted path such as `CodeProps.format` names a declaration or one of its members. */
function isDeclared(path: string): boolean {
  const [name, ...members] = path.split('.');
  let shape = declarations.get(name!);

  for (const member of members) shape = shape?.members?.get(member);

  return shape !== undefined;
}

test('every limit Claude Code sets carries an id: LIMIT(id):', () => {
  assert.deepEqual(
    engineLimits.filter((limit) => limit.id === null).map((limit) => `${limit.path}: ${limit.text}`),
    [],
  );
});

test('no two limits share an id', () => {
  const ids = limitsOf().flatMap((limit) => (limit.id ? [limit.id] : []));

  assert.deepEqual(
    ids.filter((id, at) => ids.indexOf(id) !== at),
    [],
  );
});

test('every limit Claude Code sets names what proves it', () => {
  const missing = engineLimits.filter((limit) => limit.id && (LIMIT_PROOFS[limit.id] ?? []).length === 0);

  assert.deepEqual(
    missing.map((limit) => limit.id),
    [],
    'add an entry to .github/scripts/limit-proofs.ts',
  );
});

test('every entry names a limit Claude Code sets', () => {
  const ids = new Set(engineLimits.map((limit) => limit.id));

  assert.deepEqual(
    Object.keys(LIMIT_PROOFS).filter((id) => !ids.has(id)),
    [],
  );
});

test('every proof resolves: a scenario the runner has, a declared path, a model turn naming its part', () => {
  const scenarios = new Set([...SCENARIOS, ...LIMIT_SCENARIOS].map((scenario) => scenario.id));
  const broken: string[] = [];

  for (const [id, proofs] of Object.entries(LIMIT_PROOFS)) {
    for (const proof of proofs) {
      if ('live' in proof && !scenarios.has(proof.live)) broken.push(`${id}: no scenario ${proof.live}`);
      if ('declaration' in proof && !isDeclared(proof.declaration)) broken.push(`${id}: no ${proof.declaration}`);
      if ('modelTurn' in proof && proof.modelTurn.trim() === '') broken.push(`${id}: model turn naming no part`);
    }
  }

  assert.deepEqual(broken, []);
});

test('every limit scenario is claimed by a limit', () => {
  const claimed = new Set(
    Object.values(LIMIT_PROOFS)
      .flat()
      .flatMap((proof) => ('live' in proof ? [proof.live] : [])),
  );

  assert.deepEqual(
    LIMIT_SCENARIOS.map((scenario) => scenario.id).filter((id) => !claimed.has(id)),
    [],
  );
});

test('limit scenarios and feature scenarios do not share an id', () => {
  const features = new Set(SCENARIOS.map((scenario) => scenario.id));

  assert.deepEqual(
    LIMIT_SCENARIOS.map((scenario) => scenario.id).filter((id) => features.has(id)),
    [],
  );
});
