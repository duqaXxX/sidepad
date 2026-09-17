/**
 * The dim first row of the directory page shown in place of a file or directory that left the disk.
 *
 * @param shownPath the path that is gone, as the pane names paths
 * @returns the note
 */
export const goneNoteOf = (shownPath: string) => `${shownPath} is no longer on disk`;
