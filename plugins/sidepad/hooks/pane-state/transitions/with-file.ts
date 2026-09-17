import type Files from '../../files';
import MarkdownBlocks from '../../markdown-blocks';
import Window from '../../window';
import { blockOfLine } from '../select';
import type { MarkdownView, PaneState } from '../types';
import { clamped } from './clamped';
import { withoutSelection } from './without-selection';

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
    blockRows: {},
    blockTop: line === null ? 0 : blockOfLine(blocks, line),
  };

  return clamped({
    ...withoutSelection(state),
    page: { kind: 'file' },
    file: { loaded, top: line === null ? 0 : Window.jumpTopOf(line), markdown },
  });
}
