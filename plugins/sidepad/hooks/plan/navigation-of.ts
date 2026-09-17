import Names from '../names';
import type PaneState from '../pane-state';
import type { Pressable } from './pane-plan';

/**
 * The top row's Buttons, left to right: `..` (not on the edited page, not at the session's
 * directory), `Edited N` once Claude edited a file (`•` when one changed out of view), and on a
 * Markdown file the mode it switches to.
 *
 * @returns the Buttons
 */
export function navigationOf(state: PaneState.PaneState): Pressable[] {
  const page = state.page;
  const hasUp = page.kind === 'file' ? state.file !== null : page.kind === 'directory' && page.path !== state.cwd;
  const markdown = page.kind === 'file' ? state.file?.markdown : null;
  const count = state.edited.paths.length;

  return [
    ...(hasUp ? [{ key: Names.NAV_UP_KEY, label: '..' }] : []),
    ...(count > 0
      ? [{ key: Names.NAV_EDITED_KEY, label: `Edited ${count}${state.edited.hasUnseen ? ' •' : ''}` }]
      : []),
    ...(markdown
      ? [{ key: Names.NAV_MARKDOWN_KEY, label: markdown.mode === 'formatted' ? 'Source' : 'Formatted' }]
      : []),
  ];
}
