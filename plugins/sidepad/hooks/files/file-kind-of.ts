import Delimited from '../delimited';
import { imageKindOf } from '../images';

/**
 * How the pane draws a file, by its name.
 *
 * @returns `image` for a `.png`, `markdown` for `.md` and `.markdown`, `diff` for `.diff` and
 *   `.patch`, `table` for `.csv` and `.tsv`, else `code`
 */
export const fileKindOf = (path: string): 'code' | 'markdown' | 'image' | 'diff' | 'table' => {
  if (imageKindOf(path) === 'png') return 'image';
  if (/\.(md|markdown)$/i.test(path)) return 'markdown';
  if (/\.(diff|patch)$/i.test(path)) return 'diff';
  if (Delimited.delimitedKindOf(path) !== null) return 'table';

  return 'code';
};
