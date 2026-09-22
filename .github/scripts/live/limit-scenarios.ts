import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { DIFF_FILE, HUGE_FILE, INLINE_PAGE, LONG_DIRECTORY } from '../make-playground';
import { CODE_WITH_EMPTY_LINE, COMMAND as FIXTURE, PANE_ID as FIXTURE_PANE } from './engine-fixture/hooks/cases';
import {
  DIFF_SHOWN,
  fileLinesOf,
  git,
  lineOf,
  type Scenario,
  UNMOVED_MS,
  untilPageFrom,
  WHEEL_LINES,
  walkTo,
} from './scenarios';
import { type CodeRow, codeRowsOf, columnOf, PAGE_TOP, paneOf, shownPathOf, statusOf } from './screen';
import type { LiveSession } from './session';

/** What `/sidepad` answers when it closes the pane. */
const PANE_HIDDEN = 'sidepad pane hidden';
/** The first line of the fixture's Code, which tells its pane is drawn. */
const FIXTURE_TEXT = CODE_WITH_EMPTY_LINE.split('\n')[0]!;

/**
 * What `bun run check:live --limits` drives: one scenario per limit Claude Code sets, each passing
 * while the engine still behaves as the limit states. A release that lifts a limit fails its
 * scenario, and the failure says so: the LIMIT comment is then to be read again, not the plugin fixed.
 * limit-proofs.ts names which limit each one proves.
 */
