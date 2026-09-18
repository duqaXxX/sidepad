#!/usr/bin/env bun
/**
 * What the release watch says about a Claude Code release, and whether it is worth a notification.
 *
 * The body is rewritten on every run, so the issue always shows the current state; editing a body
 * notifies nobody. A comment is added only when there is something to do, because Claude Code ships
 * about one version a day and an issue that pings daily is an issue people mute.
 *
 *   bun .github/scripts/release-report.ts        # reads LATEST, SHIPPED, OUTCOME, LAST_COMMENTED
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** How the plugin's own tests went against the release. */
export type Outcome = 'pass' | 'fail' | 'skipped';

export type Release = {
  /** The version npm serves as latest. */
  latest: string;
  /** The version the declarations in this repository were written by. */
  shipped: string;
  outcome: Outcome;
  /** The version the issue last commented about, empty when it has not. */
  lastCommented: string;
};

/** A version as its numbers, missing parts read as 0. */
const partsOf = (version: string) => version.split('.').map((part) => Number.parseInt(part, 10) || 0);

/**
 * Whether two versions differ by more than their last number.
 *
 * @returns true when the major or the minor moved
 */
export function isMoreThanPatch(from: string, to: string): boolean {
  const [fromMajor = 0, fromMinor = 0] = partsOf(from);
  const [toMajor = 0, toMinor = 0] = partsOf(to);

  return fromMajor !== toMajor || fromMinor !== toMinor;
}

/**
 * What the watch writes for one run.
 *
 * @returns the issue's body, and whether this release is worth a comment and why
 */
export function releaseReport(release: Release): { body: string; comment: string | null } {
  const { latest, shipped, outcome, lastCommented } = release;
  const behind = latest === shipped ? 'the same release' : `${latest} is newer`;
  const verdict =
    outcome === 'pass'
      ? `The plugin's tests pass on ${latest}.`
      : outcome === 'fail'
        ? `The plugin's tests FAIL on ${latest}.`
        : `This release has no \`claude plugin test\`, so the tests did not run.`;

  const body = [
    '<!-- Rewritten by the release watch on every run. Close this issue once the release it names',
    '     has been looked at: the next release opens a fresh one. -->',
    '',
    `Claude Code released: **${latest}**`,
    `Declarations in this repository: **${shipped}** (${behind})`,
    '',
    verdict,
    '',
    'What the tests cover is the hooks module through the official kit. They do not drive a `Client`,',
    "a pointer, a person's close, or the caps the engine applies while drawing, so a release can move",
    'a measured fact without a test noticing. The comparison of the declarations, and the live checks,',
    'are the part a person runs.',
    '',
    `- [ ] Run \`/plugin-types\` in Claude Code ${latest}, then \`bun run probe\`: it compares the declarations and runs the tests and live checks`,
    '- [ ] Repeat the live checks that the comparison puts in doubt',
    '- [ ] Record what changed, and what is new that sidepad could use',
  ].join('\n');

  const reason =
    outcome === 'fail'
      ? `The plugin's tests fail on Claude Code ${latest}.`
      : isMoreThanPatch(shipped, latest)
        ? `Claude Code ${latest} is more than a patch release past the ${shipped} this repository was measured on.`
        : null;

  return { body, comment: reason !== null && lastCommented !== latest ? reason : null };
}

/** The engine declarations this repository builds against, from its root. */
export const SHIPPED_DECLARATIONS = 'plugins/types/claude-code.d.ts';

/**
 * The version a declarations file was written by, read off its first line.
 *
 * @returns the version, or `unknown` when the line does not name one
 */
export function writtenByVersion(file: string): string {
  const first = readFileSync(file, 'utf8').split('\n')[0] ?? '';

  return /Claude Code ([0-9]+\.[0-9]+\.[0-9]+)/.exec(first)?.[1] ?? 'unknown';
}

if (import.meta.main) {
  const report = releaseReport({
    latest: process.env.LATEST ?? 'unknown',
    shipped: process.env.SHIPPED ?? writtenByVersion(join(process.cwd(), SHIPPED_DECLARATIONS)),
    outcome: (process.env.OUTCOME as Outcome) ?? 'skipped',
    lastCommented: process.env.LAST_COMMENTED ?? '',
  });

  console.log(JSON.stringify(report));
}
