import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HUGE_FILE, LOCKED_DIRECTORY } from '../make-playground';
import { barRangeOf, type CodeRow, codeRowsOf, columnOf, paneOf, selectedLinesOf, shownPathOf } from './screen';
import { type LiveSession, TEXT_COLUMN } from './session';

// What docs/features.md states, written here rather than read from the plugin: a scenario that took
// them from the code would pass whatever the code says.
/** The width `/sidepad` needs to open the pane. */
const OPEN_MIN_COLUMNS = 110;
/** What `/sidepad` answers in a narrower terminal. */
const RESIZE_ANSWER = 'Resize your terminal to at least 110 columns to show the sidepad pane';
/** Lines a wheel tick moves a code page. */
const WHEEL_LINES = 3;

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
  {
    id: 'locked-directory-notes-why',
    title: "a directory that cannot be listed shows the refusal's reason whole, and no entries",
    async run(session) {
      const reason = refusalOf(() => readdirSync(join(session.root, LOCKED_DIRECTORY)));

      await session.open(`${LOCKED_DIRECTORY}/`);
      // The note wraps over as many rows as it needs; joined, it must still reach the reason the OS
      // gave, which a note cut at the pane's edge loses behind the path it names first.
      await session.until(`the page naming ${reason}, with no listing row`, (pane) => {
        const body = pane.rows.slice(1).map((text) => text.trim());

        return body.join('').includes(reason) && body.every((text) => !text.endsWith('…')) ? true : null;
      });
    },
  },
  {
    id: 'close-mark-closes-pane',
    title: "the pane's close mark closes it, and /sidepad opens it again on the page it showed",
    async run(session) {
      await session.open('src/total.ts');
      const mark = columnOf(session.pane(), 0, '✕');
      if (mark === null) throw session.failure('no close mark on the top row');

      await session.click(mark, 0);
      await session.untilScreen('the pane closed by its mark', (screen) => paneOf(screen) === null);
      // Had the plugin missed the close, it would still hold the pane open, and /sidepad would close it.
      await session.command('/sidepad');
      await session.until('the pane open again on ./src/total.ts', (pane) => shownPathOf(pane) === './src/total.ts');
    },
  },
  {
    id: 'narrow-terminal-answers-width',
    title: `/sidepad one column short of ${OPEN_MIN_COLUMNS} says so and opens nothing; at ${OPEN_MIN_COLUMNS} it opens`,
    async run(session) {
      await session.command('/sidepad');
      await session.untilScreen('the pane closed by /sidepad', (screen) => paneOf(screen) === null);

      session.resize(OPEN_MIN_COLUMNS - 1);
      await session.command('/sidepad');
      await session.untilScreen(
        `the answer "${RESIZE_ANSWER}", and no pane`,
        (screen) => paneOf(screen) === null && screen.some((row) => row.includes(RESIZE_ANSWER)),
      );

      session.resize(OPEN_MIN_COLUMNS);
      await session.command('/sidepad');
      await session.until('the pane open on the session directory', (pane) => shownPathOf(pane) === '.');
    },
  },
  {
    id: 'wheel-moves-code-three-lines',
    title: `each wheel tick down moves a code page ${WHEEL_LINES} lines, every row still the file's own line`,
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');

      await session.open('src/report.ts');
      const first = await untilPageFrom(session, lines, 1);

      for (let tick = 1; tick <= 3; tick += 1) {
        await session.wheel('down', first.row);
        await untilPageFrom(session, lines, 1 + tick * WHEEL_LINES);
      }
    },
  },
  {
    id: 'wheel-moves-markdown-one-block',
    title: 'each wheel tick down moves a formatted Markdown page one block',
    async run(session) {
      const lines = fileLinesOf(session, 'docs/notes.md');
      // The source's blocks, split at blank lines: the first rows of the second and third.
      const paragraph = lines[lineOf(lines, (line, at) => at > 1 && line !== '') - 1]!;

      await session.open('docs/notes.md');
      const heading = await session.until('the page drawn formatted', (pane) => firstContentRowOf(pane.rows));

      await session.wheel('down', heading.row);
      await session.until(`the paragraph "${paragraph}" at the top`, (pane) =>
        firstContentRowOf(pane.rows)?.text.includes(paragraph),
      );
      await session.wheel('down', heading.row);
      // The table's formatted top rule is what a block down from the paragraph starts with.
      await session.until('the table at the top', (pane) => firstContentRowOf(pane.rows)?.text.startsWith('┌'));
    },
  },
  {
    id: 'huge-file-reads-by-windows',
    title: 'a file past the read cap draws its own lines, at its top and windows further down',
    async run(session) {
      const lines = fileLinesOf(session, HUGE_FILE);

      await session.open(HUGE_FILE);
      const first = await untilPageFrom(session, lines, 1);
      const shown = codeRowsOf(session.pane()).length;

      // Past the window the page holds, and more than once, so each landing is a read of its own.
      for (let tick = 1; tick * WHEEL_LINES <= shown * 3; tick += 1) {
        await session.wheel('down', first.row);
      }
      await session.until(`a page past line ${shown * 3} drawing the file's own lines`, (pane) => {
        const rows = codeRowsOf(pane);

        return (rows[0]?.line ?? 0) > shown * 3 && rowsMatch(rows, lines) ? true : null;
      });
    },
  },
  {
    id: 'drag-held-past-edge-scrolls',
    title: "a drag held past the window's bottom edge scrolls and keeps growing, and its release shows the end",
    async run(session) {
      await session.open('src/report.ts');
      const start = await session.until('the code page drawn', (pane) => {
        const rows = codeRowsOf(pane);

        return rows.length > 0 ? rows : null;
      });
      const last = start.at(-1)!;
      const from = last.line - 1;

      await session.pointer('press', TEXT_COLUMN, last.row - 1);
      await session.pointer('move', TEXT_COLUMN, last.row + 1);
      // Held: every line from the press to the bottom row stays selected while the window moves on.
      const held = await session.until('the window moved ten lines, the selection growing with it', (pane) => {
        const rows = codeRowsOf(pane);
        const end = rows.at(-1)?.line;

        return end !== undefined &&
          rows[0]!.line >= start[0]!.line + 10 &&
          selectedLinesOf(pane).join(',') === rangeOf(from, end).join(',')
          ? end
          : null;
      });

      await session.pointer('release', TEXT_COLUMN, last.row + 1);
      const bar = await session.until(`the bar naming lines ${from} to at least ${held}`, (pane) => {
        const range = barRangeOf(pane);

        return range?.start === from && range.end >= held ? range : null;
      });
      await untilSelected(session, from, bar.end);
    },
  },
  {
    id: 'selection-ending-on-blank-line-marks-it',
    title: 'a selection ending on a blank line the bar would cover scrolls to it, and marks it as its last row',
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');
      const endsBelowBlank = (end: number) => lines[end - 2] === '' && lines[end] !== '';
      const lastLineOfPageFrom = (first: number) =>
        session.until(`a page from line ${first} drawing the file's own lines`, (pane) => {
          const rows = codeRowsOf(pane);

          return rows[0]?.line === first && rowsMatch(rows, lines) ? rows.at(-1)!.line : null;
        });

      await session.open('src/report.ts');
      // The window's last line is the last one drawn when the line after it is not blank. One whose
      // line above is blank is found within three ticks, when the window's height allows one at all.
      let end = await lastLineOfPageFrom(1);
      const row = await session.rowOfLine(1);

      for (let tick = 1; !endsBelowBlank(end); tick += 1) {
        if (tick > 3) throw session.failure('no window of src/report.ts ends right below a blank line');
        await session.wheel('down', row);
        end = await lastLineOfPageFrom(1 + tick * WHEEL_LINES);
      }

      // The bar takes the window's last rows, so the page scrolls until the blank line is its last:
      // the row where Code draws no number and the marker once went missing.
      const blank = end - 1;
      const from = blank - 2;

      await session.dragLines(from, blank);
      await untilSelected(session, from, blank);
      await session.until(`line ${blank} as the window's last row`, (pane) => codeRowsOf(pane).at(-1)?.line === blank);
    },
  },
  {
    id: 'typing-after-drag-reaches-prompt',
    title: 'text typed right after a drag lands in the prompt box, and the selection stays',
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');
      const from = lineOf(lines, (line) => line.startsWith('export function step002'));
      const to = lineOf(lines, (line, at) => at > from && line === '}');

      await session.open('src/report.ts');
      await session.dragLines(from, to);
      await untilSelected(session, from, to);

      await session.typeInPrompt('explain these lines');
      await untilSelected(session, from, to);
    },
  },
];

