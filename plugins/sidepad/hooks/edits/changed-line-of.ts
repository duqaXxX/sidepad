/**
 * The line an edit record changed first: its first hunk's `newStart` moved past the hunk's leading
 * context lines (` `), since a hunk starts with context. A create carries no hunk.
 *
 * @param record the tool's result record (`structuredPatch` of `Edit` and `Write`)
 * @returns the 1-based line, 1 when the record names none
 */
export function changedLineOf(record: unknown): number {
  const patch = (record as { structuredPatch?: unknown } | null | undefined)?.structuredPatch;
  const hunk = Array.isArray(patch) ? (patch[0] as { newStart?: unknown; lines?: unknown } | undefined) : undefined;

  if (typeof hunk?.newStart !== 'number') {
    return 1;
  }

  const lines = Array.isArray(hunk.lines) ? (hunk.lines as unknown[]) : [];
  const context = lines.findIndex((line) => typeof line !== 'string' || !line.startsWith(' '));

  return Math.max(1, hunk.newStart + (context < 0 ? 0 : context));
}
