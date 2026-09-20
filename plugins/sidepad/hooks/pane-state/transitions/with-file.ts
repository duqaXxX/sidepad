import type Files from '../../files';
import MarkdownBlocks from '../../markdown-blocks';
import Window from '../../window';
import { blockOfLine, pageOfBlocks } from '../select';
import type { MarkdownView, PaneState } from '../types';
import { clamped } from './clamped';
import { withoutSelection } from './without-selection';

/**
 * The formatted page's first row when a file opens: the first row of the block holding the line
 * jumped to. Before a drawing has reported a width that row comes from the cheap one row a block
 * page, and the first drawing reads it back as the same block.
 */
function topRowOf(
  state: PaneState,
  blocks: readonly MarkdownBlocks.MarkdownBlock[],
  lines: readonly string[],
  line: number,
): number {
  return pageOfBlocks(state, blocks, lines).blocks[blockOfLine(blocks, line)]?.firstRow ?? 0;
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
    top: line === null ? 0 : topRowOf(state, blocks, loaded.lines, line),
  };

  return clamped({
    ...withoutSelection(state),
    page: { kind: 'file' },
    file: { loaded, top: line === null ? 0 : Window.jumpTopOf(line), markdown },
  });
}
