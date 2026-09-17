import type Files from '../../files';
import type { MarkdownView } from './markdown-view';

/** The file the pane last read, kept while a list page is shown so `..` and back is cheap. */
export type OpenFile = {
  loaded: Files.LoadedFile;
  /** The code or source window's 0-based first line. */
  top: number;
  /** For a readable Markdown file, how it is shown; null for any other file. */
  markdown: MarkdownView | null;
};
