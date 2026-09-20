import type Files from '../files';
import { isUnifiedDiff } from '../files/is-unified-diff';

// LIMIT: Code's `format: 'diff'` reads a whole diff and refuses a source with no `@@` header, unmounting the Client that drew it; the pane hands Code one window of the file, so a window inside a hunk would blank the page. A diff is coloured by the grammar its path resolves instead, which keeps the gutter numbering the file's own lines (Claude Code 2.1.278, #57).

// LIMIT: the diff grammar colours the `---`, `+++` and `@@` lines and leaves added and removed lines the colour of ordinary text, so a diff drawn by the pane marks its headers and nothing else (Claude Code 2.1.278, #57).

/**
 * The path handed to `Code`, which reads a grammar from it and nothing else: it draws no path and
 * touches no disk.
 *
 * A `.diff` or `.patch` resolves the diff grammar by its name alone, so a file that is not a diff
 * has to reach `Code` with no path at all to be drawn as the plain text it is.
 *
 * @param loaded the file the page draws
 * @returns the file's path, or null for a `.diff` or `.patch` holding no hunk header
 */
export const codeGrammarPathOf = (loaded: Files.LoadedFile): string | null =>
  loaded.kind === 'diff' && loaded.source === 'whole' && !isUnifiedDiff(loaded.lines) ? null : loaded.path;
