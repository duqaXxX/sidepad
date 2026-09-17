import type LineRange from '../line-range';
import Names from '../names';

/**
 * A selection as the context entry a prompt carries: the sentence naming the file and lines, then
 * each line as `<number>: <text>`, exactly as the file has it.
 *
 * @param path the file's absolute path
 * @param lines the lines held, `firstLine` first
 * @param range the selection
 * @param firstLine the file's 0-based line of `lines[0]`
 * @returns the entry's text
 */
export function askTextOf(path: string, lines: readonly string[], range: LineRange.LineRange, firstLine = 0): string {
  const body = lines
    .slice(range.start - 1 - firstLine, range.end - firstLine)
    .map((line, at) => `${range.start + at}: ${line}`);

  return [Names.askLeadOf(path, range.start, range.end), ...body].join('\n');
}
