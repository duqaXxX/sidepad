import Files from '../files';
import Names from '../names';
import PaneState from '../pane-state';
import Paths from '../paths';
import type Sidepad from '../sidepad';
import { ensureWindow } from './ensure-window';
import { listDirectory } from './list-directory';
import { loadFile } from './load-file';
import { nearestDirectory } from './nearest-directory';

/**
 * The page checked against the disk, after a shell command or when the pane opens: a file that is
 * gone gives way to its nearest existing directory with a note naming it; a file that changed is read
 * again in place, clearing a selection; a directory is listed again, or gives way as a file does. A
 * rename is not inferred from the command.
 */
export async function checkPage(sidepad: Sidepad.Sidepad): Promise<void> {
  const { host } = sidepad;
  const { page, file, cwd } = sidepad.state;

  if (page.kind === 'file' && file) {
    const path = file.loaded.path;
    const stat = await host.stat(path).catch(() => null);
    const change = Files.pageChangeOf(file.loaded.stamp, stat);

    if (change === 'changed') {
      sidepad.state = PaneState.withFileReloaded(sidepad.state, await loadFile(host, path));
      await ensureWindow(sidepad);
    } else if (change === 'gone') {
      const directory = await nearestDirectory(host, Paths.parentOf(path), cwd);
      const listing = await listDirectory(host, directory);

      sidepad.state = PaneState.withDirectory(
        sidepad.state,
        directory,
        listing,
        '',
        Names.goneNoteOf(Paths.shownPathOf(path, cwd)),
      );
    }

    return;
  }

  if (page.kind === 'directory') {
    const directory = await nearestDirectory(host, page.path, cwd);
    const listing = await listDirectory(host, directory);

    sidepad.state =
      directory === page.path
        ? PaneState.withDirectoryRelisted(sidepad.state, listing)
        : PaneState.withDirectory(
            sidepad.state,
            directory,
            listing,
            '',
            Names.goneNoteOf(Paths.shownPathOf(page.path, cwd)),
          );
  }
}
