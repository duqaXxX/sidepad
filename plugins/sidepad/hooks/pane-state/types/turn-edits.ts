import type Follow from '../../follow';

/** The running turn's landed edits, applied when the main loop's turn ends. */
export type TurnEdits = {
  edits: readonly Follow.TurnEdit[];
  /** The most recent edited file before the turn's first edit: a person on it is following Claude. */
  latestBefore: string | null;
  /** Files where one of the turn's edits cleared the person's selection. */
  clearedOn: readonly string[];
};

/** A turn with no edit yet. */
export const NO_TURN_EDITS: TurnEdits = { edits: [], latestBefore: null, clearedOn: [] };
