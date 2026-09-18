import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { barRangeOf, columnOf, selectedLinesOf } from './screen';
import type { LiveSession } from './session';

/**
 * What `bun run check:live` drives: a person's input sent as a terminal sends it, and what the
 * engine draws in the pane after it, which no test of the kit shows. Each scenario starts on a fresh session with the pane open on the session
 * directory, and reads what it expects from the playground's files, never from the plugin's code,
 * so a fault the plugin's own logic carries cannot pass here by agreeing with itself.
 */
export type Scenario = {
  /** Named by docs/features.md's proof map, feature-proofs.ts. */
  id: string;
  title: string;
  run(session: LiveSession): Promise<void>;
};

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'drag-selects-lines',
    title: 'a drag over lines selects exactly those lines, and the bar names them',
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');
      // From the first body line of a function to a line past a blank one, where Code once dropped rows.
      const from = lineOf(lines, (line) => line.startsWith('  const sum'));
      const to = lineOf(lines, (line) => line.startsWith('  log('));

      await session.open('src/report.ts');
      await session.dragLines(from, to);
      await untilSelected(session, from, to);
    },
  },
  {
    id: 'click-toggles-block',
    title: 'a click selects the block under it, and a second click on it clears the selection',
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');
      const start = lineOf(lines, (line) => line.startsWith('export function step001'));
      const end = lineOf(lines, (line, at) => at > start && line === '}');

      await session.open('src/report.ts');
      await session.clickLine(start);
      await untilSelected(session, start, end);

      await session.clickLine(start);
      await session.until(
        'the selection cleared by a second click',
        (pane) => barRangeOf(pane) === null && selectedLinesOf(pane).length === 0,
      );
    },
  },
  {
    id: 'click-selects-markdown-table',
    title: 'a click on a rendered Markdown table selects its source lines',
    async run(session) {
      const lines = fileLinesOf(session, 'docs/notes.md');
      const start = lineOf(lines, (line) => line.startsWith('|'));
      const end = lineOf(lines, (line, at) => at > start && !line.startsWith('|')) - 1;
      // The first cell of the first body row, below the header and the separator.
      const cell = lines[start + 1]!.split('|')[1]!.trim();

      await session.open('docs/notes.md');
      // The formatted page draws the table with box-drawing rules; the source page draws `|` lines.
      const row = await session.until('the table drawn formatted', (pane) => {
        const at = pane.rows.findIndex((text) => text.includes(`│ ${cell}`));

        return at >= 0 && pane.rows.some((text) => text.includes('┌')) ? at : null;
      });

      await session.click(columnOf(session.pane(), row, cell)!, row);
      await session.until(`the bar naming the table's source, lines ${start}-${end}`, (pane) => {
        const bar = barRangeOf(pane);

        return bar?.start === start && bar.end === end;
      });
    },
  },
];

const fileLinesOf = (session: LiveSession, path: string) => readFileSync(join(session.root, path), 'utf8').split('\n');

/** The 1-based line of the first line matching, searching past `at` when the test reads it. */
function lineOf(lines: readonly string[], test: (line: string, at: number) => boolean): number {
  const at = lines.findIndex((line, index) => test(line, index + 1));
  if (at < 0) throw new Error('the playground no longer holds a line this scenario needs');

  return at + 1;
}

/** Waits for the bar to name `from`-`to` and for exactly those lines to be marked `▌`. */
function untilSelected(session: LiveSession, from: number, to: number): Promise<boolean> {
  const expected = Array.from({ length: to - from + 1 }, (_, at) => from + at).join(',');

  return session.until(`the bar naming lines ${from}-${to} and exactly those rows marked`, (pane) => {
    const bar = barRangeOf(pane);

    return bar?.start === from && bar.end === to && selectedLinesOf(pane).join(',') === expected;
  });
}
