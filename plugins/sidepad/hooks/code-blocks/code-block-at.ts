import type LineRange from '../line-range';
import { bracketBalanceOf } from './bracket-balance-of';

const indentOf = (line: string) => line.length - line.trimStart().length;
const isBlank = (line: string | undefined) => line === undefined || line.trim() === '';

/**
 * The block a click on a line of code selects, for any language, with no parser:
 * 1. a line that leaves brackets open: through the line that closes them;
 * 2. else a line followed by more indented lines: with them (Python, YAML);
 * 3. else its paragraph: the lines around it up to a blank line, never past a line less indented
 *    than the clicked one (the enclosing block's opener or closer).
 *
 * LIMIT: over a window of a file too large to read whole, a block stops at the window's edges.
 *
 * @param lines the lines held, `firstLine` first
 * @param line the clicked line, 1-based
 * @param firstLine the file's 0-based line of `lines[0]`
 * @returns the block, at least the clicked line
 */
export function codeBlockAt(lines: readonly string[], line: number, firstLine = 0): LineRange.LineRange {
  const index = line - 1 - firstLine;
  const text = lines[index];

  if (text === undefined || isBlank(text)) {
    return { start: line, end: line };
  }

  let balance = bracketBalanceOf(text);

  if (balance > 0) {
    let end = index;

    while (balance > 0 && end + 1 < lines.length) {
      end += 1;
      balance += bracketBalanceOf(lines[end]!);
    }

    return { start: line, end: end + 1 + firstLine };
  }

  const base = indentOf(text);
  let next = index + 1;

  while (next < lines.length && isBlank(lines[next])) {
    next += 1;
  }

  if (next < lines.length && indentOf(lines[next]!) > base) {
    let end = next;

    while (end + 1 < lines.length && (isBlank(lines[end + 1]) || indentOf(lines[end + 1]!) > base)) {
      end += 1;
    }

    while (end > index && isBlank(lines[end])) {
      end -= 1;
    }

    return { start: line, end: end + 1 + firstLine };
  }

  const belongs = (at: number) => !isBlank(lines[at]) && indentOf(lines[at]!) >= base;
  let start = index;
  let end = index;

  while (start > 0 && belongs(start - 1)) {
    start -= 1;
  }

  while (end + 1 < lines.length && belongs(end + 1)) {
    end += 1;
  }

  return { start: start + 1 + firstLine, end: end + 1 + firstLine };
}
