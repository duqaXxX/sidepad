import { realpathSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  barRangeOf,
  codeRowsOf,
  columnOf,
  listingRowOf,
  type Pane,
  paneOf,
  selectedLinesOf,
  shownPathOf,
} from './screen';
import { type KeyName, Terminal } from './terminal';

/**
 * The terminal the scenarios run in. 200 by 50 cells is the size every probe measured at, and it
 * is past both of the engine's floors for a docked pane (110 columns asked, 144 unasked).
 */
export const COLUMNS = 200;
export const ROWS = 50;

/** How long a state the screen should reach is waited for before the scenario fails. */
const SETTLE_MS = 5_000;
/** Claude Code's own start, the first run in a new directory included. */
const START_MS = 30_000;
const POLL_MS = 100;
/** How long a navigation click is given to change the page, and how many clicks it gets. */
const NAVIGATE_MS = 1_500;
const NAVIGATE_ATTEMPTS = 3;

const TRUST_CHOICE = 'Yes, I trust this folder';

/** A scenario's failure: what was expected, and the screen as it was. */
export class ScenarioError extends Error {}

/**
 * One Claude Code session in a terminal, with the plugin loaded from source and the pane open on the
 * session directory.
 */
export class LiveSession {
  private constructor(
    private readonly terminal: Terminal,
    /** The playground the session runs in. */
    readonly root: string,
    /** The plugin's source directory the session loaded. */
    readonly pluginDir: string,
  ) {}

  /**
   * Starts Claude Code in `root` and opens the pane with `/sidepad`. The folder trust question is
   * answered only when the folder it names is `root`, the synthetic project the runner just wrote.
   */
  static async start(root: string, pluginDir: string): Promise<LiveSession> {
    const argv = ['env', 'CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1', 'CLAUDE_CODE_NO_FLICKER=1', 'claude'];
    const terminal = Terminal.start(root, [...argv, '--plugin-dir', pluginDir], COLUMNS, ROWS);
    const session = new LiveSession(terminal, root, pluginDir);

    try {
      const first = await session.untilScreen(
        'the folder trust question or an empty prompt',
        (screen) => (isTrustQuestion(screen) ? 'trust' : promptRowOf(screen) !== null ? 'ready' : null),
        START_MS,
      );

      if (first === 'trust') {
        const names = [root, realpathSync(root)];

        if (!terminal.screen().some((row) => names.includes(row.trim()))) {
          throw session.failure(`the trust question names a folder other than the playground ${root}`);
        }
        terminal.key('Down');
        await session.untilScreen(`"${TRUST_CHOICE}" chosen`, (screen) =>
          screen.some((row) => plainOf(row) === `❯ ${TRUST_CHOICE}`),
        );
        terminal.key('Enter');
        await session.untilScreen('an empty prompt', (screen) => promptRowOf(screen) !== null, START_MS);
      }

      await session.command('/sidepad');
      await session.until('the pane open on the session directory', (pane) => shownPathOf(pane) === '.');
    } catch (error) {
      terminal.stop();
      throw error;
    }

    return session;
  }

  /**
   * The pane rows painted `colour` behind the cell at `column` of the pane, which is how a selection
   * shows where the page draws its own text.
   *
   * @param column the pane's 0-based column to read, its text past the page's padding
   * @returns the pane rows, 0-based from the top row
   */
  paintedRows(column: number, colour: string): number[] {
    const pane = this.pane();
    const painted = this.terminal.backgroundsAt(pane.left + column);

    return pane.rows.map((_, row) => row).filter((row) => painted[pane.top + row] === colour);
  }

  /** The pane as drawn now; fails when none is. */
  pane(): Pane {
    const pane = paneOf(this.terminal.screen());
    if (!pane) throw this.failure('no docked pane on screen');

    return pane;
  }

  /**
   * Waits until `read` answers something truthy on the pane, and returns it.
   *
   * @param what the state awaited, named in the failure
   */
  until<T>(what: string, read: (pane: Pane) => T | null | undefined | false, timeoutMs = SETTLE_MS): Promise<T> {
    return this.untilScreen(
      what,
      (screen) => {
        const pane = paneOf(screen);

        return pane ? read(pane) : null;
      },
      timeoutMs,
    );
  }

  /**
   * Opens a path relative to the session directory as a person does: `..` up to the session
   * directory, then a click on each entry down to it. A path ending with `/` names a directory.
   */
  async open(path: string): Promise<void> {
    while (shownPathOf(this.pane()) !== '.') {
      const before = shownPathOf(this.pane());

      await this.navigate(`the page above ${before}`, '..', 0, (pane) => shownPathOf(pane) !== before);
    }

    const isDirectory = path.endsWith('/');
    const pieces = path.replace(/\/$/, '').split('/');

    for (const [at, piece] of pieces.entries()) {
      const label = at < pieces.length - 1 || isDirectory ? `${piece}/` : piece;
      const row = listingRowOf(this.pane(), label);
      if (row === null) throw this.failure(`no listing row ${label}`);

      const shown = `/${pieces.slice(0, at + 1).join('/')}`;

      await this.navigate(`.${shown} shown`, label, row, (pane) => shownPathOf(pane)?.endsWith(shown));
    }
  }

  /**
   * Clicks a text on a row until the page shows `done`. Measured on 2.1.276: a click within about
   * 0.1 s of the pane's first drawing is lost (#20), and one at 0.3 s lands. Getting to a page is not
   * what a scenario asserts, so its click may be repeated; the gestures a scenario asserts never are.
   */
  private async navigate(what: string, text: string, row: number, done: (pane: Pane) => unknown): Promise<void> {
    for (let attempt = 1; ; attempt += 1) {
      const column = columnOf(this.pane(), row, text);
      if (column === null) throw this.failure(`no ${text} on row ${row} for ${what}`);

      await this.click(column, row);
      try {
        await this.until(what, done, NAVIGATE_MS);
        return;
      } catch (error) {
        // The page may have changed just past the wait: a click on it now would land elsewhere.
        if (done(this.pane())) return;
        if (attempt === NAVIGATE_ATTEMPTS) throw error;
      }
    }
  }

