import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { HUGE_FILE, LOCKED_DIRECTORY, LONG_DIRECTORY } from '../make-playground';
import {
  barRangeOf,
  type CodeRow,
  codeRowsOf,
  columnOf,
  listingRowOf,
  PAGE_TOP,
  type Pane,
  paneOf,
  selectedLinesOf,
  shownPathOf,
  statusOf,
} from './screen';
import { type LiveSession, TEXT_COLUMN } from './session';

// What docs/features.md states, written here rather than read from the plugin: a scenario that took
// them from the code would pass whatever the code says.
/** The width `/sidepad` needs to open the pane. */
const OPEN_MIN_COLUMNS = 110;
/** What `/sidepad` answers in a narrower terminal. */
const RESIZE_ANSWER = 'Resize your terminal to at least 110 columns to show the sidepad pane';
/** Lines a wheel tick moves a code page. */
const WHEEL_LINES = 3;

// What Claude Code 2.1.278 draws, measured on 2026-09-19.
/** The title of `/resume`'s session picker. */
const RESUME_PICKER = 'Resume session';
/** `/diff`'s answer when its panel opened. */
const DIFF_SHOWN = 'Diff panel shown';
/** The engine's close mark on a panel's top row. */
const CLOSE_MARK = '✕';
/** Presses past a page's rows that `walkTo` allows: the top row's `..` and crumbs. */
const WALK_SLACK = 10;
/** How long a key that should move nothing is given to move something anyway. */
const UNMOVED_MS = 1_000;

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
  /**
   * What the playground needs before Claude Code starts in it, which reads some of it only then;
   * returns what puts the playground back.
   */
  prepare?(root: string): () => void;
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
    id: 'click-selects-a-setext-heading',
    title: 'a click on a heading underlined with = selects both of its source lines',
    async run(session) {
      const lines = fileLinesOf(session, 'docs/notes.md');
      // lineOf gives the 1-based line, so the heading is the line above its === underline.
      const underline = lineOf(lines, (line) => line.startsWith('==='));
      const start = underline - 1;
      const title = lines[start - 1]!;

      await session.open('docs/notes.md');
      const row = await session.until(`the heading ${title} drawn`, (pane) =>
        pane.rows.findIndex((text, at) => at >= PAGE_TOP && text.trim() === title),
      );

      await session.click(columnOf(session.pane(), row, title)!, row);
      await session.until(`the bar naming lines ${start}-${start + 1}`, (pane) => {
        const bar = barRangeOf(pane);

        return bar?.start === start && bar.end === start + 1;
      });
    },
  },
  {
    id: 'arrows-walk-the-listing',
    title:
      'after /sidepad the arrows and Enter open a directory; Page Down brings the end of a listing taller than the pane, and the arrows and Enter open its last entry',
    async run(session) {
      const last = readdirSync(join(session.root, LONG_DIRECTORY)).sort().at(-1)!;

      await walkTo(session, `${LONG_DIRECTORY}/`);
      session.key('Enter');
      await session.until(`./${LONG_DIRECTORY} shown`, (pane) => shownPathOf(pane) === `./${LONG_DIRECTORY}`);
      if (listingRowOf(session.pane(), last) !== null) {
        throw session.failure(`${last} is drawn at once: the listing no longer needs a page key to reach it`);
      }

      // The ring knows only the rows drawn (a LIMIT of the list page): a page key brings the rest.
      while (listingRowOf(session.pane(), last) === null) {
        const top = session.pane().rows.find((text, at) => at >= PAGE_TOP && text.trim() !== '');

        session.key('PageDown');
        await session.until(
          'the listing moved a page',
          (pane) => pane.rows.find((text, at) => at >= PAGE_TOP && text.trim() !== '') !== top,
        );
      }

      await walkTo(session, last);
      session.key('Enter');
      await session.until(
        `./${LONG_DIRECTORY}/${last} shown`,
        (pane) => shownPathOf(pane) === `./${LONG_DIRECTORY}/${last}`,
      );
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
        const body = pane.rows.slice(PAGE_TOP).map((text) => text.trim());

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
    id: 'reload-lists-open-pane',
    title: 'a plugin reload with the pane up lists the session directory in it, and /sidepad then closes it',
    async run(session) {
      await session.open('src/total.ts');
      // A module whose modification time moved is a change on disk to Claude Code, which reloads
      // the plugin; git compares content, so the working tree stays clean.
      const now = new Date();
      utimesSync(join(session.pluginDir, 'hooks/register.ts'), now, now);

      await session.until(
        'the session directory listed after the reload',
        (pane) => shownPathOf(pane) === '.' && listingRowOf(pane, 'src/') !== null,
      );
      // Had the reloaded plugin taken the pane as closed, /sidepad would open it rather than close it.
      await session.command('/sidepad');
      await session.untilScreen('the pane closed by /sidepad', (screen) => paneOf(screen) === null);
    },
  },
  {
    id: 'clear-closes-pane-and-forgets-selection',
    title: '/clear closes the pane, and /sidepad opens it again on the same page with nothing selected',
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');
      const from = lineOf(lines, (line) => line.startsWith('export function step001'));

      await session.open('src/report.ts');
      await session.dragLines(from, from + 2);
      await untilSelected(session, from, from + 2);

      await session.command('/clear');
      await session.untilScreen('the pane closed by /clear', (screen) => paneOf(screen) === null);
      await session.command('/sidepad');
      await session.until(
        'the pane open again on ./src/report.ts, nothing selected',
        (pane) =>
          shownPathOf(pane) === './src/report.ts' &&
          codeRowsOf(pane).length > 0 &&
          barRangeOf(pane) === null &&
          selectedLinesOf(pane).length === 0,
      );
    },
  },
  {
    id: 'dismissed-resume-keeps-pane',
    title: '/resume dismissed without choosing a session leaves the pane open and its selection kept',
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');
      const from = lineOf(lines, (line) => line.startsWith('export function step001'));
      // `/resume`'s echo in the transcript with its answer on the next row; typed in the prompt box,
      // the next row is the box's rule.
      const isAnswered = (screen: readonly string[]) => {
        const at = screen.findIndex((row) => /❯\s\/resume\b/.test(row));

        return at >= 0 && (screen[at + 1]?.includes('⎿') ?? false);
      };

      await session.open('src/report.ts');
      await session.dragLines(from, from + 2);
      await untilSelected(session, from, from + 2);

      await session.command('/resume');
      // With no earlier session to offer, the command may answer without a picker.
      const shown = await session.untilScreen('the session picker, or /resume answered', (screen) =>
        screen.some((row) => row.includes(RESUME_PICKER)) ? 'picker' : isAnswered(screen) ? 'answered' : null,
      );

      if (shown === 'picker') {
        session.key('Escape');
        await session.untilScreen('/resume answered once the picker is dismissed', isAnswered);
      }
      await untilSelected(session, from, from + 2);
    },
  },
  {
    id: 'diff-panel-covers-pane',
    title: "/diff's panel takes the dock over the pane, and closing it shows the pane again on its page",
    // `/diff` opens nothing outside a git repository, and Claude Code tells one at its start: a
    // repository made later is not seen. It lives for this scenario only, so the others run in the
    // playground as it was written.
    prepare(root) {
      git(root, 'init', '-q');

      return () => rmSync(join(root, '.git'), { recursive: true, force: true });
    },
    async run(session) {
      await session.open('src/total.ts');
      await session.command('/diff');
      await session.untilScreen(
        'the diff panel shown in place of the pane',
        (screen) => paneOf(screen) === null && screen.some((row) => row.includes(DIFF_SHOWN)),
      );

      // With the pane behind it, the panel's is the only close mark on screen.
      const mark = await session.untilScreen("the diff panel's close mark", (screen) => {
        const row = screen.findIndex((text) => text.includes(CLOSE_MARK));

        return row < 0 ? null : { row, column: [...screen[row]!].lastIndexOf(CLOSE_MARK) };
      });

      await session.clickScreen(mark.column, mark.row);
      await session.until('the pane shown again on ./src/total.ts', (pane) => shownPathOf(pane) === './src/total.ts');
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
    id: 'page-keys-move-a-code-page',
    title:
      'with the pane holding the keyboard Page Down moves a code page by the lines it shows, Page Up back; without it they move nothing',
    async run(session) {
      const lines = fileLinesOf(session, HUGE_FILE);

      await walkTo(session, HUGE_FILE);
      session.key('Enter');
      await untilPageFrom(session, lines, 1);
      const shown = codeRowsOf(session.pane()).length;

      session.key('PageDown');
      await untilPageFrom(session, lines, 1 + shown);
      session.key('PageUp');
      await untilPageFrom(session, lines, 1);

      // Escape hands the keyboard back to the prompt, with the pane left open. A lone ESC is told
      // from the start of a key's sequence only by the pause after it, and nothing on a code page
      // shows where the keyboard is, so the pause is waited out.
      session.key('Escape');
      await sleep(UNMOVED_MS);
      session.key('PageDown');
      await sleep(UNMOVED_MS);
      if (codeRowsOf(session.pane())[0]?.line !== 1)
        throw session.failure('Page Down moved a pane that does not hold the keyboard');
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

      // Opened with the keys, so the pane holds the keyboard and Page Down reaches it.
      await walkTo(session, 'src/');
      session.key('Enter');
      await session.until('./src shown', (pane) => shownPathOf(pane) === './src');
      await walkTo(session, 'report.ts');
      session.key('Enter');

      // The window's last line is the last one drawn when the line after it is not blank. A wheel
      // tick moves three lines, which keeps that line's remainder by three; Page Down moves the lines
      // shown, which changes it unless they are a multiple of three. Two ticks then a page reach a
      // window ending right below a blank line whatever the terminal's height.
      let first = 1;
      let end = await lastLineOfPageFrom(first);
      const shown = end - first + 1;
      const row = await session.rowOfLine(1);

      for (let step = 1; !endsBelowBlank(end); step += 1) {
        if (step > 9) throw session.failure('no window of src/report.ts ends right below a blank line');
        if (step % 3 === 0) {
          session.key('PageDown');
          first += shown;
        } else {
          await session.wheel('down', row);
          first += WHEEL_LINES;
        }
        end = await lastLineOfPageFrom(first);
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
    id: 'status-line-names-what-is-drawn',
    title: "the status line names the listing's entries, and the first and last lines a code page draws as it scrolls",
    async run(session) {
      const entries = readdirSync(session.root).length;

      await session.until(
        `the status line naming ${entries} entries`,
        (pane) => statusOf(pane)?.right === `${entries} entries`,
      );

      const lines = fileLinesOf(session, 'src/report.ts');
      // A file ending with a newline has no line after it: split leaves an empty last piece.
      const total = lines.at(-1) === '' ? lines.length - 1 : lines.length;
      const named = (pane: Pane) => {
        const rows = codeRowsOf(pane);
        const status = /^lines (\d+)–(\d+) of (\d+)$/.exec(statusOf(pane)?.right ?? '');
        if (rows.length === 0 || !rowsMatch(rows, lines) || !status) return null;

        const [first, last, of] = status.slice(1).map(Number) as [number, number, number];
        const lastNumbered = rows.at(-1)!.line;
        // Claude Code 2.1.278 numbers no blank line ending a window (#39), so the lines named past the
        // last numbered row must be blank ones.
        const pastNumbered = lines.slice(lastNumbered, last);

        return first === rows[0]!.line &&
          of === total &&
          last >= lastNumbered &&
          pastNumbered.every((line) => line === '')
          ? first
          : null;
      };

      await session.open('src/report.ts');
      await session.until('the status line naming the lines drawn from line 1', (pane) => named(pane) === 1);
      await session.wheel('down', await session.rowOfLine(1));
      await session.until(
        `the status line naming the lines drawn from line ${1 + WHEEL_LINES}`,
        (pane) => named(pane) === 1 + WHEEL_LINES,
      );
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

function git(root: string, ...args: string[]): void {
  const run = spawnSync('git', args, { cwd: root, encoding: 'utf8' });

  if (run.status !== 0) throw new Error(`git ${args.join(' ')} failed in the playground: ${run.stderr.trim()}`);
}

const rangeOf = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, at) => from + at);

/** The first page row with anything drawn on it, and its text. */
function firstContentRowOf(rows: readonly string[]): { row: number; text: string } | null {
  const row = rows.findIndex((text, at) => at >= PAGE_TOP && text.trim() !== '');

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

/**
 * Presses Down until the pane's focus ring is on `label`, each press awaited until the ring moves.
 * The presses are bounded by the longest listing the playground holds, so a ring that wraps before
 * reaching the label fails rather than circling.
 */
async function walkTo(session: LiveSession, label: string): Promise<void> {
  const presses = readdirSync(join(session.root, LONG_DIRECTORY)).length + WALK_SLACK;

  for (let press = 0; press < presses; press += 1) {
    const before = session.focused();

    if (before === label) return;
    session.key('Down');
    await session.until(`the focus ring moved off ${before ?? 'nothing'}`, () => session.focused() !== before);
  }

  throw session.failure(`the focus ring never reached ${label} in ${presses} presses of Down`);
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
