import type { FileStamp } from './file-stamp';
import type { PageImage } from './page-image';

/**
 * A file as the pane read it: the lines it holds, or a note saying why it shows none.
 *
 * A file within the engine's read cap is held whole (`whole`): `lines` are all of them, `from` is 0.
 * A file past it is held one window at a time (`windowed`): `lines` are the window starting at
 * `from`, and `total` is what counting its lines said.
 */
export type LoadedFile = {
  path: string;
  kind: 'code' | 'markdown' | 'image';
  source: 'whole' | 'windowed';
  /** The lines held, exactly as the file has them; empty when `note` is set. */
  lines: readonly string[];
  /** The file's 0-based line of `lines[0]`. */
  from: number;
  /** The file's lines in all. */
  total: number;
  note: string | null;
  /** The file's own picture, when it is a PNG the pane draws; null for every other file. */
  image: PageImage | null;
  /** The PNGs a formatted Markdown page draws, by the target as its source writes it. */
  images: Readonly<Record<string, PageImage>>;
  /** The stat the read followed, null when the stat failed. */
  stamp: FileStamp | null;
};
