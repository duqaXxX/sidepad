import type { Args, FsEntry, On, RenderElement } from 'claude-code';
import { mock } from 'claude-code/testing';

import { bytesOf } from './png';

/** What the engine draws for a pane, or for the hint line, beneath the plugin. */
const DRAWN: RenderElement = { type: 'Text', children: [''] };

/**
 * The world beneath the mod for engine-driven tests: an in-memory disk answering `fs.*`, the pane
 * calls recorded, a Write or Edit answered with a record that changed the given line, a Bash call
 * answered, and the store in memory.
 *
 * @param isNarrow the terminal is narrower than the floor the engine gives a pane nobody asked for:
 *   an open without `focus` waits undrawn, as `$.ui.open` answers and `$.ui.panes()` lists it
 */
export function worldOf(on: On, files: Record<string, string>, stored: Record<string, unknown> = {}, isNarrow = false) {
  const disk = new Map(Object.entries(files).map(([path, text]) => [path, { text, mtimeMs: 1 }]));
  const opened: Args<'ui.open'>[] = [];
  const closed: Args<'ui.close'>[] = [];
  const submitted: string[] = [];
  const up = new Map<string, { pane: Args<'ui.open'>; isPlaced: boolean }>();
  const isDirectory = (path: string) => [...disk.keys()].some((file) => file.startsWith(`${path}/`));

  on('session.start', ($, e) => ({ cwd: e.cwd }));
  on('command.register', ($, e) => ({ value: { command: e.name } }));
  on('fs.stat', ($, e) => {
    const file = disk.get(e.path);

    if (file) {
      return { value: { kind: 'file', size: file.text.length, mtimeMs: file.mtimeMs, isLink: false } };
    }

    if (isDirectory(e.path)) {
      return { value: { kind: 'dir', size: 0, mtimeMs: 1, isLink: false } };
    }

    throw new Error(`ENOENT: ${e.path}`);
  });
  on('fs.read', ($, e) => {
    const file = disk.get(e.path);

    if (!file) {
      throw new Error(`ENOENT: ${e.path}`);
    }

    return { value: e.as === 'bytes' ? { base64: bytesOf(file.text) } : file.text };
  });
  on('fs.list', ($, e) => {
    const names = new Map<string, FsEntry['kind']>();

    for (const file of disk.keys()) {
      if (file.startsWith(`${e.path}/`)) {
        const [name, ...rest] = file.slice(`${e.path}/`.length).split('/');

        names.set(name!, rest.length > 0 ? 'dir' : 'file');
      }
    }

    return { value: [...names].map(([name, kind]) => ({ name, kind, size: 0, isLink: false })) };
  });
  // The engine judges an open asked by the person's input, which its arguments do not carry; sidepad
  // asks for the keyboard exactly when the person asked for the pane, so `focus` stands for it here.
  on('ui.open', ($, e) => {
    const isPlaced = !isNarrow || e.focus === true || up.get(e.id)?.isPlaced === true;

    opened.push(e);
    up.set(e.id, { pane: e, isPlaced });

    return {
      value: isPlaced
        ? { isPlaced: true }
        : {
            isPlaced: false,
            reason:
              'unasked below 144 columns (120 now): placed when the person opens it, or when the terminal is widened to 144 columns',
          },
    };
  });
  on('ui.close', ($, e) => {
    closed.push(e);
    up.delete(e.id);

    return { value: undefined };
  });
  // The engine's record of the plugin's open panes, which a reloaded module reads back.
  on('ui.panes', () => ({
    value: [...up.values()].map(({ pane, isPlaced }) => ({
      id: pane.id,
      title: pane.title ?? pane.id,
      isShown: isPlaced,
      isFocused: false,
      isPlaced,
    })),
  }));
  // The kit's engine answers it: a drawing `$.ui.mount` holds redraws on the plugin's invalidate.
  on('ui.invalidate', ($, e, next) => next(e));
  on('ui.status', () => ({ value: undefined }));
  on('ui.render', { component: 'Pane' }, () => DRAWN);
  on('ui.render', { component: 'PromptHint' }, () => DRAWN);
  on('turn.complete', () => ({ text: '' }));
  on('command.run', { command: ['help', 'clear', 'resume'] }, () => ({ text: '' }));
  on('session.end', ($, e) => ({ sessionId: e.sessionId }));
  on('prompt.submit', ($, e) => {
    submitted.push(e.text);

    return { text: e.text, context: e.context };
  });
  mock.store(on, stored);

  return {
    opened,
    closed,
    submitted,
    remove: (path: string) => disk.delete(path),
    write: (path: string, text: string) => disk.set(path, { text, mtimeMs: (disk.get(path)?.mtimeMs ?? 0) + 1 }),
  };
}
