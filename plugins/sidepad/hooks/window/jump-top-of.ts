import Limits from '../limits';

/**
 * The window's first line when the pane jumps to an edit: a few lines of context above the first
 * changed line.
 *
 * @param line the first changed line, 1-based
 * @returns the 0-based first line, before clamping
 */
export const jumpTopOf = (line: number) => Math.max(0, line - 1 - Limits.JUMP_CONTEXT_LINES);
