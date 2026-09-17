import { relativePathOf } from './relative-path-of';

/**
 * The directory a path piece opens: the session's directory at depth 0, then one more directory of
 * the target's path at each depth; the target itself at its own depth or past it.
 *
 * @param target the file or directory the top row shows
 * @param cwd the session's directory
 * @param depth the piece's depth, as its `crumb:<depth>` key carries it
 * @returns the path, or null for a target outside the session's directory
 */
export function crumbPathOf(target: string, cwd: string, depth: number): string | null {
  const relative = relativePathOf(target, cwd);

  if (relative === null) {
    return null;
  }

  const parts = relative === '' ? [] : relative.split('/');

  if (depth >= parts.length) {
    return target;
  }

  return depth === 0 ? cwd : `${cwd === '/' ? '' : cwd}/${parts.slice(0, depth).join('/')}`;
}
