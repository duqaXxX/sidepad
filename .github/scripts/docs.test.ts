import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';

/**
 * What a documentation set rots into, checked mechanically.
 *
 * A claim in a doc usually goes false because the code grew around it, and no diff ever touches
 * the sentence. So these checks run over the WHOLE doc set on every test run, deterministically.
 */

const ROOT = resolve(import.meta.dirname, '..', '..');

/**
 * Every markdown file in the repo that git does not ignore, tracked or not. Untracked files count
 * because a new doc is exactly the one that has not been committed yet; scratch files never live in
 * this repo, so there is nothing to exclude them from.
 */
function repoMarkdown(): string[] {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.md'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((f) => f && existsSync(join(ROOT, f)));
}

/** The changelog is a historical record: the prose rules below do not apply to it. */
const isChangelog = (f: string) => f.includes('CHANGELOG');

/**
 * GitHub's own heading slug: lowercase, drop punctuation, and map EACH remaining space to a
 * hyphen (runs are not collapsed). Duplicates get `-1`, `-2`.
 */
function anchorsOf(markdown: string): Set<string> {
  const out = new Set<string>();
  const seen = new Map<string, number>();
  for (const line of markdown.split('\n')) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (!m) continue;
    const base = m[1]!
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .toLowerCase()
      .replace(/`/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/ /g, '-');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.add(n === 0 ? base : `${base}-${n}`);
  }
  return out;
}

/** `../../issues` and friends resolve against the repository URL on github.com, not on disk. */
const isGithubRelative = (target: string) => /^(\.\.\/)+(issues|releases|security|pulls|wiki)(\/|$)/.test(target);

/** A line with its inline code blanked: what backticks quote is a literal, never a link to follow. */
const withoutCode = (line: string) => line.replace(/`[^`]*`/g, (span) => ' '.repeat(span.length));

const links = (markdown: string): Array<{ line: number; target: string }> => {
  const out: Array<{ line: number; target: string }> = [];
  markdown.split('\n').forEach((raw, i) => {
    for (const m of withoutCode(raw).matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      out.push({ line: i + 1, target: m[1]! });
    }
  });
  return out;
};

test('every link in a doc resolves, and so does every anchor', () => {
  const files = repoMarkdown();
  assert.ok(files.includes('README.md'), 'the file list itself must not come back empty');
  const anchors = new Map(files.map((f) => [f, anchorsOf(readFileSync(join(ROOT, f), 'utf8'))]));
  const broken: string[] = [];

  for (const f of files) {
    for (const { line, target } of links(readFileSync(join(ROOT, f), 'utf8'))) {
      if (/^(https?:|mailto:)/.test(target) || isGithubRelative(target)) continue;
      if (target.startsWith('#')) {
        if (!anchors.get(f)!.has(target.slice(1).toLowerCase())) broken.push(`${f}:${line} → ${target}`);
        continue;
      }
      const [path, anchor] = target.split('#');
      const abs = resolve(dirname(join(ROOT, f)), decodeURIComponent(path!));
      if (!existsSync(abs)) {
        broken.push(`${f}:${line} → ${target} (no such file)`);
        continue;
      }
      const set = anchors.get(abs.slice(ROOT.length + 1));
      if (anchor && set && !set.has(anchor.toLowerCase())) broken.push(`${f}:${line} → ${target} (no such anchor)`);
    }
  }
  assert.deepEqual(broken, [], 'a doc points somewhere that is not there');
});

// A path spelled in backticks reads as precise, and sends a contributor nowhere once it is wrong.
test('every repository path a doc names exists', () => {
  const missing: string[] = [];
  for (const f of repoMarkdown()) {
    if (isChangelog(f)) continue; // it describes the tree as it was at each release
    const text = readFileSync(join(ROOT, f), 'utf8');
    for (const m of text.matchAll(
      /`((?:hooks|tests|types|docs|\.github|\.claude-plugin)\/[\w./-]+\.(?:ts|tsx|json|jsonc|md|sh|yml))`/g,
    )) {
      if (!existsSync(join(ROOT, m[1]!))) missing.push(`${f} → ${m[1]}`);
    }
  }
  assert.deepEqual(missing, [], 'a doc names a file that is not there');
});

// A line number is unfalsifiable: nothing can tell a right one from a wrong one.
test('no doc points at a source line number', () => {
  const hits: string[] = [];
  for (const f of repoMarkdown()) {
    if (isChangelog(f)) continue;
    readFileSync(join(ROOT, f), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(/`[\w/.-]+\.(?:ts|tsx|js|sh):\d+`/g)) hits.push(`${f}:${i + 1} → ${m[0]}`);
      });
  }
  assert.deepEqual(hits, [], 'name the symbol, not the line: a line number rots silently');
});

// A doc nobody links is a doc nobody reads, and it is how a reference goes stale unnoticed.
test('every doc under docs/ is linked from another doc', () => {
  const files = repoMarkdown();
  const orphans = files
    .filter((f) => f.startsWith('docs/'))
    .filter((doc) => {
      const name = doc.slice('docs/'.length);
      return !files.some((other) => other !== doc && readFileSync(join(ROOT, other), 'utf8').includes(name));
    });
  assert.deepEqual(orphans, [], 'these docs are reachable from nothing but themselves');
});

/**
 * Prose outside a heading, a fenced block or a backtick span, with every inline code span removed.
 * A heading's em dash is part of an anchor other docs link to, and a backtick span quotes a literal
 * the program prints, which the doc would be lying about if it rewrote it.
 */
function proseLines(markdown: string): string[] {
  const out: string[] = [];
  let fenced = false;
  for (const raw of markdown.split('\n')) {
    const line = raw.trimStart();
    if (line.startsWith('```')) {
      fenced = !fenced;
      out.push('');
      continue;
    }
    out.push(fenced || line.startsWith('#') ? '' : raw.replace(/`[^`]*`/g, ''));
  }
  return out;
}

// The one tell of generated prose a regex can settle. The rest of the register (aphoristic closers,
// "not X but Y", bold lead-ins) needs judgement and lives in the project's writing rules.
test('no em dash in a public doc’s prose', () => {
  const hits: string[] = [];
  for (const f of repoMarkdown()) {
    if (isChangelog(f)) continue;
    proseLines(readFileSync(join(ROOT, f), 'utf8')).forEach((line, i) => {
      if (line.includes('—')) hits.push(`${f}:${i + 1} → ${line.trim().slice(0, 90)}`);
    });
  }
  assert.deepEqual(hits, [], 'use : , . ; or parentheses; a literal the program prints goes in backticks');
});
