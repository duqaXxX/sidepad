import MarkdownBlocks from '../markdown-blocks';
import type { Table, TableAlign } from './table';

const ALIGN: Readonly<Record<string, TableAlign>> = {
  'text-align:left': 'left',
  'text-align:right': 'right',
  'text-align:center': 'center',
};

/** A cell's text with its inline markup dropped: what is left to read when nothing draws it. */
function plainTextOf(token: { children?: readonly { type: string; content: string }[] | null }): string {
  return (token.children ?? [])
    .map((child) =>
      child.type === 'text' || child.type === 'code_inline' ? child.content : child.type === 'softbreak' ? ' ' : '',
    )
    .join('');
}

/**
 * The table a block holds: its alignments, its header cells and its body rows, each cell as plain
 * text.
 *
 * LIMIT: a cell's inline markup is dropped, so bold, code and a link's target read as plain words.
 *
 * @param lines the block's source lines
 * @returns the table, or null when the lines hold none
 */
export function tableOf(lines: readonly string[]): Table | null {
  const align: TableAlign[] = [];
  const rows: string[][] = [];
  let header: string[] | null = null;
  let row: string[] | null = null;
  let isHeader = false;

  for (const token of MarkdownBlocks.parser.parse(lines.join('\n'), {})) {
    switch (token.type) {
      case 'thead_open':
        isHeader = true;
        break;
      case 'thead_close':
        isHeader = false;
        break;
      case 'tr_open':
        row = [];
        break;
      case 'tr_close':
        if (row === null) break;
        if (isHeader && header === null) header = row;
        else rows.push(row);
        row = null;
        break;
      case 'th_open':
      case 'td_open': {
        const style = token.attrs?.find(([name]) => name === 'style')?.[1];
        if (isHeader) align.push((style === undefined ? undefined : ALIGN[style]) ?? 'left');
        break;
      }
      case 'inline':
        row?.push(plainTextOf(token).trim());
        break;
      default:
        break;
    }
  }

  return header === null ? null : { align, header, rows };
}
