import type Files from '../files';
import { isUnifiedDiff } from '../files/is-unified-diff';

// LIMIT: Code's `format: 'diff'` reads a whole diff and refuses a source with no `@@` header, unmounting the Client that drew it; the pane hands Code one window of the file, so a window inside a hunk would blank the page. A diff is coloured by the diff grammar instead, which keeps the pane's own line gutter (Claude Code 2.1.278, #57).

/**
 * The grammar `Code` colours a file with.
 *
 * @param loaded the file the page draws
 * @returns `diff` for a unified diff the pane holds whole, else null to let `Code` infer one from
 *   the path
 */
export const codeLanguageOf = (loaded: Files.LoadedFile): string | null =>
  loaded.kind === 'diff' && loaded.source === 'whole' && isUnifiedDiff(loaded.lines) ? 'diff' : null;
