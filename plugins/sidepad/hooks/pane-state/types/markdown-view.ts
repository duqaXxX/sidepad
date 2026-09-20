import type LineRange from '../../line-range';
import type MarkdownBlocks from '../../markdown-blocks';
import type Tables from '../../tables';

/**
 * How a file whose page the pane composes row by row is shown: a Markdown file formatted or by its
 * source, a delimited file as a table. `blocks` is what a click selects, by source lines, and `top`
 * is the page's 0-based first row shown.
 */
export type MarkdownView =
  | {
      kind: 'markdown';
      mode: 'formatted' | 'source';
      blocks: readonly MarkdownBlocks.MarkdownBlock[];
      top: number;
    }
  | {
      kind: 'table';
      /** The parsed table the page draws; its rows are the blocks, record for record. */
      table: Tables.Table;
      blocks: readonly LineRange.LineRange[];
      top: number;
    };
