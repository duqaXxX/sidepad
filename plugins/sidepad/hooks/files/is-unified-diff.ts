/** A hunk header, which is what tells a unified diff from a file that merely has `+` lines. */
const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/;

/**
 * Whether lines read as a unified diff: at least one `@@ -a,b +c,d @@` header.
 *
 * @param lines the file's lines
 * @returns true when one line is a hunk header
 */
export const isUnifiedDiff = (lines: readonly string[]): boolean => lines.some((line) => HUNK_HEADER.test(line));
