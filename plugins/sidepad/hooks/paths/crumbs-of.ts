import Names from '../names';
import type { Crumb } from './crumb';
import { relativePathOf } from './relative-path-of';

/**
 * The path as the top row draws it: `.` for the session's directory, then each directory as a
 * piece to press (keyed by its depth, `crumb:0` for `.`), and the last piece, the file or the
 * directory shown, as text. A path outside the session's directory is one piece of text, since
 * `..` never goes there either. Leading pieces give way to `…/` until the path fits `room` cells.
 *
 * @param target the file or directory shown
 * @param cwd the session's directory
 * @param room the cells the path may take (every label cell counted as one code point)
 * @returns the pieces, left to right
 */
export function crumbsOf(target: string, cwd: string, room: number): Crumb[] {
  const relative = relativePathOf(target, cwd);

  if (relative === null) {
    return [{ kind: 'text', label: target }];
  }

  const labels = ['.', ...(relative === '' ? [] : relative.split('/'))];
  const widthFrom = (from: number) =>
    (from > 0 ? 2 : 0) + labels.slice(from).reduce((sum, label, at) => sum + [...label].length + (at > 0 ? 1 : 0), 0);

  let from = 0;

  while (from < labels.length - 1 && widthFrom(from) > room) {
    from += 1;
  }

  const crumbs: Crumb[] = from > 0 ? [{ kind: 'text', label: '…/' }] : [];

  labels.slice(from).forEach((label, at) => {
    const depth = from + at;

    if (at > 0) {
      crumbs.push({ kind: 'text', label: '/' });
    }

    crumbs.push(
      depth < labels.length - 1 ? { kind: 'link', key: Names.keyOf('crumb', depth), label } : { kind: 'text', label },
    );
  });

  return crumbs;
}
