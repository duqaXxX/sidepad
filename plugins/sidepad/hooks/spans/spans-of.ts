import type { Token } from '../vendor/markdown-it.mjs';
import { linkHrefOf } from './link-href-of';
import type { Span } from './span';

/** Inline markup context at a point in the token walk: which style toggles are currently open. */
type MarkupState = {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  /** The href of the link the walk is inside, when it can be drawn as a `Link`. */
  href: string | null;
};

/** Build a span with the text and the attributes currently active, adding any extras. */
function spanWith(text: string, state: MarkupState, extra?: Partial<Span>): Span {
  const span: Span = { text };
  if (state.bold) span.bold = true;
  if (state.italic) span.italic = true;
  if (state.strikethrough) span.strikethrough = true;
  if (state.href !== null) span.href = state.href;
  return extra !== undefined ? { ...span, ...extra } : span;
}

/**
 * Plain text of an image token's alt: its text children joined, softbreaks as spaces.
 *
 * @returns the alt, empty when the image carries none
 */
export function altTextOf(token: Token): string {
  return (token.children ?? [])
    .map((c) => (c.type === 'text' ? c.content : c.type === 'softbreak' ? ' ' : ''))
    .join('');
}

/**
 * Flat span list for the inline token's children: each text run as one span, styled by the
 * markup that surrounds it. Bold, italic and strikethrough nest. A link `linkHrefOf` takes carries
 * its href on its text; any other link's text runs normally and its target follows in the link tone.
 * An image emits its alt then its source in the link tone.
 *
 * @param token an inline token whose children are walked
 * @returns a flat array of styled text spans, empty when the token has no children
 */
export function spansOf(token: Token): Span[] {
  const spans: Span[] = [];
  const state: MarkupState = { bold: false, italic: false, strikethrough: false, href: null };
  let linkHref: string | null = null;

  for (const child of token.children ?? []) {
    switch (child.type) {
      case 'text':
        // markdown-it emits zero-length text tokens at markup boundaries; they carry no information.
        if (child.content) spans.push(spanWith(child.content, state));
        break;
      case 'strong_open':
        state.bold = true;
        break;
      case 'strong_close':
        state.bold = false;
        break;
      case 'em_open':
        state.italic = true;
        break;
      case 'em_close':
        state.italic = false;
        break;
      case 's_open':
        state.strikethrough = true;
        break;
      case 's_close':
        state.strikethrough = false;
        break;
      case 'code_inline':
        spans.push(spanWith(child.content, state, { isCode: true }));
        break;
      case 'link_open': {
        const href = child.attrs?.find(([name]) => name === 'href')?.[1];
        linkHref = href !== undefined ? String(href) : '';
        state.href = linkHrefOf(linkHref);
        break;
      }
      case 'link_close':
        // A link drawn as a `Link` names its target itself. Otherwise the target follows its text,
        // when there is one: a link with no href is just its text.
        if (state.href === null && linkHref) spans.push({ text: ` (${linkHref})`, tone: 'link' });
        state.href = null;
        linkHref = null;
        break;
      case 'softbreak':
        spans.push(spanWith(' ', state));
        break;
      case 'hardbreak':
        spans.push(spanWith('\n', state));
        break;
      case 'image': {
        const alt = altTextOf(child);
        const src = child.attrs?.find(([name]) => name === 'src')?.[1];
        if (alt) spans.push(spanWith(alt, state));
        spans.push({ text: ` (${src ?? ''})`, tone: 'link' });
        break;
      }
      case 'html_inline':
        // The tag's source text takes the style around it, as any text run does: `<br>` inside
        // `**bold**` draws bold. It is drawn as written, so it reads as part of that run.
        spans.push(spanWith(child.content, state));
        break;
      default:
        break;
    }
  }

  return spans;
}
