/** Element keys that carry an index or an id after a prefix: `crumb:2`, `row:14`, `command:explain`, `page:0`. */
export const KEY_PREFIXES = {
  crumb: 'crumb:',
  row: 'row:',
  command: 'command:',
  page: 'page:',
} as const;

/**
 * The key of the element numbered `index` (or named `id`) under a prefix.
 *
 * @returns `<prefix><index>`
 */
export const keyOf = (prefix: keyof typeof KEY_PREFIXES, index: number | string) => `${KEY_PREFIXES[prefix]}${index}`;

/**
 * The index a key carries under a prefix.
 *
 * @returns the non-negative integer after the prefix, or null when the key is not one of them
 */
export function indexOfKey(prefix: keyof typeof KEY_PREFIXES, key: string): number | null {
  if (!key.startsWith(KEY_PREFIXES[prefix])) {
    return null;
  }

  const index = Number(key.slice(KEY_PREFIXES[prefix].length));

  return Number.isInteger(index) && index >= 0 ? index : null;
}

/**
 * The id a key carries under a prefix.
 *
 * @returns the text after the prefix, or null when the key is not one of them
 */
export const idOfKey = (prefix: keyof typeof KEY_PREFIXES, key: string): string | null =>
  key.startsWith(KEY_PREFIXES[prefix]) ? key.slice(KEY_PREFIXES[prefix].length) : null;
