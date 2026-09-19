# Limits

What sidepad does not do, or does only in part, and where each limit is set. The list is
written by `bun run limits` from the `// LIMIT:` comments in the code: change the comment, then
run it. `bun run test` fails while this file and the comments disagree.

A limit Claude Code sets names the version it was measured on. `bun run probe` lists the ones
measured on a version other than the one running, to measure again: a release can lift one.

## Set by Claude Code

The engine decides these; sidepad draws around them.

- `plugins/sidepad/hooks/handlers/run-sidepad-command.ts`, `runSidepadCommand`: Claude Code 2.1.277's `/diff` panel covers the pane while it is open, and the toggle then closes or opens a pane nobody sees.
- `plugins/sidepad/hooks/handlers/scroll-pane.ts`, `scrollPane`: Claude Code 2.1.277 sends no `ui.scroll` for the first wheel tick after the wheel changes direction (#38), so that tick moves nothing.
- `plugins/sidepad/hooks/handlers/scroll-pane.ts`, `scrollPane`: Home and End arrive as `by` the engine's own tree rows, and that tree always fits the body, so they move one page, as Page Up and Page Down do (Claude Code 2.1.277).
- `plugins/sidepad/hooks/limits/sizes.ts`, `PROMPT_CONTEXT_ENTRY_MAX_CHARS`: a context entry past 100,000 characters reaches the model as a 2 KB head and the path of a copy, so a selection is cut to it first (Claude Code 2.1.278, #21).
- `plugins/sidepad/hooks/limits/sizes.ts`, `PROMPT_CONTEXT_MAX_CHARS`: a context entry that takes a prompt's context past 200,000 characters reaches the model as a 2 KB head and a path (Claude Code 2.1.278, #21).
- `plugins/sidepad/hooks/surfaces/code-view.tsx`, `codeView`: the blank lines ending a window draw with no gutter number (Claude Code 2.1.277, #39), which is the engine's.
- `plugins/sidepad/hooks/views/list-page.tsx`, `listPage`: the ring knows only the rows drawn, and wraps from the last one to `..`; a window moved under it keeps the ring's place on screen, not its row (Claude Code 2.1.277). The rows past the window are reached with Page Down, never by the arrows alone.

## Set by sidepad

Choices and simplifications of the plugin itself.

- `plugins/sidepad/hooks/bar/bar-layout-of.ts`, `barLayoutOf`: an item wider than the room keeps a row of its own and is clipped.
- `plugins/sidepad/hooks/code-blocks/bracket-balance-of.ts`, `bracketBalanceOf`: quotes and comments are read line by line (`'`, `"`, `` ` ``, `//`, `#`); a string or a block comment spanning lines, a regex, or a `#` that is not a comment can miscount.
- `plugins/sidepad/hooks/code-blocks/code-block-at.ts`, `codeBlockAt`: over a window of a file too large to read whole, a block stops at the window's edges.
- `plugins/sidepad/hooks/files/is-binary-text.ts`, `isBinaryText`: a NUL is the only test; what `$.fs.read` returns for a binary file is not declared.
- `plugins/sidepad/hooks/files/loaded-file-of.ts`, `loadedFileOf`: the `\r` of a CRLF file stays at its line's end.
- `plugins/sidepad/hooks/files/windowed-file-of.ts`, `windowedFileOf`: its Markdown is never formatted, since cutting a document into blocks needs all of it, and a click selects a block only within the window held.
- `plugins/sidepad/hooks/handlers/start-session.ts`, `startSession`: a reload starts from an empty state; an open pane's page and the edited list are gone.
- `plugins/sidepad/hooks/listing/listing-label-of.ts`, `listingLabelOf`: a cell per code point; a wide or combining character miscounts.
- `plugins/sidepad/hooks/markdown-blocks/markdown-blocks-of.ts`, `markdownBlocksOf`: a CommonMark subset: no setext headings, no HTML blocks, no lazy continuation of a list item by an unindented line.
- `plugins/sidepad/hooks/plan/code-source-lines-of.ts`, `codeSourceLinesOf`: on a page wider than the cap divided by its rows, a line longer than the cut shows cut.
- `plugins/sidepad/hooks/surfaces/code-view.tsx`, `latest`: one box for the module: the pane draws a single code Client.

## In the tooling

Limits of the checks in `.github/scripts/`, not of the pane.

- `.github/scripts/live/screen.ts`, `paneOf`: columns are counted in code points, so a wide character left of the border on a pane row (an emoji in the transcript) shifts that row. The runner's sessions hold no model turn.
- `.github/scripts/live/screen.ts`, `codeRowsOf`: Claude Code 2.1.277 numbers no trailing blank line of a `Code` (#39), so a window ending on a selected blank line draws its row as the marker alone. Such a row right below a code row is read as the next line; an unselected one draws nothing and is not read at all.
