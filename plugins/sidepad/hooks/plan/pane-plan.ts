import type Bar from '../bar';
import type PageLayout from '../page-layout';
import type Paths from '../paths';
import type { CodeViewProps } from './code-view-props';

/** A plain Button of the top row or a list: its address and its label. */
export type Pressable = { key: string; label: string };

/** The formatted Markdown page: the window's segments, already composed by the hooks. */
export type PagePlan = {
  kind: 'page';
  /** The segments the window draws, in order, each with the page row it starts on. */
  segments: readonly PageLayout.PlacedSegment[];
  /** The page's 0-based first row shown. */
  firstRow: number;
  /** The rows the window shows, over every run it is cut into. */
  rows: number;
  /** The page's rows in all. */
  totalRows: number;
  /** The selected page rows, 0-based and both ends included; null with no selection. */
  range: { start: number; end: number } | null;
  /** Bumped by the hooks when they clear a selection: a new value drops a Client's drag. */
  epoch: number;
};

/** A picture the pane draws whole: an image file's page. */
export type ImagePlan = {
  kind: 'image';
  /** The file's absolute path: the terminal opens and decodes it itself. */
  path: string;
  /** What a terminal drawing no pixels shows in its place. */
  alt: string;
  /** `ImageSource.generation`: new content under the same path is a new source, not the last drawn. */
  generation: number;
  columns: number;
  rows: number;
};

/** Everything one drawing of the pane shows, computed; the views only draw it. */
export type PanePlan = {
  columns: number;
  /** The page's width: the body less its left padding. */
  pageColumns: number;
  top: { navigation: readonly Pressable[]; crumbs: readonly Paths.Crumb[] };
  page:
    | { kind: 'code'; props: CodeViewProps }
    | PagePlan
    | ImagePlan
    | { kind: 'list'; noteRows: readonly string[]; rows: readonly (Pressable & { isDim: boolean })[] };
  /** The status line: its body row counted from the top row, and its two texts. */
  status: { top: number; left: string; right: string };
  /** The command bar: its first row as a body row counted from the top row, and the band's rows. */
  bar: { top: number; layout: readonly (readonly Bar.BarItem[])[] } | null;
};
