/**
 * A path relative to the session's directory.
 *
 * @returns `''` for the directory itself, the relative path inside it, null outside it
 */
export function relativePathOf(path: string, cwd: string): string | null {
  if (path === cwd) {
    return '';
  }

  const root = cwd === '/' ? '/' : `${cwd}/`;

  return path.startsWith(root) ? path.slice(root.length) : null;
}
