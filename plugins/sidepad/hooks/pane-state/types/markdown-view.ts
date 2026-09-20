import type MarkdownBlocks from '../../markdown-blocks';

/** How a Markdown file is shown: formatted by blocks, or its source by lines. */
export type MarkdownView = {
  mode: 'formatted' | 'source';
  blocks: readonly MarkdownBlocks.MarkdownBlock[];
  /** The formatted page's 0-based first row shown. */
  top: number;
};
