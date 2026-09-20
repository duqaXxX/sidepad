/**
 * What the hooks hand the code Client: one window of the file, never the whole file, since a
 * Client's props past 100,000 characters are refused.
 */
export type CodeViewProps = {
  /** The file's path, from which `Code` infers the language. */
  path: string;
  /** The grammar `Code` colours the lines with; null lets it infer one from `path`. */
  language: string | null;
  /** The lines in view, `firstLine` first, exactly as the file has them. */
  lines: readonly string[];
  /** The file's 0-based line of `lines[0]`. */
  firstLine: number;
  totalLines: number;
  /** The first Client row the command bar covers, null without a bar. */
  barTop: number | null;
  /** The selection the hooks settled, drawn while the person is not dragging. */
  range: { start: number; end: number } | null;
  /** Bumped by the hooks when they clear a selection: a new value drops the Client's drag. */
  epoch: number;
};
