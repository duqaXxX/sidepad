/**
 * The most characters one entry of a prompt's context reaches the model with, inline. Past it the
 * engine saves the entry to a file and the model reads a 2 KB head and the file's path.
 */
// LIMIT: a context entry past 100,000 characters reaches the model as a 2 KB head and the path of a copy, so a selection is cut to it first (Claude Code 2.1.278, #21).
export const PROMPT_CONTEXT_ENTRY_MAX_CHARS = 100_000;

/**
 * The most characters a prompt's context carries inline, its entries together. The entry that
 * crosses it reaches the model as a head and a path, as one past its own cap does.
 */
// LIMIT: a context entry that takes a prompt's context past 200,000 characters reaches the model as a 2 KB head and a path (Claude Code 2.1.278, #21).
export const PROMPT_CONTEXT_MAX_CHARS = 200_000;

/**
 * The most lines of a windowed file a selection is read with. Every line costs at least the newline
 * that follows it, so a selection longer than one entry's room cannot fit even its first
 * lines, and reading further only hands `fittedAskTextOf` lines to drop.
 */
export const ASK_MAX_LINES = PROMPT_CONTEXT_ENTRY_MAX_CHARS;

/** The most characters one `Code` or `Markdown` element holds (the host's leaf cap). */
export const MAX_ELEMENT_CHARS = 10_000;

/**
 * The most bytes `$.fs.read` returns: the engine's own cap, which it states and enforces
 * ("A read or a write over 4 MiB rejects"). A file past it is read a window at a time instead.
 */
export const READ_MAX_BYTES = 4_194_304;
