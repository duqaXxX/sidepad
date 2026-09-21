import { describe, expect, test, tier } from 'claude-code/testing';

import Theme from '../hooks/theme';

tier('user');

// The page's background: the dock's, which Claude Code 2.1.278 paints `composerSidebarBackground`, or
// the terminal's where the pane sits inline.
const DARK_PAGES = ['#262626', '#1c1c1c'];
const LIGHT_PAGES = ['#f5f5f5', '#ffffff'];

/** The WCAG contrast ratio of two `#rrggbb` colours. */
function contrastOf(a: string, b: string): number {
  const luminanceOf = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((at) => {
      const channel = Number.parseInt(hex.slice(at, at + 2), 16) / 255;

      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const [high, low] = [luminanceOf(a), luminanceOf(b)].sort((x, y) => y - x);

  return (high! + 0.05) / (low! + 0.05);
}

describe('theme', () => {
  test('a stored value that names no theme reads as auto', () => {
    expect(Theme.themeNameOf('classic')).toBe('classic');
    expect(Theme.themeNameOf('contrast')).toBe('contrast');

    for (const stored of [undefined, null, 'Classic', 'midnight', 3, true, ['classic']]) {
      expect(Theme.themeNameOf(stored), JSON.stringify(stored)).toBe('auto');
    }
  });

  test("classic follows Claude Code's theme, and falls back to auto where the theme says auto", () => {
    for (const claude of ['dark', 'dark-daltonized', 'dark-ansi']) {
      expect(Theme.paletteOf('classic', claude), claude).toBe(Theme.PALETTES.classicDark);
    }

    for (const claude of ['light', 'light-daltonized', 'light-ansi']) {
      expect(Theme.paletteOf('classic', claude), claude).toBe(Theme.PALETTES.classicLight);
    }

    expect(Theme.paletteOf('classic', 'auto')).toBe(Theme.PALETTES.auto);
    expect(Theme.paletteOf('classic', null), 'a theme nobody read').toBe(Theme.PALETTES.auto);
  });

  test("auto and contrast draw the same palette whatever Claude Code's theme", () => {
    for (const claude of ['dark', 'light', 'auto', null]) {
      expect(Theme.paletteOf('auto', claude)).toBe(Theme.PALETTES.auto);
      expect(Theme.paletteOf('contrast', claude)).toBe(Theme.PALETTES.contrast);
    }
  });

  test("classic's text reads at 4.5 to 1 or more on its own terminal", () => {
    const variants = [
      { palette: Theme.PALETTES.classicDark, pages: DARK_PAGES, text: '#e6e6e6' },
      { palette: Theme.PALETTES.classicLight, pages: LIGHT_PAGES, text: '#1f2328' },
    ];

    for (const { palette, pages, text } of variants) {
      const code = palette.inlineCode.color;
      const pairs: [string, string, string][] = [
        ['bar text', palette.barText, palette.accent],
        ['status line', palette.statusText, palette.statusBackground],
        ['selected text', text, palette.selectionBackground],
        ['selected inline code', code, palette.selectionBackground],
        ...pages.flatMap((page): [string, string, string][] => [
          [`inline code on ${page}`, code, page],
          [`link target on ${page}`, palette.link, page],
        ]),
      ];

      for (const [name, fore, back] of pairs) {
        expect(contrastOf(fore, back), name).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
