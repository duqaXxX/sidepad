import { describe, expect, test, tier } from 'claude-code/testing';

import Files from '../hooks/files';
import Handlers from '../hooks/handlers';
import type Host from '../hooks/host';
import PaneState from '../hooks/pane-state';
import { CWD, fakeHostOf, sidepadOf, stateOf } from './fixtures';

tier('user');

const PATH = `${CWD}/huge.log`;

/** A windowed file open on a page, as `loadFile` leaves one past the read cap. */
function windowedState(total: number, mtimeMs = 1) {
  const stat = { kind: 'file' as const, size: 9_000_000, mtimeMs };

  return PaneState.withFile(stateOf(), Files.windowedFileOf(PATH, stat, total), null);
}

/**
 * A host whose window reads hang until the test opens the gate, so a read can be left in flight
 * while the state moves under it. Every read answers with the same lines.
 */
function pausedHostOf(lines: string[]) {
  const { host } = fakeHostOf({ [PATH]: '' });
  const waiting: (() => void)[] = [];
  const count = { runs: 0 };
  let isOpen = false;

  const paused: Host.Host = {
    ...host,
    run: async () => {
      count.runs += 1;

      if (!isOpen) {
        await new Promise<void>((resolve) => waiting.push(resolve));
      }

      return { exitCode: 0, stdout: `${lines.join('\n')}\n`, stderr: '' };
    },
  };

  const open = () => {
    isOpen = true;

    for (const resolve of waiting.splice(0)) {
      resolve();
    }
  };

  return { host: paused, count, open };
}

describe('ensure-window', () => {
  test('a read that lands after the file was written again is dropped', async () => {
    // The guard used to compare paths. A reload keeps the path and swaps the loaded file, so lines
    // read before an edit were written into the file read after it, and stayed on screen for good.
    const { host, open } = pausedHostOf(['stale one', 'stale two']);
    const sidepad = sidepadOf(host, windowedState(400));
    const reading = Handlers.ensureWindow(sidepad);

    sidepad.state = PaneState.withFileReloaded(
      sidepad.state,
      Files.windowedFileOf(PATH, { kind: 'file', size: 9_000_001, mtimeMs: 2 }, 400),
    );

    open();
    await reading;

    expect(sidepad.state.file?.loaded.lines, 'they belong to the file as it was before the edit').toEqual([]);
  });

  test('a read that lands on the file it was started for is kept', async () => {
    const { host, open } = pausedHostOf(['one', 'two']);
    const sidepad = sidepadOf(host, windowedState(400));
    const reading = Handlers.ensureWindow(sidepad);

    open();
    await reading;

    expect(sidepad.state.file?.loaded.lines).toEqual(['one', 'two']);
  });

  test('a line count too high costs one read, not a hundred', async () => {
    // `total` says 400 lines and the file has 2, so `isWindowHeld` is never satisfied: the loop
    // used to spawn its command until the guard ran out, and the redraw started it over.
    const { host, count, open } = pausedHostOf(['one', 'two']);
    const sidepad = sidepadOf(host, windowedState(400));
    const reading = Handlers.ensureWindow(sidepad);

    open();
    await reading;

    expect(count.runs).toBe(1);
  });
});