  /** Types text into the prompt box and waits until the box shows it. */
  async typeInPrompt(text: string): Promise<void> {
    this.terminal.type(text);
    await this.untilScreen(`${text} typed in the prompt`, (screen) => promptTextOf(screen) === text);
  }

  /** Types a command into the prompt box and submits it. */
  async command(text: string): Promise<void> {
    await this.typeInPrompt(text);
    this.terminal.key('Enter');
  }

  /** Resizes the terminal to `columns`, its height kept. */
  resize(columns: number): void {
    this.terminal.resize(columns, ROWS);
  }

  /** A press, drag motion or release at a pane cell. */
  async pointer(kind: 'press' | 'move' | 'release', column: number, row: number): Promise<void> {
    const pane = this.pane();

    await this.terminal.pointer(kind, pane.left + column, pane.top + row);
  }

  /** A click at a pane cell: a press and its release on the same cell. */
  async click(column: number, row: number): Promise<void> {
    await this.pointer('press', column, row);
    await this.pointer('release', column, row);
  }

  /** A click at a screen cell, for what is drawn outside the pane. */
  async clickScreen(column: number, row: number): Promise<void> {
    await this.terminal.pointer('press', column, row);
    await this.terminal.pointer('release', column, row);
  }

  /** A key pressed as a person presses it, wherever the keyboard is. */
  key(name: KeyName): void {
    this.terminal.key(name);
  }

  /** The text the pane's focus ring is on, read from the inverse cells it is drawn with; null with none. */
  focused(): string | null {
    const pane = this.pane();
    const rows = this.terminal.inverse(pane.left).slice(pane.top, pane.top + pane.rows.length);

    return rows.find((text) => text !== '') ?? null;
  }

  /** One wheel tick over the text of a pane row. */
  async wheel(direction: 'up' | 'down', row: number): Promise<void> {
    const pane = this.pane();

    await this.terminal.wheel(direction, pane.left + TEXT_COLUMN, pane.top + row);
  }

  /** A click on the text of a code line. */
  async clickLine(line: number): Promise<void> {
    await this.click(TEXT_COLUMN, await this.rowOfLine(line));
  }

  /** A drag from one code line to another, the pointer passing every row between them. */
  async dragLines(from: number, to: number): Promise<void> {
    const { left, top } = this.pane();
    const [start, end] = [await this.rowOfLine(from), await this.rowOfLine(to)];
    const step = Math.sign(end - start);

    await this.terminal.pointer('press', left + TEXT_COLUMN, top + start);
    for (let row = start + step; row !== end + step; row += step) {
      await this.terminal.pointer('move', left + TEXT_COLUMN, top + row);
    }
    await this.terminal.pointer('release', left + TEXT_COLUMN, top + end);
  }

  /** Ends the session and closes its terminal. */
  stop(): void {
    this.terminal.stop();
  }

  /** A failure carrying the screen, so a red run shows what the pane drew. */
  failure(message: string): ScenarioError {
    const screen = this.terminal.screen();
    const pane = paneOf(screen);
    const drawn = pane ? pane.rows : screen;
    const bar = pane && barRangeOf(pane);
    const seen = pane
      ? `\n  seen: ${bar ? `bar lines ${bar.start}-${bar.end}` : 'no bar'}, rows marked ▌ ${selectedLinesOf(pane).join(',') || 'none'}`
      : '';

    return new ScenarioError(`${message}${seen}\n${drawn.map((row) => `    |${row.trimEnd()}`).join('\n')}`);
  }

  /** The pane row a code line is drawn on, once it is. */
  async rowOfLine(line: number): Promise<number> {
    const code = await this.until(`line ${line} drawn`, (pane) => codeRowsOf(pane).find((row) => row.line === line));

    return code.row;
  }

  /**
   * Waits until `read` answers something truthy on the whole screen, and returns it: for what is
   * drawn outside the pane, or with no pane at all.
   *
   * @param what the state awaited, named in the failure
   */
  async untilScreen<T>(
    what: string,
    read: (screen: string[]) => T | null | undefined | false,
    timeoutMs = SETTLE_MS,
  ): Promise<T> {
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const answer = read(this.terminal.screen());
      if (answer) return answer;
      if (Date.now() > deadline) throw this.failure(`waited ${timeoutMs} ms for ${what}`);
      await sleep(POLL_MS);
    }
  }
}

/** A pane column inside a code line's text, past the marker cell and a gutter of up to five digits. */
export const TEXT_COLUMN = 8;

/** A row with every run of white space as one space: the prompt's `❯` is followed by a no-break space. */
const plainOf = (row: string) => row.replace(/\s+/g, ' ').trim();

const isTrustQuestion = (screen: readonly string[]) => screen.some((row) => row.includes(TRUST_CHOICE));

/** The prompt box's row: `❯` between the two rules that frame it. */
function promptRowOf(screen: readonly string[]): number | null {
  const row = screen.findIndex(
    (text, at) => text.startsWith('❯') && screen[at - 1]?.startsWith('─') && screen[at + 1]?.startsWith('─'),
  );

  return row < 0 ? null : row;
}

/** The prompt box's row past its `❯`: what was typed, or the placeholder; null when no box is drawn. */
export function promptTextOf(screen: readonly string[]): string | null {
  const row = promptRowOf(screen);

  return row === null ? null : plainOf(screen[row]!).replace(/^❯ ?/, '');
}
