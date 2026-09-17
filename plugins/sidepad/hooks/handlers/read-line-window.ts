import Files from '../files';
import type Host from '../host';

/**
 * One window of a file too large for `$.fs.read`, read with a command on the host.
 *
 * @param from the window's 0-based first line
 * @param rows how many lines to read
 * @returns the lines, or null when the command was missing or failed (no `sed` on the host)
 */
export async function readLineWindow(
  host: Host.Host,
  path: string,
  from: number,
  rows: number,
): Promise<string[] | null> {
  const run = await host.run(Files.lineWindowArgvOf(path, from + 1, from + Math.max(1, rows))).catch(() => null);

  return run === null || run.exitCode !== 0 ? null : Files.windowLinesOf(run.stdout);
}
