import Files from '../../hooks/files';
import PaneState from '../../hooks/pane-state';
import { CWD } from './cwd';

/**
 * A pane state built through the transitions: laid out at `rows` by `columns`, open, on `path` read
 * from `text` (none when omitted).
 */
export function stateOf(options: { path?: string; text?: string; rows?: number; columns?: number } = {}) {
  const laid = PaneState.laidOut(PaneState.afterOpened(PaneState.initialStateOf(CWD)), {
    rows: options.rows ?? 12,
    columns: options.columns ?? 80,
  });

  if (options.path === undefined || options.text === undefined) {
    return laid;
  }

  const stat = { kind: 'file' as const, size: options.text.length, mtimeMs: 1 };

  return PaneState.withFile(laid, Files.loadedFileOf(options.path, stat, options.text), null);
}
