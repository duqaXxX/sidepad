/** A synthetic Markdown file: heading, paragraph, table, list, fence with a blank line, and blank lines at its end. */
export const SAMPLE_MARKDOWN = [
  '# Notes', //          1
  '', //                 2
  'A paragraph', //      3
  'on two lines.', //    4
  '', //                 5
  '| a | b |', //        6
  '|---|---|', //        7
  '| 1 | 2 |', //        8
  '', //                 9
  '- one', //            10
  '- two', //            11
  '', //                 12
  '```ts', //            13
  'const a = 1;', //     14
  '', //                 15
  'const b = 2;', //     16
  '```', //              17
  '', //                 18
].join('\n');
