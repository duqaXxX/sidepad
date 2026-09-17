/**
 * The lines a window command printed: its output split, the empty piece a trailing newline leaves
 * dropped, so a window's lines are the file's lines and nothing more.
 *
 * @returns the lines, in order
 */
export const windowLinesOf = (stdout: string) => (stdout.endsWith('\n') ? stdout.slice(0, -1) : stdout).split('\n');
