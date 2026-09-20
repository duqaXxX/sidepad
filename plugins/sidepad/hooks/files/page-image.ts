/** A PNG the pane draws: where the terminal reads it, how big it is, and which content that is. */
export type PageImage = {
  /** The file's absolute path; the terminal opens and decodes it itself. */
  path: string;
  width: number;
  height: number;
  /**
   * The file's modification time in whole milliseconds, passed as `ImageSource.generation`: a
   * source equal to the last drawn sends nothing, so without it new content under the same path
   * would leave the old pixels on screen beside the new size.
   */
  generation: number;
};

/** A stat's modification time as `generation` takes it: a whole number that moves with the content. */
export const generationOf = (mtimeMs: number): number => Math.round(mtimeMs);

/** No image: what a file that names none carries. */
export const NO_IMAGES: Readonly<Record<string, PageImage>> = {};
