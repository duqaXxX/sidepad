/** A PNG the pane draws: where the terminal reads it, and how big it is in pixels. */
export type PageImage = {
  /** The file's absolute path, at most 3072 bytes; the terminal opens and decodes it itself. */
  path: string;
  width: number;
  height: number;
};

/** No image: what a file that names none carries. */
export const NO_IMAGES: Readonly<Record<string, PageImage>> = {};
