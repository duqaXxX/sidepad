import { IMAGE_CELL_ASPECT } from '../limits';

// LIMIT: the cell's aspect ratio is assumed (IMAGE_CELL_ASPECT), not measured; a picture may be a little taller or shorter on a terminal whose cells differ.

/**
 * The terminal cell box an image occupies.
 *
 * Width is `columns`, clamped to the 1..255 range `ImageProps.columns` accepts. Height is the
 * natural proportion rounded to the nearest row, then clamped to [1, maxRows].
 *
 * @returns `{ columns, rows }` where `columns` is in [1, 255] and `rows` is in [1, maxRows].
 */
export const imageBoxOf = (
  size: { width: number; height: number },
  columns: number,
  maxRows: number,
): { columns: number; rows: number } => {
  const cols = Math.min(Math.max(1, columns), 255);
  const natural = Math.round(((size.height / size.width) * cols) / IMAGE_CELL_ASPECT);
  const rows = Math.min(Math.max(1, natural), maxRows);
  return { columns: cols, rows };
};
