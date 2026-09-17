import Files from '../files';
import type Host from '../host';
import Limits from '../limits';
import { readLineCount } from './read-line-count';

/**
 * A file read for the page: its stat, then its text when it is a regular file within the engine's
 * read cap. A file past the cap is opened windowed, its lines counted on the host; where that count
 * cannot be had (no such command), the page shows the too-large note instead. A failed stat or read
 * becomes the page's note, never a throw.
 *
 * @returns the loaded file
 */
export async function loadFile(host: Host.Host, path: string): Promise<Files.LoadedFile> {
  const stat = await host.stat(path).catch(() => null);

  if (stat !== null && stat.kind === 'file' && stat.size > Limits.READ_MAX_BYTES) {
    const total = await readLineCount(host, path);

    return total === null ? Files.loadedFileOf(path, stat, null) : Files.windowedFileOf(path, stat, total);
  }

  const text = Files.shouldRead(stat) ? await host.read(path).catch(() => null) : null;

  return Files.loadedFileOf(path, stat, text);
}
