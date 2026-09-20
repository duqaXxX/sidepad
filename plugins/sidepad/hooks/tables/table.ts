/** How a table's column is aligned, as its delimiter row asks. */
export type TableAlign = 'left' | 'right' | 'center';

/** A table read from a Markdown block: one alignment and one header cell per column. */
export type Table = {
  align: readonly TableAlign[];
  header: readonly string[];
  rows: readonly (readonly string[])[];
};

/** One drawn row of a table: its text, whether it is the header's, and the body row it draws. */
export type TableRow = {
  text: string;
  isHeader: boolean;
  /** The 0-based row of `Table.rows` this draws; -1 for the header and for a rule. */
  body: number;
};
