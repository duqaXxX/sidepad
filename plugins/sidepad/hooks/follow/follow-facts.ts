import type { TurnEdit } from './turn-edit';

/** What the end-of-turn rule reads. */
export type FollowFacts = {
  /** The turn's landed edits, in order. */
  edits: readonly TurnEdit[];
  /** The most recent edited file before the turn's first edit. */
  latestBefore: string | null;
  /** Files where one of the turn's edits cleared the person's selection. */
  clearedOn: readonly string[];
  isOpen: boolean;
  isAutoOpenOn: boolean;
  isClosedByPerson: boolean;
  screen: 'fullscreen' | 'main' | null;
  /** The file the pane's file page shows, null on a list page. */
  shownFile: string | null;
};
