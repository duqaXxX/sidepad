import type Files from '../../files';
import type { PageView } from './page-view';

/** The file the pane last read, kept while a list page is shown so `..` and back is cheap. */
export type OpenFile = {
  loaded: Files.LoadedFile;
  /** The code or source window's 0-based first line. */
  top: number;
  /** For a readable Markdown or delimited file, how its composed page is shown; null for any other file. */
  view: PageView | null;
};
