import type LineRange from '../../line-range';
import type MarkdownBlocks from '../../markdown-blocks';
import type Tables from '../../tables';

/**
 * How a file the pane composes a page for is shown: a Markdown file drawn by its blocks, or a
 * delimited file drawn as a table. Both kinds are drawn two ways, `formatted` and the file's own
 * lines under `Source`, and the top row switches between them. `blocks` is what a click selects, by
 * source lines, and `top` is the composed page's 0-based first row shown.
 */
export type PageView = {
  mode: 'formatted' | 'source';
  /** Never negative: a transition sets it to a block's first row or to a top clamped to the page. */
  top: number;
} & (
  | { kind: 'markdown'; blocks: readonly MarkdownBlocks.MarkdownBlock[] }
  | {
      kind: 'table';
      /** The parsed table the page draws; its records are the blocks, one for one. */
      table: Tables.Table;
      blocks: readonly LineRange.LineRange[];
    }
);
