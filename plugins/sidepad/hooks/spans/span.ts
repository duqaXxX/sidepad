/** One run of text drawn with one set of attributes. */
export type Span = {
  text: string;
  bold?: true;
  italic?: true;
  strikethrough?: true;
  dim?: true;
  /** A part the palette colours: a rule, or a link's target. */
  tone?: 'rule' | 'link';
  isCode?: true;
};
