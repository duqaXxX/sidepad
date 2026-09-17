/** One row of a list page: a directory entry, or a file Claude edited. */
export type ListingRow = {
  kind: 'dir' | 'file' | 'other';
  /** The absolute path the row leads to. */
  path: string;
  /** What the row shows. */
  name: string;
};
