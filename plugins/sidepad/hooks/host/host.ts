import type {
  CommandSpec,
  FsEntry,
  FsStat,
  PaneCloseArgs,
  PaneOpenArgs,
  ProcessRunInit,
  ProcessRunResult,
} from 'claude-code';

/**
 * The engine as `session.start` bound it from its `$`, each member spelled `$.noun.event(...)` there,
 * since the engine refuses a hooks module that stores `$` or passes a noun of it as a value. Used by
 * every later hook. `$.prompt.submit` is not here: one made through this `$` skips the plugin's own
 * `prompt.submit` hook, so it runs on the `$` of the hook handling the press.
 */
export type Host = {
  /** `$.fs.stat`; rejects when the path is missing. */
  stat: (path: string) => Promise<FsStat>;
  /** `$.fs.read`; rejects when the file is missing. */
  read: (path: string) => Promise<string>;
  /** `$.fs.list`: one directory's entries. */
  list: (path: string) => Promise<readonly FsEntry[]>;
  /** `$.process.run`: a window of a file too large for `$.fs.read`, read with `sed`. */
  run: (argv: readonly string[], init?: ProcessRunInit) => Promise<ProcessRunResult>;
  /** `$.store.get`. */
  storeGet: (key: string) => Promise<unknown>;
  /** `$.store.set`. */
  storeSet: (key: string, value: unknown) => Promise<void>;
  /** `$.ui.invalidate('ui.render')`: the pane draws again. */
  invalidate: () => void;
  /** `$.ui.status`: the plugin's line under the prompt. */
  status: (text: string | undefined) => void;
  /** `$.ui.open`. */
  openPane: (pane: PaneOpenArgs) => Promise<void>;
  /** `$.ui.close`. */
  closePane: (pane: PaneCloseArgs) => Promise<void>;
  /** `$.command.register`. */
  registerCommand: (spec: CommandSpec) => Promise<unknown>;
};
