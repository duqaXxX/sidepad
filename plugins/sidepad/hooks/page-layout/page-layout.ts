import type BlockLayout from '../block-layout';

/** One block placed on the page: the page row its first row draws on, and what it draws. */
export type PlacedBlock = { firstRow: number; layout: BlockLayout.BlockLayout };

/** A formatted Markdown file laid out at a width: every block placed, and the rows they take. */
export type PageLayout = {
  /** The file's blocks, in order; one entry per block, whatever it draws. */
  blocks: readonly PlacedBlock[];
  /** The page's rows in all, the blank row between two blocks included. */
  rows: number;
};

/** One segment of the page's window: where it starts, the rows it draws, and what it draws. */
export type PlacedSegment = { firstRow: number; rows: number; segment: BlockLayout.Segment };
