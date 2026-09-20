/** What the formatted page's Client knows of the window it draws. */
export type PageWindow = {
  /** The page's 0-based row the Client's first row draws. */
  firstRow: number;
  /** The rows the Client draws. */
  rowCount: number;
  /** The page's rows in all. */
  totalRows: number;
};
