/** Lines of a file, 1-based, both ends included. */
export type LineRange = { start: number; end: number };

/**
 * Whether two ranges name the same lines; null never equals anything.
 *
 * @returns true when both are ranges with the same ends
 */
export const isSameRange = (a: LineRange | null, b: LineRange | null) =>
  a !== null && b !== null && a.start === b.start && a.end === b.end;
