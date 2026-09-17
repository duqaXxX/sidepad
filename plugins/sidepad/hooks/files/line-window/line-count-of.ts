/**
 * The line count the counting command printed. It counts one file, so the number stands alone, but a
 * `grep` that names the file would put it first and the first number in the output is still it.
 *
 * @returns the count, or null when the output holds none
 */
export function lineCountOf(stdout: string): number | null {
  const first = /-?\d+/.exec(stdout);
  const count = first === null ? Number.NaN : Number(first[0]);

  return Number.isInteger(count) && count >= 0 ? count : null;
}
