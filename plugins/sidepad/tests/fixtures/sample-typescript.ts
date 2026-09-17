/** A synthetic TypeScript file with blank lines inside it and at its end. */
export const SAMPLE_TYPESCRIPT = [
  'import { total } from "./total";', //   1
  '', //                                   2
  'export function report(values: number[]) {', // 3
  '  const sum = total(', //               4
  '    values,', //                        5
  '  );', //                               6
  '', //                                   7
  '  log(sum);', //                        8
  '  return sum;', //                      9
  '}', //                                  10
  '', //                                   11
  '', //                                   12
].join('\n');
