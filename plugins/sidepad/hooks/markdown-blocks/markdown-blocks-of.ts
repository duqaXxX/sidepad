import type { MarkdownBlock } from './markdown-block';
import { parser } from './parser';

/** markdown-it's block tokens, by the kind of block a person selects; any other block is a paragraph. */
const KINDS: Readonly<Record<string, MarkdownBlock['kind']>> = {
  heading_open: 'heading',
  paragraph_open: 'paragraph',
  bullet_list_open: 'list',
  ordered_list_open: 'list',
  table_open: 'table',
  fence: 'code',
  code_block: 'code',
  blockquote_open: 'quote',
  hr: 'rule',
  html_block: 'html',
};

/**
 * A Markdown file cut into the blocks a person selects: the top-level blocks markdown-it finds
 * (CommonMark and GFM tables), each on the source lines it covers, its trailing blank lines left
 * out. Blank lines between blocks belong to none. markdown-it is vendored under `hooks/vendor/`.
 *
 * @returns the blocks in order
 */
export function markdownBlocksOf(lines: readonly string[]): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];

  for (const token of parser.parse(lines.join('\n'), {})) {
    const kind = token.level === 0 ? KINDS[token.type] : undefined;
    if (!kind || !token.map) continue;

    // A token's map is [first, past-the-last), 0-based, and a list's reaches over the blank line
    // that ends it.
    const [first, past] = token.map;
    let end = past;

    while (end > first + 1 && (lines[end - 1] ?? '').trim() === '') {
      end -= 1;
    }

    blocks.push({ kind, start: first + 1, end });
  }

  return blocks;
}
