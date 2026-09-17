/** What the code Client knows of the window it draws. */
export type CodeWindow = {
  /** The file's 0-based line the window starts on. */
  firstLine: number;
  /** The lines the window holds. */
  lineCount: number;
  totalLines: number;
  /** The first Client row the command bar covers, null without a bar. */
  barTop: number | null;
};
