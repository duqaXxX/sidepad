import type MarkdownBlocks from '../../markdown-blocks';

/** How a Markdown file is shown: formatted by blocks, or its source by lines. */
export type MarkdownView = {
  mode: 'formatted' | 'source';
  blocks: readonly MarkdownBlocks.MarkdownBlock[];
  /** Each block's rows as its Client reported them, by index. */
  blockRows: Readonly<Record<number, number>>;
  /** The first block the formatted page shows. */
  blockTop: number;
};
