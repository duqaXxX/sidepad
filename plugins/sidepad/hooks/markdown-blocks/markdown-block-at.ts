import type LineRange from '../line-range';
import type { MarkdownBlock } from './markdown-block';

/**
 * What a click on a source line of Markdown selects: the block holding it, else the line alone (a
 * blank line between blocks).
 *
 * @returns the range, at least the line
 */
export function markdownBlockAt(blocks: readonly MarkdownBlock[], line: number): LineRange.LineRange {
  const block = blocks.find((candidate) => candidate.start <= line && line <= candidate.end);

  return block ? { start: block.start, end: block.end } : { start: line, end: line };
}
