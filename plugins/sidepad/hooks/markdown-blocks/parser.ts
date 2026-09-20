import MarkdownIt from '../vendor/markdown-it.mjs';

/**
 * The Markdown parser the pane reads a file's structure with: CommonMark with GFM tables, HTML read
 * as blocks of its own. Nothing is rendered from it, so its renderer's options do not matter, and
 * one instance serves every page.
 */
export const parser = new MarkdownIt({ html: true });
