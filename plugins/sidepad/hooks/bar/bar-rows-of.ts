import type LineRange from '../line-range';
import { barLayoutOf } from './bar-layout-of';

/**
 * The rows the bar covers at the body's foot: one blank row, then the band's rows.
 *
 * @returns the count, 0 without a selection
 */
export const barRowsOf = (range: LineRange.LineRange | null, isAsking: boolean, columns: number) =>
  range === null ? 0 : 1 + barLayoutOf(range, isAsking, columns).length;
