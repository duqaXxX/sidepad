import { parentOf } from './parent-of';
import { relativePathOf } from './relative-path-of';

/**
 * The directories above a path, nearest first: up to the session's directory for a path inside it,
 * up to `/` for one outside it.
 *
 * @returns the ancestors, the path itself excluded
 */
export function ancestorsOf(path: string, cwd: string): string[] {
  const isInside = relativePathOf(path, cwd) !== null;
  const ancestors: string[] = [];
  let at = path;

  while (at !== '/' && !(isInside && at === cwd)) {
    at = parentOf(at);
    ancestors.push(at);
  }

  return ancestors;
}
