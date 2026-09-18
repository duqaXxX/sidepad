import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

/**
 * A terminal of a fixed size in tmux, driven as a person drives one: keys typed, and the pointer
 * sent as the xterm SGR mouse sequences a terminal writes (`ESC [ < button ; x ; y M` on press or
 * motion, `m` on release), which is how the probes in this repository measured every gesture.
 *
 * It runs on its own tmux socket with no configuration file, so neither the person's tmux server
 * nor their `tmux.conf` takes part.
 */
export class Terminal {
  private readonly session = 'live';

  /** @param socket the tmux socket name, one server per runner */
  constructor(private readonly socket: string) {}

  /** Starts `argv` in `cwd` at `columns` by `rows`, the server's previous session killed first. */
  start(cwd: string, argv: readonly string[], columns: number, rows: number): void {
    this.stop();
    this.tmux(
      'new-session',
      ...['-d', '-s', this.session, '-x', String(columns), '-y', String(rows), '-c', cwd],
      ...argv,
      ';',
      // A program that exits keeps its last screen, so a failure can still be read.
      ...['set-option', '-t', this.session, 'remain-on-exit', 'on'],
    );
  }

  /** The screen as plain text, one string a row. */
  screen(): string[] {
    return this.tmux('capture-pane', '-p', '-t', this.session).split('\n');
  }

  /** Types text as it is, no key names read in it. */
  type(text: string): void {
    this.tmux('send-keys', '-t', this.session, '-l', text);
  }

  /** Presses named keys: `Enter`, `Down`, `Escape`. */
  key(...names: string[]): void {
    this.tmux('send-keys', '-t', this.session, ...names);
  }

  /** A left press, drag motion or release at a 0-based screen cell. */
  async pointer(kind: 'press' | 'move' | 'release', column: number, row: number): Promise<void> {
    const button = kind === 'move' ? 32 : 0;

    this.type(`\x1b[<${button};${column + 1};${row + 1}${kind === 'release' ? 'm' : 'M'}`);
    // A Client posts at most one message a frame and a later post replaces an undelivered one, so
    // events sent faster than frames would collapse; a person's hand is never that fast either.
    await sleep(POINTER_GAP_MS);
  }

  /** Kills the runner's tmux server, if one runs. */
  stop(): void {
    try {
      this.tmux('kill-server');
    } catch {
      // No server was running.
    }
  }

  private tmux(...args: string[]): string {
    return execFileSync('tmux', ['-f', '/dev/null', '-L', this.socket, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
}

/** Milliseconds between two pointer events: the gap the probes used for injected drags. */
export const POINTER_GAP_MS = 80;
