#!/usr/bin/env bun
/**
 * Writes docs/limits.md from the `// LIMIT:` comments in the code, the one place a limit is stated.
 * The file is a view of those comments and is never edited by hand: limits.test.ts fails while the
 * committed file differs from what this script writes.
 *
 *   bun run limits           writes docs/limits.md
 *   bun run limits --check   exits 1 when docs/limits.md is not what the comments say
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

/** Where limits are read from: the plugin's modules, then the repository's own tooling. */
const SOURCES = { plugin: 'plugins/sidepad/hooks', tooling: '.github/scripts' } as const;

export const LIMITS_DOC = 'docs/limits.md';

export type Limit = {
  /** The file, relative to the repository root. */
  path: string;
  /** The declaration the comment documents or sits in; null when the file has none around it. */
  symbol: string | null;
  /** The comment's text after `LIMIT:`, its lines joined. */
  text: string;
  /** Whether Claude Code sets it: the text names Claude Code. */
  isEngine: boolean;
  /** The Claude Code version the text names; null when it names none. */
  version: string | null;
  source: keyof typeof SOURCES;
};

const START = /^(\s*)(\/\/|\*)\s*LIMIT:\s*(.*)$/;
const DECLARATION = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let|class|type)\s+(\w+)/;
const ENGINE_VERSION = /Claude Code (\d+\.\d+\.\d+)/;

/**
 * The limits one file states. A `//` comment runs over the `//` lines under it, a doc comment's
 * over its ` * ` lines up to a blank one, a tag or its end. A doc comment names the declaration
 * after it; a line comment inside a body names the top-level declaration it sits in.
 *
 * @returns the file's limits, top to bottom
 */
export function limitsIn(path: string, source: keyof typeof SOURCES, text: string): Limit[] {
  const lines = text.split('\n');
  const limits: Limit[] = [];

  lines.forEach((line, at) => {
    const start = START.exec(line);
    if (!start) return;

    const [, indent = '', marker, first = ''] = start;
    const parts = [first.trim()];
    let end = at + 1;

    for (; end < lines.length; end += 1) {
      const next = marker === '//' ? /^\s*\/\/\s?(.*)$/.exec(lines[end]!) : /^\s*\*(?!\/)\s?(.*)$/.exec(lines[end]!);
      const body = next?.[1]?.trim();

      if (!body || body.startsWith('@') || body.startsWith('LIMIT:')) break;
      parts.push(body);
    }

    const joined = parts.join(' ');

    limits.push({
      path,
      symbol: marker === '//' && indent.length > 0 ? enclosingOf(lines, at) : followingOf(lines, end),
      text: joined,
      isEngine: /Claude Code/.test(joined),
      version: ENGINE_VERSION.exec(joined)?.[1] ?? null,
      source,
    });
  });

  return limits;
}

const followingOf = (lines: readonly string[], from: number) => {
  for (let at = from; at < lines.length; at += 1) {
    const name = DECLARATION.exec(lines[at]!)?.[1];
    if (name) return name;
  }

  return null;
};

const enclosingOf = (lines: readonly string[], from: number) => {
  for (let at = from; at >= 0; at -= 1) {
    const name = DECLARATION.exec(lines[at]!)?.[1];
    if (name) return name;
  }

  return null;
};

/** Every limit the code states, plugin first, each group by path. */
export function limitsOf(root = ROOT): Limit[] {
  return (Object.keys(SOURCES) as (keyof typeof SOURCES)[]).flatMap((source) =>
    filesUnder(join(root, SOURCES[source]))
      .sort()
      .flatMap((file) => limitsIn(relative(root, file), source, readFileSync(file, 'utf8'))),
  );
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : filesUnder(path);

    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** docs/limits.md as the limits make it. */
export function limitsDocOf(limits: readonly Limit[]): string {
  const itemOf = (limit: Limit) => {
    const where = limit.symbol ? `\`${limit.path}\`, \`${limit.symbol}\`` : `\`${limit.path}\``;

    return `- ${where}: ${limit.text}`;
  };
  const section = (title: string, intro: string, items: readonly Limit[]) =>
    items.length === 0 ? [] : [`## ${title}`, '', intro, '', ...items.map(itemOf), ''];

  return [
    '# Limits',
    '',
    'What sidepad does not do, or does only in part, and where each limit is set. The list is',
    'written by `bun run limits` from the `// LIMIT:` comments in the code: change the comment, then',
    'run it. `bun run test` fails while this file and the comments disagree.',
    '',
    'A limit Claude Code sets names the version it was measured on. `bun run probe` lists the ones',
    'measured on a version other than the one running, to measure again: a release can lift one.',
    '',
    ...section(
      'Set by Claude Code',
      'The engine decides these; sidepad draws around them.',
      limits.filter((limit) => limit.source === 'plugin' && limit.isEngine),
    ),
    ...section(
      'Set by sidepad',
      'Choices and simplifications of the plugin itself.',
      limits.filter((limit) => limit.source === 'plugin' && !limit.isEngine),
    ),
    ...section(
      'In the tooling',
      'Limits of the checks in `.github/scripts/`, not of the pane.',
      limits.filter((limit) => limit.source === 'tooling'),
    ),
  ].join('\n');
}

if (import.meta.main) {
  const doc = limitsDocOf(limitsOf());
  const path = join(ROOT, LIMITS_DOC);

  if (process.argv.includes('--check')) {
    const isCurrent = readFileSync(path, 'utf8') === doc;

    if (!isCurrent) console.error(`${LIMITS_DOC} is not what the // LIMIT: comments say: run bun run limits`);
    process.exit(isCurrent ? 0 : 1);
  }

  writeFileSync(path, doc);
  console.log(`wrote ${LIMITS_DOC}`);
}
