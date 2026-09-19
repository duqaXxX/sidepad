import type Tables from '../tables';

/** What the hooks hand one Markdown block's Client. */
export type BlockViewProps = {
  /** The block's index in the file; the Client's key carries it too, so an instance keeps one index. */
  index: number;
  /** The block's source, handed to `Markdown`; empty when `note` stands in for it. */
  text: string;
  /** A table the pane draws itself, at the page's width; null for every other block. */
  table: readonly Tables.TableRow[] | null;
  /** A dim line drawn instead of the block, when the engine would refuse to render it. */
  note: string | null;
  isSelected: boolean;
};
