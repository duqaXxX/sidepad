/** A target that names somewhere else entirely: a URL, a protocol-relative host, a mail address. */
const ELSEWHERE = /^([a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/;

/**
 * A target a document writes, resolved against the directory of the file that writes it. `.` and
 * `..` pieces are walked without touching the disk, so nothing is read to find out where it leads.
 *
 * @param directory the absolute directory holding the file the target is written in
 * @param target the target exactly as the source writes it
 * @returns the absolute path, or null for an empty target, one naming a URL, or one climbing past `/`
 */
export function resolvedPathOf(directory: string, target: string): string | null {
  if (target === '' || ELSEWHERE.test(target)) {
    return null;
  }

  const pieces = target.startsWith('/') ? [] : directory.split('/').filter((piece) => piece !== '');

  for (const piece of target.split('/')) {
    if (piece === '' || piece === '.') {
      continue;
    }

    if (piece === '..') {
      if (pieces.length === 0) {
        return null;
      }

      pieces.pop();
      continue;
    }

    pieces.push(piece);
  }

  return pieces.length === 0 ? null : `/${pieces.join('/')}`;
}
