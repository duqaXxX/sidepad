/** One selectable block of a Markdown file: what it is and its source lines, 1-based, both ends included. */
export type MarkdownBlock = {
  kind: 'heading' | 'paragraph' | 'list' | 'table' | 'code' | 'quote' | 'rule';
  start: number;
  end: number;
};
