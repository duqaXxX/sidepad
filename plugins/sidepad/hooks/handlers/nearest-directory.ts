import type Host from '../host';
import Paths from '../paths';

/**
 * The directory the pane falls back to when what it showed left the disk: the path itself when it is
 * still a directory, else its nearest ancestor that is one.
 *
 * @returns the directory, the session's directory when none is found
 */
export async function nearestDirectory(host: Host.Host, path: string, cwd: string): Promise<string> {
  for (const candidate of [path, ...Paths.ancestorsOf(path, cwd)]) {
    const stat = await host.stat(candidate).catch(() => null);

    if (stat?.kind === 'dir') {
      return candidate;
    }
  }

  return cwd;
}
