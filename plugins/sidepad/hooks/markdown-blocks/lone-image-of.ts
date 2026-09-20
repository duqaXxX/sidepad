import { altTextOf } from '../spans';
import type { Token } from '../vendor/markdown-it.mjs';
import { parser } from './parser';

/** An image a block names and nothing else: the target as the source writes it, and its alt text. */
export type LoneImage = { src: string; alt: string };

/** The image an inline token holds when it holds nothing else; empty text runs carry nothing. */
function loneImageChildOf(inline: Token): LoneImage | null {
  const children = (inline.children ?? []).filter((child) => child.type !== 'text' || child.content !== '');
  const image = children[0];

  if (children.length !== 1 || image === undefined || image.type !== 'image') {
    return null;
  }

  const src = image.attrs?.find(([name]) => name === 'src')?.[1];

  return src === undefined || String(src) === '' ? null : { src: String(src), alt: altTextOf(image) };
}

/**
 * The image a Markdown block draws in place of its text: a paragraph holding one image token and
 * nothing else. A paragraph with a word beside the image keeps its text.
 *
 * @param source the block's source lines
 * @returns the target and its alt text, or null when the block holds anything else
 */
export function loneImageOf(source: readonly string[]): LoneImage | null {
  const tokens = parser.parse(source.join('\n'), {});
  const inline = tokens.filter((token) => token.type === 'inline');

  return tokens[0]?.type === 'paragraph_open' && inline.length === 1 ? loneImageChildOf(inline[0]!) : null;
}

/**
 * Every target a file's paragraphs name as an image on its own, in order and each once. Read from
 * the whole file in one parse, so the page can find out which of them lead to a picture before a
 * block is laid out.
 *
 * @param lines the file's lines, 0-indexed
 * @returns the targets exactly as the source writes them
 */
export function imageTargetsOf(lines: readonly string[]): string[] {
  const text = lines.join('\n');

  // An image token comes from `![`, so a file without one names nothing and the parse is skipped.
  if (!text.includes('![')) {
    return [];
  }

  const tokens = parser.parse(text, {});
  const targets: string[] = [];

  tokens.forEach((token, at) => {
    if (token.type !== 'inline' || tokens[at - 1]?.type !== 'paragraph_open') {
      return;
    }

    const image = loneImageChildOf(token);

    if (image !== null && !targets.includes(image.src)) {
      targets.push(image.src);
    }
  });

  return targets;
}
