import type Files from '../../files';
import Window from '../../window';
import { blockOfLine, pageOfView } from '../select';
import type { MarkdownView, PaneState } from '../types';
import { clamped } from './clamped';
import { fileViewOf, markdownModeOf } from './file-view-of';
import { withoutSelection } from './without-selection';

/**
 * The page's first row when a file opens: the first row of the block holding the line jumped to.
 * Before a drawing has reported a width that row comes from the cheap one row a block page, and the
 * first drawing reads it back as the same block.
 */
function topRowOf(state: PaneState, view: MarkdownView, lines: readonly string[], line: number): number {
  return pageOfView(state, view, lines).blocks[blockOfLine(view.blocks, line)]?.firstRow ?? 0;
}

/**
 * The file page on a file just read: at its first line, or a few lines above `line`; a Markdown file
 * keeps the formatted or source mode the last one had. The selection is cleared.
 *
 * @param line the 1-based line to jump to, null for the top
 * @returns the state
 */
export function withFile(state: PaneState, loaded: Files.LoadedFile, line: number | null): PaneState {
  const view = fileViewOf(loaded, markdownModeOf(state));
  const markdown: MarkdownView | null = view && {
    ...view,
    top: line === null ? 0 : topRowOf(state, view, loaded.lines, line),
  };

  return clamped({
    ...withoutSelection(state),
    page: { kind: 'file' },
    file: { loaded, top: line === null ? 0 : Window.jumpTopOf(line), markdown },
  });
}
