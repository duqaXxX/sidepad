import type { Palette } from './palette';

const plainCode = (color: string) => ({ color, bold: false, underline: false });

/**
 * Every palette the themes draw with. Each text colour is 4.5 to 1 or more against its background
 * on its own theme, the page's background being the dock's (`composerSidebarBackground`, #262626
 * dark and #f5f5f5 light, measured on Claude Code 2.1.278) or the terminal's where the pane sits
 * inline. The status line's band is not the dock's colour, which would hide it. A selected row on a
 * formatted page drops `rule` and `link` for the terminal's own colour: no link colour reads on
 * every selection background.
 *
 * LIMIT(theme-colour-names): `auto` and `contrast` name Claude Code's theme colours (`selectionBg`, `autoAccept`...),
 * read from the Claude Code 2.1.280 build rather than its declarations, which name only a few. A
 * name the engine does not know draws with no error: text in the terminal's own colour, a background
 * in the pane's own; `check:live` checks that each one resolves.
 */
export const PALETTES = {
  /** Claude Code's own theme colours, resolved by the engine against the person's theme. */
  auto: {
    rule: 'subtle',
    accent: 'autoAccept',
    link: 'autoAccept',
    barText: 'inverseText',
    statusBackground: 'subtle',
    statusText: 'text',
    selectionBackground: 'selectionBg',
    selectionText: null,
    inlineCode: plainCode('remember'),
  },
  /** The pane's own colours for a dark Claude Code theme. */
  classicDark: {
    rule: '#4a4a4a',
    accent: '#3b5bdb',
    link: '#8ea2f0',
    barText: '#ffffff',
    statusBackground: '#303030',
    statusText: '#a0a0a0',
    selectionBackground: '#264f78',
    selectionText: null,
    inlineCode: plainCode('#e5c07b'),
  },
  /** The pane's own colours for a light Claude Code theme. */
  classicLight: {
    rule: '#d0d7de',
    accent: '#0969da',
    link: '#0969da',
    barText: '#ffffff',
    statusBackground: '#d8dee4',
    statusText: '#424a53',
    selectionBackground: '#cfe3ff',
    selectionText: null,
    inlineCode: plainCode('#9a3412'),
  },
  /** Inverse video: the theme's text colour as a background under its inverse. */
  contrast: {
    rule: 'text',
    accent: 'text',
    link: 'text',
    barText: 'inverseText',
    statusBackground: 'text',
    statusText: 'inverseText',
    selectionBackground: 'text',
    selectionText: 'inverseText',
    inlineCode: { color: null, bold: true, underline: true },
  },
} as const satisfies Record<string, Palette>;
