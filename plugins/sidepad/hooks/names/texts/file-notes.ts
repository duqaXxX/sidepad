/** The page's one dim line for a file that is not a regular file or could not be read. */
export const READ_FAILED_NOTE = 'Could not read this file';

/** The page's one dim line for a file whose text holds a NUL. */
export const BINARY_NOTE = 'Binary file: not shown';

/**
 * The page's one dim line for a file past the size the pane reads.
 *
 * @returns the note, the size in megabytes with one decimal
 */
export const tooLargeNoteOf = (bytes: number) => `File too large to show (${(bytes / 1_000_000).toFixed(1)} MB)`;
