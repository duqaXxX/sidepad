import type { ListingRow } from './listing-row';

/**
 * A row's label cut to a width: a directory with a trailing `/`, the row the person came from marked
 * `●`, an ellipsis when it does not fit.
 *
 * LIMIT: a cell per code point; a wide or combining character miscounts.
 *
 * @returns the label, at most `columns` code points
 */
export function listingLabelOf(row: ListingRow, isCameFrom: boolean, columns: number): string {
  const label = `${isCameFrom ? '●' : ' '} ${row.kind === 'dir' ? `${row.name}/` : row.name}`;
  const points = [...label];

  return points.length <= columns ? label : `${points.slice(0, Math.max(0, columns - 1)).join('')}…`;
}
