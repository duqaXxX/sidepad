import Files from '../files';
import type Host from '../host';

/**
 * How many lines a file too large for `$.fs.read` has, counted once when the pane opens it.
 *
 * @returns the count, or null when the command was missing or failed
 */
export async function readLineCount(host: Host.Host, path: string): Promise<number | null> {
  const run = await host.run(Files.lineCountArgvOf(path)).catch(() => null);

  // `grep` exits 1 when it counted no line and 2 or more on a real error, so an empty file is a
  // count of 0 rather than a failure.
  if (run === null || run.exitCode > 1) {
    return null;
  }

  return Files.lineCountOf(run.stdout);
}
