import type Files from '../../files';
import type { PaneState } from '../types';
import { clamped } from './clamped';
import { fileViewOf, markdownModeOf } from './file-view-of';
import { withFile } from './with-file';
import { withoutSelection } from './without-selection';

/**
 * The open file read again in place, as Claude's edit or a command left it: the window and the
 * Markdown mode kept, the blocks cut again, the selection cleared. The page is not changed.
 *
 * @returns the state; a different file than the open one opens as `withFile` does
 */
export function withFileReloaded(state: PaneState, loaded: Files.LoadedFile): PaneState {
  const file = state.file;

  if (!file || file.loaded.path !== loaded.path) {
    return withFile(state, loaded, null);
  }

  const view = fileViewOf(loaded, markdownModeOf(state));
  const markdown = view && { ...view, top: file.markdown?.top ?? 0 };

  return clamped({ ...withoutSelection(state), file: { loaded, top: file.top, markdown } });
}
