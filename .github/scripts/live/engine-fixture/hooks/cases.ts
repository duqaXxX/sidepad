// What the fixture draws and answers, read by the limit scenarios as well: a plain module, so the
// tooling can import it without the fixture's JSX.

/** The fixture's pane, and the command that drives it. */
export const PANE_ID = 'engine-fixture';
export const COMMAND = 'engine-fixture';

/**
 * The pane the fixture opens on its own, apart from `PANE_ID`: the engine remembers across sessions
 * which ids a person asked for, and that memory moves the floor an unasked pane is drawn from.
 */
export const UNASKED_PANE_ID = 'engine-fixture-unasked';

/** How long after its command the fixture opens `UNASKED_PANE_ID`, so the open answers no input. */
export const UNASKED_OPEN_DELAY_MS = 1_500;

/**
 * The status line the fixture sets once the unasked open `tag` names resolved, `isPlaced` appended:
 * the tag tells one open's line from an earlier one's still drawn.
 */
export const UNASKED_STATUS = (tag: string) => `engine fixture: unasked ${tag} isPlaced=`;

/** A gutterless `Code` source with an empty line between two others. */
export const CODE_WITH_EMPTY_LINE = 'first line\n\nthird line';
