import { setTimeout as sleep } from 'node:timers/promises';
import { Terminal as Emulator } from '@xterm/headless';

/**
 * A terminal of a fixed size, driven as a person drives one: keys typed, and the pointer sent as
 * the xterm SGR mouse sequences a terminal writes (`ESC [ < button ; x ; y M` on press or motion,
 * `m` on release), which is how the probes in this repository measured every gesture.
 *
 * The program runs on a pseudo-terminal Bun opens (`Bun.spawn`'s `terminal` option), and what it
 * writes is interpreted by `@xterm/headless`, so the screen is read as rows of cells. No multiplexer
 * sits between the program and the emulator: the program sees `TERM=xterm-256color` and none of the
 * variables that name the terminal the runner was started from, and its queries to the terminal are
 * answered by the emulator as a terminal answers them.
 */
export class Terminal {
  private readonly decoder = new TextDecoder();

  private constructor(
    private readonly process: Bun.Subprocess,
    private readonly emulator: Emulator,
  ) {}

  /** Starts `argv` in `cwd` at `columns` by `rows`. */
  static start(cwd: string, argv: readonly string[], columns: number, rows: number): Terminal {
    // No scrollback: the screen is the only thing read, and a program that exits keeps its last
    // screen in the emulator, so a failure can still be read.
    const emulator = new Emulator({ cols: columns, rows, scrollback: 0, allowProposedApi: true });
    let terminal: Terminal | null = null;
    const process = Bun.spawn([...argv], {
      cwd,
      env: { ...hostless(Bun.env), TERM: 'xterm-256color' },
      terminal: {
        cols: columns,
        rows,
        data: (_, chunk) => emulator.write(terminal?.decoder.decode(chunk, { stream: true }) ?? ''),
      },
    });

    terminal = new Terminal(process, emulator);
    emulator.onData((reply) => terminal.write(reply));

    return terminal;
  }

  /** The screen as plain text, one string a row. */
  screen(): string[] {
    const buffer = this.emulator.buffer.active;

    return Array.from(
      { length: this.emulator.rows },
      (_, row) => buffer.getLine(buffer.viewportY + row)?.translateToString(true) ?? '',
    );
  }

  /**
   * Each row's inverse cells from `fromColumn` on, as text: a terminal draws a focused control
   * inverted, and so does Claude Code 2.1.277 for the focus ring on a pane's Button.
   */
  inverse(fromColumn: number): string[] {
    const buffer = this.emulator.buffer.active;

    return Array.from({ length: this.emulator.rows }, (_, row) => {
      const line = buffer.getLine(buffer.viewportY + row);
      let text = '';

      for (let column = fromColumn; column < this.emulator.cols; column += 1) {
        const cell = line?.getCell(column);

        if (cell?.isInverse()) text += cell.getChars() || ' ';
      }

      return text.trim();
    });
  }

  /** Types text as it is, no key names read in it. */
  type(text: string): void {
    this.write(text);
  }

  /** Presses named keys: `Enter`, `Down`, `PageDown`, `Escape`. */
  key(...names: KeyName[]): void {
    // A program that sets application cursor keys (DECCKM) reads an arrow as `ESC O`, not `ESC [`.
    const isApplication = this.emulator.modes.applicationCursorKeysMode;

    for (const name of names) this.write(isApplication ? KEYS[name].replace('\x1b[', '\x1bO') : KEYS[name]);
  }

  /** A left press, drag motion or release at a 0-based screen cell. */
  async pointer(kind: 'press' | 'move' | 'release', column: number, row: number): Promise<void> {
    const button = kind === 'move' ? 32 : 0;

    this.type(`\x1b[<${button};${column + 1};${row + 1}${kind === 'release' ? 'm' : 'M'}`);
    // A Client posts at most one message a frame and a later post replaces an undelivered one, so
    // events sent faster than frames would collapse; a person's hand is never that fast either.
    await sleep(POINTER_GAP_MS);
  }

  /**
   * One wheel tick at a 0-based screen cell: the SGR press of button 64 (up) or 65 (down).
   *
   * Measured on Claude Code 2.1.277: the first tick after the wheel changes direction never reaches
   * a hook, whatever the pause before it (#38), so a scenario that counts ticks keeps to one
   * direction.
   */
  async wheel(direction: 'up' | 'down', column: number, row: number): Promise<void> {
    this.type(`\x1b[<${direction === 'up' ? 64 : 65};${column + 1};${row + 1}M`);
    await sleep(POINTER_GAP_MS);
  }

  /** Resizes the pseudo-terminal, which signals the program, and the screen read from it. */
  resize(columns: number, rows: number): void {
    this.process.terminal?.resize(columns, rows);
    this.emulator.resize(columns, rows);
  }

  /** Ends the program and closes its pseudo-terminal. */
  stop(): void {
    this.process.kill();
    this.process.terminal?.close();
    this.emulator.dispose();
  }

  private write(bytes: string): void {
    if (!this.process.terminal?.closed) this.process.terminal?.write(bytes);
  }
}

/**
 * The variables a multiplexer or the terminal the runner was started from sets to name itself.
 * Inherited, they would tell the program it runs in tmux or in the person's terminal, when the
 * terminal it draws on is the emulator.
 */
const HOST_TERMINAL = [
  'TMUX',
  'TMUX_PANE',
  'STY',
  'TERM_PROGRAM',
  'TERM_PROGRAM_VERSION',
  'LC_TERMINAL',
  'LC_TERMINAL_VERSION',
];

const hostless = (env: Record<string, string | undefined>) =>
  Object.fromEntries(Object.entries(env).filter(([name]) => !HOST_TERMINAL.includes(name)));

/** The bytes a terminal sends for a named key, in normal cursor-key mode. */
const KEYS = {
  Enter: '\r',
  Up: '\x1b[A',
  Down: '\x1b[B',
  PageUp: '\x1b[5~',
  PageDown: '\x1b[6~',
  Escape: '\x1b',
} as const;

/** A key `Terminal.key` presses. */
export type KeyName = keyof typeof KEYS;

/** Milliseconds between two pointer events: the gap the probes used for injected drags. */
export const POINTER_GAP_MS = 80;
