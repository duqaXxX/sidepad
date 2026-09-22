import type {
  CommandSpec,
  FsEntry,
  FsStat,
  PaneCloseArgs,
  PaneOpenArgs,
  ProcessRunInit,
  ProcessRunResult,
  UiOpenResult,
  UiPane,
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
  /** `$.fs.read` with `{ as: 'bytes' }`, resolved to its `base64`; rejects when the file is missing. */
  readBytes: (path: string) => Promise<string>;
  /** `$.fs.list`: one directory's entries. */
  list: (path: string) => Promise<readonly FsEntry[]>;
  /** `$.process.run`: a window of a file too large for `$.fs.read`, read with `sed`. */
  run: (argv: readonly string[], init?: ProcessRunInit) => Promise<ProcessRunResult>;
  /** `$.store.get`. */
  storeGet: (key: string) => Promise<unknown>;
  /** `$.store.set`. */
  storeSet: (key: string, value: unknown) => Promise<void>;
  /**
   * The value of `$.config.list()`'s `theme` row: Claude Code's theme as the person set it, `auto`
   * included; rejects when the list cannot be read.
   */
  claudeTheme: () => Promise<string | null>;
  /** `$.ui.invalidate('ui.render')`: the pane draws again. */
  invalidate: () => void;
  /** `$.ui.status`: the plugin's line under the prompt. */
  status: (text: string | undefined) => void;
  /** `$.ui.open`. */
  openPane: (pane: PaneOpenArgs) => Promise<UiOpenResult>;
  /** `$.ui.close`. */
  closePane: (pane: PaneCloseArgs) => Promise<void>;
  /** `$.ui.panes`: the engine's record of the plugin's open panes, which outlives a reload. */
  panes: () => Promise<readonly UiPane[]>;
  /** `$.command.register`. */
  registerCommand: (spec: CommandSpec) => Promise<unknown>;
};
