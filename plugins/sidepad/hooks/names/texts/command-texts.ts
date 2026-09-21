/** `/sidepad`'s transcript line once it opened the pane. */
export const PANE_SHOWN_TEXT = 'sidepad pane shown';

/** `/sidepad`'s transcript line once it closed the pane. */
export const PANE_HIDDEN_TEXT = 'sidepad pane hidden';

/** `/sidepad`'s answer to arguments it does not know. */
export const USAGE_TEXT =
  'Usage: /sidepad to open or close the pane, /sidepad auto [on|off] for opening on edits, /sidepad theme [auto|classic|contrast] for its colours';

/**
 * `/sidepad auto`'s answer: the switch as it now stands.
 *
 * @returns the line
 */
export const autoOpenTextOf = (isOn: boolean) => `Opening on Claude's edits is ${isOn ? 'on' : 'off'}`;

/**
 * `/sidepad theme`'s answer: the theme as it now stands.
 *
 * @returns the line
 */
export const themeTextOf = (name: string) => `The pane's theme is ${name}`;
