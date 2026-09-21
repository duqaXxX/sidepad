import type { Palette } from './palette';
import { PALETTES } from './palettes';
import type { ThemeName } from './theme-name';

/**
 * The palette a theme draws with under Claude Code's theme. `classic` takes the variant for a
 * `dark` or a `light` Claude Code theme (their daltonized and ANSI forms included); under `auto`,
 * or a theme nobody read, it draws the `auto` palette, since the `theme` row says `auto` and not
 * what it resolved to (measured on Claude Code 2.1.278).
 *
 * @param claudeTheme the value of `$.config.list()`'s `theme` row, null when it could not be read
 * @returns the palette
 */
export function paletteOf(name: ThemeName, claudeTheme: string | null): Palette {
  if (name !== 'classic') {
    return PALETTES[name];
  }

  if (claudeTheme?.startsWith('dark')) {
    return PALETTES.classicDark;
  }

  return claudeTheme?.startsWith('light') ? PALETTES.classicLight : PALETTES.auto;
}
