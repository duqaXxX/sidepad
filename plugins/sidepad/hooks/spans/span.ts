/** One run of text drawn with one set of attributes. */
export type Span = {
  text: string;
  bold?: true;
  italic?: true;
  strikethrough?: true;
  dim?: true;
  color?: string;
  isCode?: true;
};
