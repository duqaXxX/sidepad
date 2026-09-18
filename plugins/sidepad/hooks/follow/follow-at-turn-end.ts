import Limits from '../limits';
import type { FollowAction } from './follow-action';
import type { FollowFacts } from './follow-facts';

/**
 * What the pane does at the end of a main-loop turn, first match wins: no edit, stay; closed, open
 * on the last edited file when the switch is on, the person did not close it and the screen is not
 * the main screen and the terminal is wide enough; on the turn's last file where an edit cleared the
 * person's selection, stay; on
 * the latest file before the turn or the turn's last file, follow; on anything else, mark.
 *
 * @returns the action, with the file and line to show for open and follow
 */
export function followAtTurnEnd(facts: FollowFacts): FollowAction {
  const last = facts.edits.at(-1);

  if (!last) {
    return { kind: 'stay' };
  }

  const target = { path: last.path, line: last.changedLine };

  if (!facts.isOpen) {
    // A pane nobody asked for waits undrawn below the engine's wider floor, so a narrow terminal
    // is left alone rather than holding a pane the person would never see.
    const hasRoom = facts.columns === null || facts.columns >= Limits.AUTO_OPEN_MIN_COLUMNS;
    // Unasked, it opens only where the layout is known to dock it: on the main screen it would land
    // inline, two rows tall.
    const canOpen = facts.isAutoOpenOn && !facts.isClosedByPerson && facts.screen === 'fullscreen' && hasRoom;

    return canOpen ? { kind: 'open', ...target } : { kind: 'stay' };
  }

  if (facts.shownFile === last.path && facts.clearedOn.includes(last.path)) {
    return { kind: 'stay' };
  }

  if (facts.shownFile !== null && (facts.shownFile === facts.latestBefore || facts.shownFile === last.path)) {
    return { kind: 'follow', ...target };
  }

  return { kind: 'mark' };
}
