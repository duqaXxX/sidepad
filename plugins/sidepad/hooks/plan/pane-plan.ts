import type Bar from '../bar';
import type Paths from '../paths';
import type { BlockViewProps } from './block-view-props';
import type { CodeViewProps } from './code-view-props';

/** A plain Button of the top row or a list: its address and its label. */
export type Pressable = { key: string; label: string };

/** Everything one drawing of the pane shows, computed; the views only draw it. */
export type PanePlan = {
  columns: number;
  top: { navigation: readonly Pressable[]; crumbs: readonly Paths.Crumb[] };
  page:
    | { kind: 'code'; props: CodeViewProps }
    | { kind: 'blocks'; blocks: readonly BlockViewProps[] }
    | { kind: 'list'; note: string | null; rows: readonly (Pressable & { isDim: boolean })[] };
  /** The command bar: its first row as a body row counted from the top row, and the band's rows. */
  bar: { top: number; layout: readonly (readonly Bar.BarItem[])[] } | null;
};
