import Files from '../files';
import Images from '../images';
import Limits from '../limits';
import type { MarkdownBlock } from '../markdown-blocks';
import MarkdownBlocks from '../markdown-blocks';
import Names from '../names';
import Paths from '../paths';
import type { Row, Span } from '../spans';
import { spansOf, wrappedRowsOf } from '../spans';
import Tables from '../tables';

/** What a run of the page draws: composed rows, a fence the engine highlights, or a picture. */
export type Segment =
  | { kind: 'rows'; rows: readonly Row[] }
  | { kind: 'code'; source: string; language: string | null; rows: number }
  | { kind: 'image'; path: string; alt: string; columns: number; rows: number; generation: number }
  | { kind: 'note'; text: string };
// Leave the type open to a case added later: never narrow a consumer with an exhaustive switch that
// has no default, or the case that comes next has to reopen every one of them.

/** One block, laid out at a width: its segments and the rows it occupies. */
export type BlockLayout = { segments: readonly Segment[]; rows: number };

/** The rows for a span list: wrapped and prefixed on each row by the leading span. */
function prefixedRows(prefix: Span, contentSpans: readonly Span[], columns: number, indent: number): Row[] {
  const rows = wrappedRowsOf(contentSpans, columns, { first: indent, rest: indent });

  if (rows.length === 0) {
    // An empty item still emits one row so the marker is visible.
    return [{ spans: [prefix] }];
  }

  return rows.map((row, at) =>
    at === 0 ? { spans: [prefix, ...row.spans] } : { spans: [{ text: ' '.repeat(indent) }, ...row.spans] },
  );
}

/** A heading's spans forced to bold so h1 and h2 match the engine's style without `#` characters. */
function boldAll(spans: readonly Span[]): Span[] {
  return spans.map((span) => ({ ...span, bold: true as const }));
}

/** All inline tokens found in `tokens`, in order. */
function inlineTokensOf(
  tokens: ReturnType<typeof MarkdownBlocks.parser.parse>,
): ReturnType<typeof MarkdownBlocks.parser.parseInline>[number][] {
  return tokens.filter((t) => t.type === 'inline');
}

/** Layout for a heading block: its inline content drawn bold, wrapping at `columns`. */
function layoutHeading(source: readonly string[], columns: number): BlockLayout {
  const tokens = MarkdownBlocks.parser.parse(source.join('\n'), {});
  const inline = inlineTokensOf(tokens)[0];
  const rows = inline ? wrappedRowsOf(boldAll(spansOf(inline)), columns, { first: 0, rest: 0 }) : [];

  return { segments: [{ kind: 'rows', rows }], rows: rows.length };
}

/** Layout for a paragraph block: its inline content wrapped at `columns`. */
function layoutParagraph(source: readonly string[], columns: number): BlockLayout {
  const tokens = MarkdownBlocks.parser.parse(source.join('\n'), {});
  const inline = inlineTokensOf(tokens)[0];
  const rows = inline ? wrappedRowsOf(spansOf(inline), columns, { first: 0, rest: 0 }) : [];

  return { segments: [{ kind: 'rows', rows }], rows: rows.length };
}

/** State for one level of a list being walked. */
type ListLevel = {
  isOrdered: boolean;
  count: number; // items opened so far at this level
  hasContent: boolean; // true after the first inline for the current item
};

/**
 * Layout for a list block: one row group per item, the marker at the left of the first row and
 * the continuation rows hanging at the marker's width. Nested lists add `LIST_NESTED_INDENT`
 * extra columns of indent per level.
 */
function layoutList(source: readonly string[], columns: number): BlockLayout {
  const tokens = MarkdownBlocks.parser.parse(source.join('\n'), {});
  const allRows: Row[] = [];
  const stack: ListLevel[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'bullet_list_open':
        stack.push({ isOrdered: false, count: 0, hasContent: false });
        break;
      case 'ordered_list_open':
        stack.push({ isOrdered: true, count: 0, hasContent: false });
        break;
      case 'bullet_list_close':
      case 'ordered_list_close':
        stack.pop();
        break;
      case 'list_item_open': {
        const level = stack[stack.length - 1];
        if (level) {
          level.count++;
          level.hasContent = false;
        }
        break;
      }
      case 'inline': {
        const depth = stack.length - 1;
        if (depth < 0) break; // not inside any list
        const level = stack[depth]!;
        const isFirst = !level.hasContent;
        level.hasContent = true;

        const extraIndent = depth * Limits.LIST_NESTED_INDENT;
        const markerText = level.isOrdered ? `${level.count}. ` : `${Names.BULLET_MARKER} `;
        const markerWidth = [...markerText].length;
        const totalIndent = extraIndent + markerWidth;

        // The prefix for the first row of this content block: the optional leading indent
        // and the marker, or blank spaces of the same width for a continuation paragraph.
        const prefixText = isFirst ? ' '.repeat(extraIndent) + markerText : ' '.repeat(totalIndent);
        const prefix: Span = { text: prefixText };

        allRows.push(...prefixedRows(prefix, spansOf(token), columns, totalIndent));
        break;
      }
      default:
        break;
    }
  }

  return { segments: [{ kind: 'rows', rows: allRows }], rows: allRows.length };
}

/**
 * Layout for a blockquote: each row of the inline content prefixed with `QUOTE_MARKER` in the
 * rule colour, the content wrapped at `columns - QUOTE_MARKER.length`.
 */