export const LIMIT_SCENARIOS: readonly Scenario[] = [
  {
    id: 'wheel-reversal-drops-first-tick',
    title: 'the first wheel tick up after ticks down moves nothing, and the next one moves the page',
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');

      await session.open('src/report.ts');
      const first = await untilPageFrom(session, lines, 1);

      for (let tick = 1; tick <= 2; tick += 1) {
        await session.wheel('down', first.row);
        await untilPageFrom(session, lines, 1 + tick * WHEEL_LINES);
      }

      const reached = 1 + 2 * WHEEL_LINES;

      await session.wheel('up', first.row);
      await sleep(UNMOVED_MS);
      if (codeRowsOf(session.pane())[0]?.line !== reached) {
        throw lifted(session, 'the first tick after the wheel changed direction moved the page');
      }

      await session.wheel('up', first.row);
      await untilPageFrom(session, lines, reached - WHEEL_LINES);
    },
  },
  {
    id: 'end-moves-one-page',
    title: 'with the pane holding the keyboard, End moves a code page by about a page, not to the end',
    async run(session) {
      const lines = fileLinesOf(session, HUGE_FILE);

      await walkTo(session, HUGE_FILE);
      session.key('Enter');
      await untilPageFrom(session, lines, 1);
      const shown = codeRowsOf(session.pane()).length;

      session.key('End');
      const moved = await session.until('the page moved by End', (pane) => {
        const top = codeRowsOf(pane)[0]?.line;

        return top !== undefined && top > 1 ? top : null;
      });

      // Measured on 2.1.280: End arrives as the engine's own tree rows, one fewer than the body on a
      // code page, so the page moves by the lines shown or one fewer.
      if (moved - 1 > shown || moved - 1 < shown - 2) {
        throw lifted(session, `End moved the page from line 1 to line ${moved}, not by the ${shown} lines shown`);
      }
    },
  },
  {
    id: 'arrows-wrap-at-drawn-rows',
    title: "on a listing taller than the pane, Down past the last row drawn wraps to '..' and the listing stays",
    async run(session) {
      await walkTo(session, `${LONG_DIRECTORY}/`);
      session.key('Enter');
      await session.until(`./${LONG_DIRECTORY} shown`, (pane) => shownPathOf(pane) === `./${LONG_DIRECTORY}`);

      const firstRow = (rows: readonly string[]) => rows.find((text, at) => at >= PAGE_TOP && text.trim() !== '');
      const top = firstRow(session.pane().rows);
      const drawn = session.pane().rows.length;

      for (let press = 0; press < drawn + 2; press += 1) {
        const before = session.focused();

        session.key('Down');
        const after = await session.until(`the focus ring moved off ${before ?? 'nothing'}`, () => {
          const now = session.focused();

          return now !== before ? now : null;
        });

        if (after === '..') {
          if (firstRow(session.pane().rows) !== top) throw lifted(session, 'the listing moved under the ring');

          return;
        }
      }

      throw lifted(session, `Down never wrapped to '..' in ${drawn + 2} presses: the ring reaches rows not drawn`);
    },
  },
  {
    id: 'window-ending-blank-line-unnumbered',
    title: 'a code window whose last line is blank draws that line with no gutter number',
    async run(session) {
      const lines = fileLinesOf(session, 'src/report.ts');

      await session.open('src/report.ts');
      const first = await untilPageFrom(session, lines, 1);

      // A wheel tick moves three lines, so a window ending on a blank line comes within a few ticks.
      for (let tick = 0; tick < 12; tick += 1) {
        const end = windowEndOf(session);

        if (end !== null && lines[end - 1] === '') {
          if (codeRowsOf(session.pane()).at(-1)?.line === end) {
            throw lifted(session, `the blank line ${end} ending the window is numbered`);
          }

          return;
        }

        const top = codeRowsOf(session.pane())[0]?.line ?? 1;

        await session.wheel('down', first.row);
        await untilPageFrom(session, lines, top + WHEEL_LINES);
      }

      throw session.failure('no window of src/report.ts ended on a blank line in 12 wheel ticks');
    },
  },
  {
    id: 'link-draws-its-url-after-text',
    title: "on the runner's terminal a link draws its text then its URL, and no OSC 8 is written",
    async run(session) {
      const lines = fileLinesOf(session, INLINE_PAGE);
      const first = lines[lineOf(lines, (line) => line.startsWith('Read ')) - 1]!;
      const withUrl = first
        .replace(/\[([^\]]+)\]\((https:[^)]+)\)/g, '$1 $2')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

      await session.open(INLINE_PAGE);
      await session.until(`"${withUrl}" drawn`, (pane) =>
        pane.rows.some((text, at) => at >= PAGE_TOP && text.trim() === withUrl),
      );

      if (session.hyperlinks().length > 0) throw lifted(session, 'an OSC 8 hyperlink was written');
    },
  },
  {
    id: 'diff-grammar-colours-headers-only',
    title: "a diff's headers are coloured and its added lines are the colour of ordinary text",
    async run(session) {
      const diff = fileLinesOf(session, DIFF_FILE);
      const header = lineOf(diff, (line) => line.startsWith('--- '));
      const added = lineOf(diff, (line) => line.startsWith('+') && !line.startsWith('+++') && line.trim().length > 3);
      const context = lineOf(diff, (line, at) => at > header && line.startsWith(' ') && /[A-Za-z]/.test(line));

      await session.open(DIFF_FILE);
      const rows = await session.until(`lines ${header}, ${added} and ${context} drawn`, (pane) => {
        const drawn = codeRowsOf(pane);
        const find = (line: number) => drawn.find((row) => row.line === line);
        const [h, a, c] = [find(header), find(added), find(context)];

        return h && a && c ? { h, a, c } : null;
      });
      const colourOf = (row: CodeRow) =>
        session.textColourAt(columnOf(session.pane(), row.row, row.text.trim().slice(0, 3))!, row.row);
      const [headerColour, addedColour, plainColour] = [colourOf(rows.h), colourOf(rows.a), colourOf(rows.c)];

      if (headerColour === plainColour) throw lifted(session, 'the `---` header is the colour of ordinary text');
      if (addedColour !== plainColour) throw lifted(session, `an added line is coloured ${addedColour}`);
    },
  },
  {
    id: 'diff-panel-covers-a-shown-pane',
    title: "/diff's panel covers a pane, and $.ui.panes() still reports that pane isShown",
    withFixture: true,
    // `/diff` opens nothing outside a git repository, and Claude Code tells one at its start.
    prepare(root) {
      git(root, 'init', '-q');

      return () => rmSync(join(root, '.git'), { recursive: true, force: true });
    },
    async run(session) {
      await openFixturePane(session);
      await session.command('/diff');
      await session.untilScreen(
        'the diff panel shown in place of the fixture pane',
        (screen) => screen.some((row) => row.includes(DIFF_SHOWN)) && !screen.some((row) => row.includes(FIXTURE_TEXT)),
      );

      await session.command(`/${FIXTURE} panes`);
      const answer = await session.untilScreen('the fixture naming its pane', (screen) =>
        screen.find((row) => row.includes(`${FIXTURE_PANE} isShown=`)),
      );

      if (!answer.includes(`${FIXTURE_PANE} isShown=true`)) {
        throw lifted(session, `$.ui.panes() tells the covered pane apart: ${answer.trim()}`);
      }
    },
  },
  {
    id: 'code-without-gutter-drops-empty-line',
    title: 'a Code with no startLine draws no row for an empty line',
    withFixture: true,
    async run(session) {
      await openFixturePane(session);
      const [firstText, , thirdText] = CODE_WITH_EMPTY_LINE.split('\n');
      const rows = await session.untilScreen('both lines of the fixture drawn', (screen) => {
        const first = screen.findIndex((row) => row.includes(firstText!));
        const third = screen.findIndex((row) => row.includes(thirdText!));

        return first >= 0 && third >= 0 ? { first, third } : null;
      });

      if (rows.third !== rows.first + 1) throw lifted(session, 'the empty line takes a row');
    },
  },
];

/** A failure that reads as what it is: the engine no longer behaves as the limit states. */
const lifted = (session: LiveSession, what: string) =>
  session.failure(`the limit no longer holds, read its LIMIT comment again: ${what}`);

/** The last line of the window the status line names (`lines 13–52 of 407`); null when none. */
function windowEndOf(session: LiveSession): number | null {
  const status = statusOf(session.pane());
  const end = status && /lines \d+\D(\d+) of/.exec(status.right)?.[1];

  return end ? Number(end) : null;
}

/** Closes sidepad's pane, then opens the fixture's with its gutterless Code. */
async function openFixturePane(session: LiveSession): Promise<void> {
  await session.command('/sidepad');
  await session.untilScreen(`"${PANE_HIDDEN}" and no sidepad pane`, (screen) => paneOf(screen) === null);
  await session.command(`/${FIXTURE} code-no-gutter`);
  await session.untilScreen("the fixture's pane drawn", (screen) => screen.some((row) => row.includes(FIXTURE_TEXT)));
}
