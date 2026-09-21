import type { ThemeName } from './theme-name';
import { THEME_NAMES } from './theme-names';

/**
 * The theme a stored value names. The store is a JSON file a person can edit, so anything that is
 * not a theme's name, an absent key included, reads as the default.
 *
 * @returns the theme, `auto` when the value names none
 */
export function themeNameOf(stored: unknown): ThemeName {
  return THEME_NAMES.find((name) => name === stored) ?? THEME_NAMES[0];
}
