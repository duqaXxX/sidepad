import type Files from '../../files';
import MarkdownBlocks from '../../markdown-blocks';
import PageLayout from '../../page-layout';
import Window from '../../window';
import { blockOfLine, pageColumnsOf } from '../select';
import type { MarkdownView, PaneState } from '../types';
import { clamped } from './clamped';
import { withoutSelection } from './without-selection';

/**
 * The formatted page's first row when a file opens: its top, or the first row of the block holding
 * the line jumped to.
 */
function topRowOf(
  blocks: readonly MarkdownBlocks.MarkdownBlock[],
  lines: readonly string[],
  columns: number,
  line: number | null,
): number {
  if (line === null) {
    return 0;
  }

  return PageLayout.pageLayoutOf(blocks, lines, columns).blocks[blockOfLine(blocks, line)]?.firstRow ?? 0;
}

/**
 * The file page on a file just read: at its first line, or a few lines above `line`; a Markdown file
 * keeps the formatted or source mode the last one had. The selection is cleared.
 *
 * @param line the 1-based line to jump to, null for the top
 * @returns the state
 */
export function withFile(state: PaneState, loaded: Files.LoadedFile, line: number | null): PaneState {
  const blocks =
    loaded.kind === 'markdown' && loaded.note === null && loaded.source === 'whole'
      ? MarkdownBlocks.markdownBlocksOf(loaded.lines)
      : null;
  const markdown: MarkdownView | null = blocks && {
    mode: state.file?.markdown?.mode ?? 'formatted',
    blocks,
    top: topRowOf(blocks, loaded.lines, pageColumnsOf(state), line),
  };

  return clamped({
    ...withoutSelection(state),
    page: { kind: 'file' },
    file: { loaded, top: line === null ? 0 : Window.jumpTopOf(line), markdown },
  });
}