const rangeOf = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, at) => from + at);

/** The first row below the top row with anything drawn on it, and its text. */
function firstContentRowOf(rows: readonly string[]): { row: number; text: string } | null {
  const row = rows.findIndex((text, at) => at > 0 && text.trim() !== '');

  return row < 0 ? null : { row, text: rows[row]!.trim() };
}

/**
 * Whether every code row draws the file's own line: the text after the gutter is the start of the
 * line its gutter names, since the page cuts a line at its right edge.
 */
function rowsMatch(rows: readonly CodeRow[], lines: readonly string[]): boolean {
  return (
    rows.length > 0 &&
    rows.every((row, at) => row.line === rows[0]!.line + at && (lines[row.line - 1] ?? '').startsWith(row.text))
  );
}

/** Waits for a code page whose first line is `first` and whose rows are the file's own lines. */
function untilPageFrom(session: LiveSession, lines: readonly string[], first: number): Promise<CodeRow> {
  return session.until(`a page from line ${first} drawing the file's own lines`, (pane) => {
    const rows = codeRowsOf(pane);

    return rows[0]?.line === first && rowsMatch(rows, lines) ? rows[0] : null;
  });
}

/** The error code a file system call fails with here, read from the playground rather than the pane. */
function refusalOf(call: () => unknown): string {
  try {
    call();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code) return code;
  }
  throw new Error('the playground no longer holds a directory that cannot be listed');
}

const fileLinesOf = (session: LiveSession, path: string) => readFileSync(join(session.root, path), 'utf8').split('\n');

/** The 1-based line of the first line matching, searching past `at` when the test reads it. */
function lineOf(lines: readonly string[], test: (line: string, at: number) => boolean): number {
  const at = lines.findIndex((line, index) => test(line, index + 1));
  if (at < 0) throw new Error('the playground no longer holds a line this scenario needs');

  return at + 1;
}

/** Waits for the bar to name `from`-`to` and for exactly those lines to be marked `▌`. */
function untilSelected(session: LiveSession, from: number, to: number): Promise<boolean> {
  const expected = rangeOf(from, to).join(',');

  return session.until(`the bar naming lines ${from}-${to} and exactly those rows marked`, (pane) => {
    const bar = barRangeOf(pane);

    return bar?.start === from && bar.end === to && selectedLinesOf(pane).join(',') === expected;
  });
}
