/**
 * What a terminal drawing no pixels shows in an image's place, and what a screen reader reads.
 *
 * @returns the file's name and its pixel size, `logo.png (320×200)`
 */
export const imageAltOf = (name: string, size: { width: number; height: number }) =>
  `${name} (${size.width}×${size.height})`;
