import { imageKindOf } from '../images';

/**
 * How the pane draws a file, by its name.
 *
 * @returns `image` for a `.png`, `markdown` for `.md` and `.markdown`, else `code`
 */
export const fileKindOf = (path: string): 'code' | 'markdown' | 'image' =>
  imageKindOf(path) === 'png' ? 'image' : /\.(md|markdown)$/i.test(path) ? 'markdown' : 'code';
