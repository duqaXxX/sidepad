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

/**
 * A synthetic Markdown page that names two pictures on their own: one the disk has, one it does not.
 * The second stays the `alt (src)` text a picture the pane cannot draw has always shown.
 */
export const SAMPLE_PAGE_WITH_IMAGE = [
  '# Shot', //                1
  '', //                      2
  'Before it.', //            3
  '', //                      4
  '![the logo](./logo.png)', //  5
  '', //                      6
  '![missing](./gone.png)', //   7
  '', //                      8
  'After it.', //             9
].join('\n');
