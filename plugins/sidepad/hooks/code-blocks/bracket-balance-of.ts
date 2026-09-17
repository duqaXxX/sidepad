const OPENERS = '([{';
const CLOSERS = ')]}';

/**
 * A line's bracket balance: openers minus closers, outside quotes and before a line comment.
 *
 * LIMIT: quotes and comments are read line by line (`'`, `"`, `` ` ``, `//`, `#`); a string or a
 * block comment spanning lines, a regex, or a `#` that is not a comment can miscount.
 *
 * @returns the net count of opening brackets
 */
export function bracketBalanceOf(line: string): number {
  let balance = 0;
  let quote: string | null = null;

  for (let at = 0; at < line.length; at += 1) {
    const char = line[at]!;

    if (quote) {
      if (char === '\\') {
        at += 1;
      } else if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if ((char === '/' && line[at + 1] === '/') || char === '#') {
      break;
    } else if (OPENERS.includes(char)) {
      balance += 1;
    } else if (CLOSERS.includes(char)) {
      balance -= 1;
    }
  }

  return balance;
}
