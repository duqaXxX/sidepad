import type PageLayout from '../page-layout';

/**
 * What the hooks hand one Client of the formatted page: rows they composed themselves, never the
 * file, since a Client's props past 100,000 characters are refused.
 */
export type PageViewProps = {
  /** What the Client draws, in order; together they fill exactly `rows` rows. */
  segments: readonly PageLayout.PlacedSegment[];
  /** The page's 0-based row this Client's first row draws. */
  firstRow: number;
  /** The rows this Client draws. */
  rows: number;
  /** The page's 0-based first row the whole window shows, which a picture may cut into runs. */
  windowFirstRow: number;
  /** The rows the whole window shows: what tells a pointer past this Client from one past the page. */
  windowRows: number;
  /** The page's rows in all, so a drag past an edge knows whether the page can still move. */
  totalRows: number;
  /** The selected page rows, 0-based and both ends included; null with no selection. */
  range: { start: number; end: number } | null;
  /** Bumped by the hooks when they clear a selection: a new value drops the Client's drag. */
  epoch: number;
};
