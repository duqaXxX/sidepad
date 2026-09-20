/** What the formatted page's Client knows of the window it draws part of. */
export type PageWindow = {
  /** The page's 0-based row the window's first row draws. */
  firstRow: number;
  /** The rows the window draws, over every Client a picture cuts it into. */
  rowCount: number;
  /** The page's rows in all. */
  totalRows: number;
  /** The page's 0-based row this Client's own first row draws; `y` is relative to that one. */
  clientFirstRow: number;
};
