/** The rule under the top row: a grey that separates without competing with the page. */
export const RULE = '#4a4a4a';

/**
 * The status line's background: a grey lighter than the pane's. Raw colours do not follow the
 * person's theme.
 */
export const STATUS_BACKGROUND = '#303030';

/** The command bar's band and the selection's `▌` marker. */
export const ACCENT = '#3b5bdb';

/** The selected rows' background, in the cells a `Code` leaves unpainted. */
export const SELECTION_BACKGROUND = '#264f78';

/** The command bar's text on the accent. */
export const BAR_TEXT = '#ffffff';

/**
 * Inline `code` in a formatted page's prose: a warm tone, chosen to read both on the terminal's own
 * background and on SELECTION_BACKGROUND, which a selected row paints behind it. Its contrast
 * against that blue is 4.9 to 1.
 */
export const INLINE_CODE = '#e5c07b';
