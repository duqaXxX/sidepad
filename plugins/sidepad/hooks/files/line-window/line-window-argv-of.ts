/**
 * The command that prints one window of a file's lines: `sed` quits at the line after the window,
 * so a window near the top costs a fraction of the file (2 ms at line 1 of an 84 MB file, 87 ms at
 * its end; `awk` took 10 times as long).
 *
 * @param from the first line, 1-based
 * @param to the last line, 1-based and included
 * @returns the argv, the executable first
 */
export const lineWindowArgvOf = (path: string, from: number, to: number) => [
  'sed',
  '-n',
  `${Math.max(1, from)},${Math.max(1, to)}p;${Math.max(1, to) + 1}q`,
  path,
];
