import { parser } from './parser';

/** A line ending a paragraph's line on purpose: CommonMark's two spaces, or a backslash. */
const HARD_BREAK = /( {2,}|\\)$/;

/**
 * A block's source with the soft line breaks of its paragraphs flowed into spaces, which is what
 * CommonMark says a single line break inside a paragraph means. The engine's `Markdown` draws such a
 * break as a new row, so a file wrapped at a column would read as wrapped at that column whatever
 * the pane's width.
 *
 * A paragraph nested in a quote or a list item flows too, keeping the marker its first line carries.
 * A paragraph holding a hard break keeps every line it has, as do a fence, a table and a heading.
 *
 * @param lines the block's source lines
 * @returns the text to draw
 */
export function flowedTextOf(lines: readonly string[]): string {
  const flowed = [...lines];

  for (const token of parser.parse(lines.join('\n'), {})) {
    if (token.type !== 'inline' || !token.map || !token.content.includes('\n')) continue;

    const [first, past] = token.map;
    const paragraph = token.content.split('\n');
    const head = lines[first] ?? '';
    // The marker the paragraph sits behind (`- `, `> `, an indent), which its own text leaves out.
    const marker = head.slice(0, head.length - paragraph[0]!.length);

    if (!head.endsWith(paragraph[0]!) || paragraph.slice(0, -1).some((line) => HARD_BREAK.test(line))) continue;

    flowed[first] = marker + paragraph.map((line) => line.trim()).join(' ');
    for (let line = first + 1; line < past; line += 1) {
      flowed[line] = '';
    }
  }

  return flowed.filter((line, at) => line !== '' || (lines[at] ?? '') === '').join('\n');
}
