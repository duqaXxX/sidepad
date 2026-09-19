/** How a table's column is aligned, as its delimiter row asks. */
export type TableAlign = 'left' | 'right' | 'center';

/** A table read from a Markdown block: one alignment and one header cell per column. */
export type Table = {
  align: readonly TableAlign[];
  header: readonly string[];
  rows: readonly (readonly string[])[];
};

/** One drawn row of a table: its text, and whether it is the header's. */
export type TableRow = { text: string; isHeader: boolean };
