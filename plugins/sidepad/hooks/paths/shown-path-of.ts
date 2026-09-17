import { relativePathOf } from './relative-path-of';

/**
 * A path as the pane names it.
 *
 * @returns `.` for the session's directory, the relative path inside it, the absolute path outside
 */
export function shownPathOf(path: string, cwd: string): string {
  const relative = relativePathOf(path, cwd);

  return relative === null ? path : relative === '' ? '.' : relative;
}
