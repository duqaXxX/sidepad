import CodeBlocks from '../../code-blocks';
import LineRange from '../../line-range';
import MarkdownBlocks from '../../markdown-blocks';
import type { PaneState } from '../types';
import { revealed } from './revealed';

/**
 * A click on a line of code or source: selects the block under it, the Markdown block in a Markdown
 * source, else the bracket, indentation or paragraph block of code; a click on the block that was
 * selected before the press clears it.
 *
 * @param line the clicked 1-based line
 * @returns the state
 */
export function withClick(state: PaneState, line: number): PaneState {
  const file = state.file;

  if (!file || state.page.kind !== 'file' || file.loaded.note !== null) {
    return state;
  }

  const block = file.markdown
    ? MarkdownBlocks.markdownBlockAt(file.markdown.blocks, line)
    : CodeBlocks.codeBlockAt(file.loaded.lines, line, file.loaded.from);

  // The press is read from the state when its own message arrived, and from the selection still
  // standing when it did not: `surface.post` delivers one message per frame, so a press and the
  // release that follows it in the same frame reach the hooks as the release alone.
  const before = state.press?.before ?? state.selection?.range ?? null;

  if (LineRange.isSameRange(before, block)) {
    return { ...state, selection: null, press: null, epoch: state.epoch + 1 };
  }

  return revealed({ ...state, selection: { range: block, head: block.end, isAsking: false }, press: null });
}
