import type { FsEntry } from 'claude-code';

/** A directory's entries as the engine listed them, or none and a note saying why it could not. */
export type DirectoryListing = { entries: readonly FsEntry[]; failure: string | null };
