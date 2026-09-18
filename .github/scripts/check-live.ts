#!/usr/bin/env bun
/**
 * Drives the pane in a real terminal: writes the playground, then for each scenario starts Claude
 * Code in a pseudo-terminal with the plugin loaded from source, injects a person's input and asserts
 * on what the pane draws. It needs an authenticated Claude Code, so it runs on a person's machine
 * before a push, not in CI. No scenario runs a model turn: none spends tokens.
 *
 *   bun run check:live [scenario-id ...]
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { SCENARIOS } from './live/scenarios';
import { LiveSession } from './live/session';
import { DEFAULT_PLAYGROUND, makePlayground } from './make-playground';
import { runningVersion, SHIPPED_DECLARATIONS_FILE, writtenByVersion } from './release-report';

const PLUGIN_DIR = resolve(import.meta.dirname, '../../plugins/sidepad');

const wanted = process.argv.slice(2);
const unknown = wanted.filter((id) => !SCENARIOS.some((scenario) => scenario.id === id));

if (unknown.length > 0) {
  console.error(`no scenario ${unknown.join(', ')}; the scenarios are ${SCENARIOS.map((s) => s.id).join(', ')}`);
  process.exit(2);
}

const running = runningVersion();

if (running === null) {
  console.error('check:live needs the claude CLI');
  process.exit(2);
}

// Logged out, Claude Code never reaches an empty prompt and every scenario fails the same way,
// which reads as a regression. `claude auth status` exits non-zero when nobody is logged in.
if (spawnSync('claude', ['auth', 'status'], { stdio: 'ignore' }).status !== 0) {
  console.error('check:live needs a Claude Code you are logged in to: run claude auth login');
  process.exit(2);
}

const declared = writtenByVersion(SHIPPED_DECLARATIONS_FILE);

console.log(`Claude Code ${running}; the plugin's declarations were written by ${declared}`);
if (running !== declared) {
  console.log('  the versions differ: a failure below may be the engine moving rather than the plugin');
}

const root = makePlayground(DEFAULT_PLAYGROUND);
const scenarios = SCENARIOS.filter((scenario) => wanted.length === 0 || wanted.includes(scenario.id));
let failed = 0;

console.log(`playground: ${root}\n`);

for (const scenario of scenarios) {
  const started = Date.now();
  let session: LiveSession | null = null;
  let restore: (() => void) | undefined;

  try {
    restore = scenario.prepare?.(root);
    session = await LiveSession.start(root, PLUGIN_DIR);
    await scenario.run(session);
    console.log(`ok    ${scenario.id} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL  ${scenario.id}: ${scenario.title}`);
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    session?.stop();
    restore?.();
  }
}

console.log(`\n${scenarios.length - failed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
