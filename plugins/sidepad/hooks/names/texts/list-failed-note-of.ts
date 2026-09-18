/**
 * The dim first row of a directory page whose listing the engine refused.
 *
 * @param reason the refusal's message, as the engine gave it
 * @returns the note
 */
export const listFailedNoteOf = (reason: string) => `Could not list this directory: ${reason}`;
