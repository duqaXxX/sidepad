import type { FsEntry, FsStat } from 'claude-code';

import type Host from '../../hooks/host';
import { bytesOf } from './png';

/**
 * A Host over an in-memory disk, recording what the handlers asked of the engine. A directory exists
 * when a file lies under it.
 */
export function fakeHostOf(files: Record<string, string>) {
  const disk = new Map(Object.entries(files).map(([path, text]) => [path, { text, mtimeMs: 1 }]));
  const calls = { opened: 0, closed: 0, invalidated: 0, runs: 0, statuses: [] as (string | undefined)[] };
  const store = new Map<string, unknown>();
  const isDirectory = (path: string) => [...disk.keys()].some((file) => file.startsWith(`${path}/`));

  const host: Host.Host = {
    stat: async (path): Promise<FsStat> => {
      const file = disk.get(path);

      if (file) {
        return { kind: 'file', size: file.text.length, mtimeMs: file.mtimeMs, isLink: false };
      }

      if (isDirectory(path)) {
        return { kind: 'dir', size: 0, mtimeMs: 1, isLink: false };
      }

      throw new Error(`ENOENT: ${path}`);
    },
    read: async (path) => {
      const file = disk.get(path);

      if (!file) {
        throw new Error(`ENOENT: ${path}`);
      }

      return file.text;
    },
    readBytes: async (path) => {
      const file = disk.get(path);

      if (!file) {
        throw new Error(`ENOENT: ${path}`);
      }

      return bytesOf(file.text);
    },
    list: async (path) => {
      const names = new Map<string, FsEntry['kind']>();

      for (const file of disk.keys()) {
        if (file.startsWith(`${path}/`)) {
          const [name, ...rest] = file.slice(path.length + 1).split('/');

          names.set(name!, rest.length > 0 ? 'dir' : 'file');
        }
      }

      return [...names].map(([name, kind]) => ({ name, kind, size: 0, isLink: false }));
    },
    run: async (argv) => {
      calls.runs += 1;

      const path = argv.at(-1) ?? '';
      const text = disk.get(path)?.text;

      if (text === undefined) {
        return { exitCode: 1, stdout: '', stderr: `no such file: ${path}` };
      }

      const lines = text === '' ? [] : (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n');

      // `grep -c ''` counts lines, so a last line with no newline after it counts, and it exits 1
      // when it counted none. The count is printed alone: one file was named.
      if (argv[0] === 'grep') {
        return { exitCode: lines.length === 0 ? 1 : 0, stdout: `${lines.length}\n`, stderr: '' };
      }

      const window = /^(\d+),(\d+)p/.exec(String(argv[2]));

      if (argv[0] !== 'sed' || window === null) {
        return { exitCode: 127, stdout: '', stderr: 'command not found' };
      }

      return {
        exitCode: 0,
        stdout: `${lines.slice(Number(window[1]) - 1, Number(window[2])).join('\n')}\n`,
        stderr: '',
      };
    },
    storeGet: async (key) => store.get(key),
    storeSet: async (key, value) => {
      store.set(key, value);
    },
    invalidate: () => {
      calls.invalidated += 1;
    },
    status: (text) => {
      calls.statuses.push(text);
    },
    openPane: async () => {
      calls.opened += 1;
    },
    closePane: async () => {
      calls.closed += 1;
    },
    panes: async () => [],
    registerCommand: async () => undefined,
  };

  return {
    host,
    calls,
    remove: (path: string) => disk.delete(path),
    write: (path: string, text: string) => disk.set(path, { text, mtimeMs: (disk.get(path)?.mtimeMs ?? 0) + 1 }),
  };
}
