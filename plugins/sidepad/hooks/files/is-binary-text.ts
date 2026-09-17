// Spelled as a char code: a literal escape written through an editor has put a real NUL byte in a
// source file before.
const NUL = String.fromCharCode(0);

/**
 * Whether a file's text is binary.
 *
 * LIMIT: a NUL is the only test; what `$.fs.read` returns for a binary file is not declared.
 *
 * @returns true when the text holds a NUL
 */
export const isBinaryText = (text: string) => text.includes(NUL);
