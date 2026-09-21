/**
 * The colours one theme draws the pane's own parts with. Each is a raw colour or a Claude Code theme
 * colour name, which the engine resolves against the person's theme. The page's code keeps the
 * engine's highlighter colours whatever the theme.
 */
export type Palette = {
  /** The rule under the top row, a quote's marker and a table's rules. */
  rule: string;
  /** The code page's `▌` selection marker and the command bar's band. */
  accent: string;
  /** A link's or a picture's target, written after its text on a formatted page. */
  link: string;
  /** The command bar's text on the accent. */
  barText: string;
  statusBackground: string;
  statusText: string;
  selectionBackground: string;
  /** The text of a selected row on a formatted page; null keeps each span's own colour. */
  selectionText: string | null;
  /** Inline code in a formatted page's prose: a colour, or the terminal's own made bold and underlined. */
  inlineCode: { color: string | null; bold: boolean; underline: boolean };
};
