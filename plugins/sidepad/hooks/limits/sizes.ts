/**
 * The most characters a prompt's context carries, its entries together, so a selection is fitted to
 * what is left. It was the engine's cap up to 2.1.274; 2.1.276 declares none.
 */
// LIMIT: kept at the old cap until the cap on 2.1.276 is decided (#21).
export const PROMPT_CONTEXT_MAX_CHARS = 32_000;

/**
 * The most lines of a windowed file a selection is read with. Every line costs at least the newline
 * that follows it, so a selection longer than the whole context's room cannot fit even its first
 * lines, and reading further only hands `fittedAskTextOf` lines to drop.
 */
export const ASK_MAX_LINES = PROMPT_CONTEXT_MAX_CHARS;

/** The most characters one `Code` or `Markdown` element holds (the host's leaf cap). */
export const MAX_ELEMENT_CHARS = 10_000;

/**
 * The most bytes `$.fs.read` returns: the engine's own cap, which it states and enforces
 * ("A read or a write over 4 MiB rejects"). A file past it is read a window at a time instead.
 */
export const READ_MAX_BYTES = 4_194_304;