function layoutQuote(source: readonly string[], columns: number): BlockLayout {
  const tokens = MarkdownBlocks.parser.parse(source.join('\n'), {});
  const markerWidth = [...Names.QUOTE_MARKER].length;
  const innerColumns = Math.max(1, columns - markerWidth);
  const allRows: Row[] = [];

  for (const token of inlineTokensOf(tokens)) {
    const inner = wrappedRowsOf(spansOf(token), innerColumns, { first: 0, rest: 0 });

    for (const row of inner) {
      allRows.push({ spans: [{ text: Names.QUOTE_MARKER, color: Names.RULE }, ...row.spans] });
    }
  }

  return { segments: [{ kind: 'rows', rows: allRows }], rows: allRows.length };
}

/** Layout for a horizontal rule: one row of `─` repeated `columns` times. */
function layoutRule(columns: number): BlockLayout {
  const rows: Row[] = [{ spans: [{ text: '─'.repeat(columns), color: Names.RULE }] }];

  return { segments: [{ kind: 'rows', rows }], rows: 1 };
}

/** Layout for a fenced code block: a `code` segment with the fence's content and language. */
function layoutCode(source: readonly string[]): BlockLayout {
  for (const token of MarkdownBlocks.parser.parse(source.join('\n'), {})) {
    if (token.type !== 'fence' && token.type !== 'code_block') continue;

    const raw = token.content;
    // markdown-it includes a trailing newline in the content; strip it before counting lines.
    const content = raw.endsWith('\n') ? raw.slice(0, -1) : raw;
    const language = token.info.trim() || null;
    const rows = content === '' ? 0 : content.split('\n').length;

    return { segments: [{ kind: 'code', source: content, language, rows }], rows };
  }

  return { segments: [], rows: 0 };
}

/**
 * Layout for a paragraph naming one picture: a box as wide as the page and as tall as the picture's
 * proportion allows. A `Client` may not draw an `Image`, so the segment breaks the run it sits in.
 */
function layoutImage(image: Files.PageImage, alt: string, columns: number): BlockLayout {
  const box = Images.imageBoxOf(image, columns, Limits.IMAGE_MAX_ROWS);

  return {
    segments: [
      {
        kind: 'image',
        path: image.path,
        alt: alt || Paths.nameOf(image.path),
        generation: image.generation,
        ...box,
      },
    ],
    rows: box.rows,
  };
}

/** Layout for a table block: one row per drawn table row, the header row's span forced bold. */
function layoutTable(source: readonly string[], columns: number): BlockLayout {
  const table = Tables.tableOf(source);

  if (table === null) return { segments: [], rows: 0 };

  const tableRows = Tables.tableRowsOf(table, columns);
  const rows: Row[] = tableRows.map(({ text, isHeader }) => ({
    spans: [isHeader ? { text, bold: true } : { text }],
  }));

  return { segments: [{ kind: 'rows', rows }], rows: rows.length };
}

/** Layout for an HTML block: source lines as dim wrapped rows. */
function layoutHtml(source: readonly string[], columns: number): BlockLayout {
  const allRows: Row[] = [];

  for (const line of source) {
    if (line.trim() === '') {
      allRows.push({ spans: [] });
    } else {
      allRows.push(...wrappedRowsOf([{ text: line, dim: true }], columns, { first: 0, rest: 0 }));
    }
  }

  return { segments: [{ kind: 'rows', rows: allRows }], rows: allRows.length };
}

/**
 * The drawable segments for one Markdown block at a given page width, and the rows it occupies.
 * A block whose source exceeds `MAX_ELEMENT_CHARS` characters becomes a single `note` segment.
 *
 * @param block the block's kind and its 1-based inclusive source line range
 * @param lines the file's lines (0-indexed), from which the block's source is sliced
 * @param columns the page's width in cells
 * @param images the PNGs the file names, by the target as its source writes it
 * @returns the segments and the total row count
 */
export function blockLayoutOf(
  block: MarkdownBlock,
  lines: readonly string[],
  columns: number,
  images: Readonly<Record<string, Files.PageImage>> = Files.NO_IMAGES,
): BlockLayout {
  const source = lines.slice(block.start - 1, block.end);

  // LIMIT: a block whose source exceeds MAX_ELEMENT_CHARS characters is drawn as a note; its source is still readable under Source (Claude Code 2.1.278, #54).
  if (source.join('\n').length > Limits.MAX_ELEMENT_CHARS) {
    return { segments: [{ kind: 'note', text: Names.BLOCK_TOO_LONG_NOTE }], rows: 1 };
  }

  switch (block.kind) {
    case 'heading':
      return layoutHeading(source, columns);
    case 'paragraph': {
      // A paragraph that names a picture and nothing else draws the picture; one the pane cannot
      // draw keeps the `alt (src)` text the inline walk gives it. An image token comes from `![`, so
      // a paragraph without one pays no second parse, whatever the page names elsewhere.
      const lone = source.some((line) => line.includes('![')) ? MarkdownBlocks.loneImageOf(source) : null;
      const image = lone === null ? undefined : images[lone.src];

      return lone !== null && image !== undefined
        ? layoutImage(image, lone.alt, columns)
        : layoutParagraph(source, columns);
    }
    case 'list':
      return layoutList(source, columns);
    case 'quote':
      return layoutQuote(source, columns);
    case 'rule':
      return layoutRule(columns);
    case 'code':
      return layoutCode(source);
    case 'table':
      return layoutTable(source, columns);
    case 'html':
      return layoutHtml(source, columns);
    default:
      // New block kinds added in future tasks: return empty layout so the switch stays open.
      return { segments: [], rows: 0 };
  }
}
