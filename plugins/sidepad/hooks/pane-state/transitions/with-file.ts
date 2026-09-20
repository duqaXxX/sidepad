import type Files from '../../files';
import Window from '../../window';
import { blockOfLine, markdownPageOf } from '../select';
import type { MarkdownView, PaneState } from '../types';
import { clamped } from './clamped';
import { fileViewOf, markdownModeOf } from './file-view-of';
import { withoutSelection } from './without-selection';

/**
 * The page's first row when a file opens: the first row of the block holding the line jumped to.
 *
 * The page is read from the state the file has already landed in, so it is laid out with that
 * file's own pictures; read from the state before, a page naming a picture was placed with the
 * pictures of the file it replaces. Before a drawing has reported a width the row comes from the
 * cheap one row a block page, and the first drawing reads it back as the same block.
 *
 * @param opened the state the file has landed in
 * @param view that file's view, whose blocks the line is looked up in
 * @param line the 1-based line jumped to
 * @returns the 0-based page row
 */
function topRowOf(opened: PaneState, view: MarkdownView, line: number): number {
  return markdownPageOf(opened)?.blocks[blockOfLine(view.blocks, line)]?.firstRow ?? 0;
}

/**
 * The file page on a file just read: at its first line, or a few lines above `line`; a Markdown file
 * keeps the formatted or source mode the last one had. The selection is cleared.
 *
 * @param line the 1-based line to jump to, null for the top
 * @returns the state
 */
export function withFile(state: PaneState, loaded: Files.LoadedFile, line: number | null): PaneState {
  const file = {
    loaded,
    top: line === null ? 0 : Window.jumpTopOf(line),
    markdown: fileViewOf(loaded, markdownModeOf(state)),
  };
  const opened: PaneState = { ...withoutSelection(state), page: { kind: 'file' }, file };
  const view = file.markdown;

  return clamped(
    line === null || view === null
      ? opened
      : { ...opened, file: { ...file, markdown: { ...view, top: topRowOf(opened, view, line) } } },
  );
}
