#!/usr/bin/env bun
/**
 * What a new Claude Code version changed for sidepad, in one run: the version against the one the
 * declarations were written by, what moved in the declarations, the plugin's tests and validation,
 * the live checks, the limits Claude Code set that were measured on another version, and what is
 * still checked by hand.
 *
 * The comparison needs the declarations of the running version, which only the REPL writes: run
 * `/plugin-types` in Claude Code started in this directory, then the probe. Without them, or when
 * they were written by another version, it says so and runs the rest.
 *
 * It exits 0 when everything ran and held, 1 when a check failed, and 2 when a check could not run
 * here: a missing claude CLI, and the declarations not being there to compare. A green run that skipped
 * the comparison would otherwise read as a release that moved nothing.
 *
 *   bun run probe
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareDeclarations } from './compare-declarations';
import { FEATURE_PROOFS } from './feature-proofs';
import { limitsOf } from './limits';
import { runningVersion, SHIPPED_DECLARATIONS, SHIPPED_DECLARATIONS_FILE, writtenByVersion } from './release-report';

const ROOT = resolve(import.meta.dirname, '../..');
/** Where `/plugin-types` writes the declarations of the build that ran it. */
const FRESH_DECLARATIONS = resolve(ROOT, '.claude/types/claude-code.d.ts');
const ENV = { ...process.env, CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: '1' };
/** The exit code for a check that could not run on this machine, as `check-live.ts` uses it. */
const CANNOT_RUN = 2;

/** Runs a command quietly and prints its output only when it fails: 112 passing tests are noise. */
function step(argv: string[]): boolean {
  const run = spawnSync(argv[0]!, argv.slice(1), { cwd: ROOT, env: ENV, encoding: 'utf8' });
  const passed = run.status === 0;

  console.log(`${passed ? 'ok  ' : 'FAIL'}  ${argv.join(' ')}`);
  if (!passed) console.log(`${run.stdout ?? ''}${run.stderr ?? run.error?.message ?? ''}`.trimEnd());

  return passed;
}

const running = runningVersion();

if (running === null) {
  console.error('the probe needs the claude CLI');
  process.exit(CANNOT_RUN);
}

const shipped = writtenByVersion(SHIPPED_DECLARATIONS_FILE);
/** What did not run, repeated in the verdict: a note halfway up the output is a note nobody reads. */
const skipped: string[] = [];

console.log(`Claude Code ${running}; the declarations in ${SHIPPED_DECLARATIONS} were written by ${shipped}`);

console.log('\n## What moved in the declarations\n');
if (!existsSync(FRESH_DECLARATIONS)) {
  console.log(
    `No declarations at .claude/types/. Run /plugin-types in Claude Code ${running} here, then the probe again.`,
  );
  skipped.push('the declarations were not compared: .claude/types/ has none');
} else if (writtenByVersion(FRESH_DECLARATIONS) !== running) {
  console.log(
    `.claude/types/ holds the declarations of ${writtenByVersion(FRESH_DECLARATIONS)}, not ${running}. Run /plugin-types again.`,
  );
  skipped.push(`the declarations were not compared: .claude/types/ holds ${writtenByVersion(FRESH_DECLARATIONS)}`);
} else {
  console.log(compareDeclarations(SHIPPED_DECLARATIONS_FILE, FRESH_DECLARATIONS));
}

console.log('\n## Still works\n');
const results = [
  step(['claude', 'plugin', 'test', 'plugins/sidepad']),
  step(['claude', 'plugin', 'validate', 'plugins/sidepad', '--strict']),
  step(['claude', 'plugin', 'validate', '.', '--strict']),
];

console.log('\n## In a real terminal\n');
const live = spawnSync('bun', ['.github/scripts/check-live.ts'], { cwd: ROOT, stdio: 'inherit' }).status;

// check-live.ts exits 2 for what this machine lacks (the claude CLI, or a login), which is not the
// release regressing, and prints which.
if (live === CANNOT_RUN) skipped.push('the live checks could not run on this machine: check:live says why above');
else results.push(live === 0);

// A release can lift a limit as quietly as it can break a fact: each one measured on an older
// version is to be measured again, and its `// LIMIT:` comment updated with what that finds.
console.log(`\n## Limits measured on a version other than ${running}\n`);
const toMeasure = limitsOf().filter((limit) => limit.isEngine && limit.version !== running);

if (toMeasure.length === 0) console.log('none');
for (const limit of toMeasure) console.log(`- ${limit.version} ${limit.path} ${limit.symbol ?? ''}: ${limit.text}`);

console.log('\n## By hand: what only a model turn reaches\n');
for (const [section, proofs] of Object.entries(FEATURE_PROOFS)) {
  for (const proof of proofs) if ('modelTurn' in proof) console.log(`- ${section}: ${proof.modelTurn}`);
}

const held = results.every(Boolean);

console.log('\n## Verdict\n');
for (const note of skipped) console.log(`skip  ${note}`);
console.log(held ? 'ok    every check that ran held' : 'FAIL  a check above failed');

process.exit(held ? (skipped.length > 0 ? CANNOT_RUN : 0) : 1);
