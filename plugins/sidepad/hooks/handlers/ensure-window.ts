import Files from '../files';
import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import { readLineWindow } from './read-line-window';

/**
 * The window a windowed file's page wants, read and put in place, then the pane drawn again. One read
 * at a time: a scroll while one runs is served by the read that follows it, so a spin of the wheel
 * costs one read per landed window rather than one per tick.
 */
export async function ensureWindow(sidepad: Sidepad.Sidepad): Promise<void> {
  if (sidepad.isReading) {
    return;
  }

  sidepad.isReading = true;

  // The window this pass last read. A read that leaves `isWindowHeld` unsatisfied (a line count
  // stale because the file shrank on disk) would otherwise be repeated for the same window until
  // the guard runs out, spawning one command per turn of the loop.
  let read: { top: number; rows: number } | null = null;

  try {
    for (let guard = 0; guard < 100; guard += 1) {
      const file = sidepad.state.file;
      const rows = PaneState.windowRowsOf(sidepad.state);

      if (!file || sidepad.state.page.kind !== 'file' || Files.isWindowHeld(file.loaded, file.top, rows)) {
        return;
      }

      const top = file.top;

      if (read !== null && read.top === top && read.rows === rows) {
        return;
      }

      const lines = await readLineWindow(sidepad.host, file.loaded.path, top, rows);

      read = { top, rows };

      if (lines === null) {
        return;
      }

      // The loaded file itself, not its path: an edit during the read reloads the same path into a
      // new `loaded`, and these lines are the ones from before it.
      if (sidepad.state.file?.loaded === file.loaded) {
        sidepad.state = PaneState.withFileWindow(sidepad.state, top, lines);
        sidepad.host.invalidate();
      }
    }
  } finally {
    sidepad.isReading = false;
  }
}
