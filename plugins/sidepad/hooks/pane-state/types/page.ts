import type { FsEntry } from 'claude-code';

/** What the pane body shows: the open file, a directory's listing, or the files Claude edited. */
export type Page =
  | { kind: 'file' }
  | {
      kind: 'directory';
      path: string;
      entries: readonly FsEntry[];
      /** The row the page was entered from, marked `●`: the file or directory left behind. */
      cameFrom: string;
      /** The list window's 0-based first row. */
      top: number;
      /** A dim first row: what left the disk to bring the pane here. */
      note: string | null;
    }
  | { kind: 'edited'; cameFrom: string; top: number };
