import Limits from '../limits';

/**
 * The characters a selection's context entry may take and still reach the model inline: its own
 * entry cap, or what the entries already there leave of the whole context's, whichever is less.
 *
 * @param context the entries the prompt already carries
 * @returns the room, zero or less when none is left
 */
export function askRoomOf(context: readonly string[]): number {
  const used = context.reduce((sum, entry) => sum + entry.length, 0);

  return Math.min(Limits.PROMPT_CONTEXT_ENTRY_MAX_CHARS, Limits.PROMPT_CONTEXT_MAX_CHARS - used);
}
