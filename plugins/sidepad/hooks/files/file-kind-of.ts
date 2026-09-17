/**
 * How the pane draws a file, by its name.
 *
 * @returns `markdown` for `.md` and `.markdown`, else `code`
 */
export const fileKindOf = (path: string): 'code' | 'markdown' => (/\.(md|markdown)$/i.test(path) ? 'markdown' : 'code');
