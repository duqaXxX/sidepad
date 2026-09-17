import type { MarkdownBlock } from './markdown-block';

const FENCE = /^\s{0,3}(```|~~~)/;
const HEADING = /^\s{0,3}#{1,6}(\s|$)/;
const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s+/;
const TABLE_ROW = /^\s*\|/;
const QUOTE = /^\s{0,3}>/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;

const isBlank = (line: string | undefined) => line === undefined || line.trim() === '';

/**
 * A Markdown file cut into the blocks a person selects: a fenced code block whole (its blank lines
 * included), a heading alone, a rule alone, consecutive table rows, consecutive quote lines, a list
 * with its indented continuation lines, and paragraphs between blank lines. Blank lines between
 * blocks belong to none.
 *
 * LIMIT: a CommonMark subset: no setext headings, no HTML blocks, no lazy continuation of a list
 * item by an unindented line.
 *
 * @returns the blocks in order
 */
export function markdownBlocksOf(lines: readonly string[]): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]!;
    const start = index + 1;

    if (isBlank(line)) {
      index += 1;
      continue;
    }

    const fence = FENCE.exec(line);

    if (fence) {
      let end = index + 1;

      while (end < lines.length && !lines[end]!.trimStart().startsWith(fence[1]!)) {
        end += 1;
      }

      index = Math.min(end, lines.length - 1) + 1;
      blocks.push({ kind: 'code', start, end: index });
      continue;
    }

    if (HEADING.test(line) || RULE.test(line)) {
      blocks.push({ kind: HEADING.test(line) ? 'heading' : 'rule', start, end: start });
      index += 1;
      continue;
    }

    const kind: MarkdownBlock['kind'] = TABLE_ROW.test(line)
      ? 'table'
      : QUOTE.test(line)
        ? 'quote'
        : LIST_ITEM.test(line)
          ? 'list'
          : 'paragraph';

    index += 1;

    while (index < lines.length && !isBlank(lines[index])) {
      const next = lines[index]!;
      const isSameBlock =
        kind === 'table'
          ? TABLE_ROW.test(next)
          : kind === 'quote'
            ? QUOTE.test(next)
            : kind === 'list'
              ? LIST_ITEM.test(next) || /^\s+\S/.test(next)
              : !(
                  FENCE.test(next) ||
                  HEADING.test(next) ||
                  TABLE_ROW.test(next) ||
                  LIST_ITEM.test(next) ||
                  RULE.test(next)
                );

      if (!isSameBlock) {
        break;
      }

      index += 1;
    }

    blocks.push({ kind, start, end: index });
  }

  return blocks;
}
