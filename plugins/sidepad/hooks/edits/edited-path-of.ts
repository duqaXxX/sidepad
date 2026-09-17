import type { Args } from 'claude-code';

/**
 * The file an editing tool call names.
 *
 * @returns `file_path` of `Edit` and `Write`, `notebook_path` of `NotebookEdit`, else null
 */
export function editedPathOf(e: Args<'tool.call'>): string | null {
  const path =
    e.tool === 'NotebookEdit' ? e.notebook_path : e.tool === 'Edit' || e.tool === 'Write' ? e.file_path : undefined;

  return typeof path === 'string' ? path : null;
}
