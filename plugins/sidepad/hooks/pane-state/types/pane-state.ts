import type { OpenFile } from './open-file';
import type { Page } from './page';
import type { PaneLayout } from './pane-layout';
import type { Press } from './press';
import type { Screen } from './screen';
import type { Selection } from './selection';
import type { TurnEdits } from './turn-edits';

/** Everything the pane knows: what its handlers read and replace, and what one drawing shows. */
export type PaneState = {
  /** The session's directory: where `..` stops and paths are named from. */
  cwd: string;
  isOpen: boolean;
  /** A pane the person closed with its mark is not reopened by edits until `/sidepad` or `/clear`. */
  isClosedByPerson: boolean;
  /** An auto-open whose first drawing has not yet said whether it docked. */
  isPlacementUnchecked: boolean;
  screen: Screen;
  /** The terminal's width as the last drawing or command reported it, null before any said. */
  columns: number | null;
  layout: PaneLayout;
  file: OpenFile | null;
  page: Page;
  selection: Selection | null;
  press: Press | null;
  /** Bumped when the hooks clear a selection: the code Client drops the drag it still holds. */
  epoch: number;
  /** The files Claude edited this session, most recent first, and whether one changed out of view. */
  edited: { paths: readonly string[]; hasUnseen: boolean };
  turn: TurnEdits;
};
