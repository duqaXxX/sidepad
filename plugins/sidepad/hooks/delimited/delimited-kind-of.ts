// LIMIT: the separator is decided by the file's extension, so a .csv written with semicolons draws as one column.

/**
 * The separator a path's extension implies: `,` for `.csv`, `\t` for `.tsv`.
 *
 * @returns the separator string, or null when the path names neither extension. Case insensitive.
 */
export const delimitedKindOf = (path: string): ',' | '\t' | null => {
  const ext = /\.([^./\\]+)$/.exec(path)?.[1]?.toLowerCase();
  if (ext === 'csv') return ',';
  if (ext === 'tsv') return '\t';
  return null;
};
