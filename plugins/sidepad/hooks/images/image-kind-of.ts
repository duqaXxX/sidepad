// LIMIT: an Image takes a whole PNG or raw pixels, so a JPEG, a GIF or a WebP cannot be drawn (Claude Code 2.1.278).

/**
 * The kind of image a path names, by its extension.
 *
 * @returns `png` for `.png`, `other` for `.jpg/.jpeg/.gif/.webp/.bmp/.svg`, `null` otherwise.
 * Case insensitive.
 */
export const imageKindOf = (path: string): 'png' | 'other' | null => {
  const ext = /\.([^./\\]+)$/.exec(path)?.[1]?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp' || ext === 'bmp' || ext === 'svg')
    return 'other';
  return null;
};
