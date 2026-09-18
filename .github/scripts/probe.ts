#!/usr/bin/env bun
/**
 * What a new Claude Code version changed for sidepad, in one run: the version against the one the
 * declarations were written by, what moved in the declarations, the plugin's tests and validation,
 * the live checks, and what is still checked by hand.
 *
 * The comparison needs the declarations of the running version, which only the REPL writes: run
 * `/plugin-types` in Claude Code started in this directory, then the probe. Without them, or when
 * they were written by another version, it says so and runs the rest.
 *
 *   bun run probe
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareDeclarations } from './compare-declarations';
import { FEATURE_PROOFS } from './feature-proofs';
import { SHIPPED_DECLARATIONS, writtenByVersion } from './release-report';

const ROOT = resolve(import.meta.dirname, '../..');
/** Where `/plugin-types` writes the declarations of the build that ran it. */
const FRESH_DECLARATIONS = resolve(ROOT, '.claude/types/claude-code.d.ts');
const SHIPPED = resolve(ROOT, SHIPPED_DECLARATIONS);
const ENV = { ...process.env, CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: '1' };

/** Runs a command quietly and prints its output only when it fails: 112 passing tests are noise. */
function step(argv: string[]): boolean {
  const run = spawnSync(argv[0]!, argv.slice(1), { cwd: ROOT, env: ENV, encoding: 'utf8' });
  const passed = run.status === 0;

  console.log(`${passed ? 'ok  ' : 'FAIL'}  ${argv.join(' ')}`);
  if (!passed) console.log(`${run.stdout ?? ''}${run.stderr ?? run.error?.message ?? ''}`.trimEnd());

  return passed;
}

const running = spawnSync('claude', ['--version'], { encoding: 'utf8' }).stdout?.split(' ')[0] || null;

if (running === null) {
  console.error('the probe needs the claude CLI');
  process.exit(2);
}

const shipped = writtenByVersion(SHIPPED);

console.log(`Claude Code ${running}; the declarations in ${SHIPPED_DECLARATIONS} were written by ${shipped}`);

console.log('\n## What moved in the declarations\n');
if (!existsSync(FRESH_DECLARATIONS)) {
  console.log(
    `No declarations at .claude/types/. Run /plugin-types in Claude Code ${running} here, then the probe again.`,
  );
} else if (writtenByVersion(FRESH_DECLARATIONS) !== running) {
  console.log(
    `.claude/types/ holds the declarations of ${writtenByVersion(FRESH_DECLARATIONS)}, not ${running}. Run /plugin-types again.`,
  );
} else {
  console.log(compareDeclarations(SHIPPED, FRESH_DECLARATIONS));
}

console.log('\n## Still works\n');
const results = [
  step(['claude', 'plugin', 'test', 'plugins/sidepad']),
  step(['claude', 'plugin', 'validate', 'plugins/sidepad', '--strict']),
  step(['claude', 'plugin', 'validate', '.', '--strict']),
];

console.log('\n## In a real terminal\n');
results.push(spawnSync('bun', ['.github/scripts/check-live.ts'], { cwd: ROOT, stdio: 'inherit' }).status === 0);

console.log('\n## By hand: what nothing automated reaches\n');
for (const [section, proofs] of Object.entries(FEATURE_PROOFS)) {
  for (const proof of proofs) if ('manual' in proof) console.log(`- ${section}: ${proof.manual}`);
}

process.exit(results.every(Boolean) ? 0 : 1);
