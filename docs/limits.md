# Limits

What sidepad does not do, or does only in part, and where each limit is set. The list is
written by `bun run limits` from the `// LIMIT:` comments in the code: change the comment, then
run it. `bun run test` fails while this file and the comments disagree.

A limit Claude Code sets names the version it was measured on. `bun run probe` lists the ones
measured on a version other than the one running, to measure again: a release can lift one.

## Set by Claude Code

The engine decides these; sidepad draws around them.

- `plugins/sidepad/hooks/block-layout/block-layout.ts`, `blockLayoutOf`: a block whose source exceeds MAX_ELEMENT_CHARS characters is drawn as a note; its source is still readable under Source (Claude Code 2.1.278, #54).
- `plugins/sidepad/hooks/handlers/run-sidepad-command.ts`, `runSidepadCommand`: Claude Code 2.1.278's `/diff` panel covers the pane while it is open, and the toggle then closes or opens a pane nobody sees.
- `plugins/sidepad/hooks/handlers/scroll-pane.ts`, `scrollPane`: Claude Code 2.1.278 sends no `ui.scroll` for the first wheel tick after the wheel changes direction (#38), so that tick moves nothing.
- `plugins/sidepad/hooks/handlers/scroll-pane.ts`, `scrollPane`: Home and End arrive as `by` the engine's own tree rows, and that tree always fits the body, so they move one page, as Page Up and Page Down do (Claude Code 2.1.278).
- `plugins/sidepad/hooks/images/image-kind-of.ts`, `imageKindOf`: an Image takes a whole PNG or raw pixels, so a JPEG, a GIF or a WebP cannot be drawn (Claude Code 2.1.278).
- `plugins/sidepad/hooks/limits/sizes.ts`, `PROMPT_CONTEXT_ENTRY_MAX_CHARS`: a context entry past 100,000 characters reaches the model as a 2 KB head and the path of a copy, so a selection is cut to it first (Claude Code 2.1.278, #21).
- `plugins/sidepad/hooks/limits/sizes.ts`, `PROMPT_CONTEXT_MAX_CHARS`: a context entry that takes a prompt's context past 200,000 characters reaches the model as a 2 KB head and a path (Claude Code 2.1.278, #21).
- `plugins/sidepad/hooks/plan/code-grammar-path-of.ts`, `codeGrammarPathOf`: Code's `format: 'diff'` reads a whole diff and refuses a source with no `@@` header, unmounting the Client that drew it; the pane hands Code one window of the file, so a window inside a hunk would blank the page. A diff is coloured by the grammar its path resolves instead, which keeps the pane's own line gutter (Claude Code 2.1.278, #57).
- `plugins/sidepad/hooks/plan/code-grammar-path-of.ts`, `codeGrammarPathOf`: the diff grammar colours the `---`, `+++` and `@@` lines and leaves added and removed lines the colour of ordinary text, so a diff drawn by the pane marks its headers and nothing else (Claude Code 2.1.278, #57).
- `plugins/sidepad/hooks/surfaces/code-view.tsx`, `codeView`: the blank lines ending a window draw with no gutter number (Claude Code 2.1.278, #39), which is the engine's.
- `plugins/sidepad/hooks/surfaces/markdown-page-view.tsx`, `fenceSourceOf`: a `Code` drawing no gutter of its own draws no row for an empty line (Claude Code 2.1.278), so a blank line inside a fence came out at the fence's foot and the lines under it a row high.
- `plugins/sidepad/hooks/views/list-page.tsx`, `listPage`: the ring knows only the rows drawn, and wraps from the last one to `..`; a window moved under it keeps the ring's place on screen, not its row (Claude Code 2.1.278). The rows past the window are reached with Page Down, never by the arrows alone.

## Set by sidepad

Choices and simplifications of the plugin itself.

- `plugins/sidepad/hooks/bar/bar-layout-of.ts`, `barLayoutOf`: an item wider than the room keeps a row of its own and is clipped.
- `plugins/sidepad/hooks/code-blocks/bracket-balance-of.ts`, `bracketBalanceOf`: quotes and comments are read line by line (`'`, `"`, `` ` ``, `//`, `#`); a string or a block comment spanning lines, a regex, or a `#` that is not a comment can miscount.
- `plugins/sidepad/hooks/code-blocks/code-block-at.ts`, `codeBlockAt`: over a window of a file too large to read whole, a block stops at the window's edges.
- `plugins/sidepad/hooks/delimited/delimited-kind-of.ts`, `delimitedKindOf`: the separator is decided by the file's extension, so a .csv written with semicolons draws as one column.
- `plugins/sidepad/hooks/delimited/delimited-table-of.ts`, `delimitedTableOf`: a lone `\r` ends a record but opens no line, so every record of a file written with classic Mac line endings names the one source line they share, and a click on any of them selects it whole.
- `plugins/sidepad/hooks/files/is-binary-text.ts`, `isBinaryText`: a NUL is the only test; what `$.fs.read` returns for a binary file is not declared.
- `plugins/sidepad/hooks/files/loaded-file-of.ts`, `loadedFileOf`: the `\r` of a CRLF file stays at its line's end.
- `plugins/sidepad/hooks/files/windowed-file-of.ts`, `windowedFileOf`: its Markdown is never formatted, since cutting a document into blocks needs all of it, and a click selects a block only within the window held.
- `plugins/sidepad/hooks/handlers/load-file.ts`, `pageImagesOf`: a page sizes its pictures until the next one would take it past IMAGE_BYTES_BUDGET, skips that one and keeps trying the rest, so a picture too large for the room left draws as text while a smaller one after it still draws: sizing one costs a read of the whole file.
- `plugins/sidepad/hooks/handlers/load-file.ts`, `pageImagesOf`: a picture is sized when the page holding it is read, so one replaced on disk while its page stays open keeps the size and the pixels it had until that page is read again.
- `plugins/sidepad/hooks/handlers/start-session.ts`, `startSession`: a reload starts from an empty state; an open pane's page and the edited list are gone.
- `plugins/sidepad/hooks/images/image-box-of.ts`, `imageBoxOf`: the cell's aspect ratio is assumed (IMAGE_CELL_ASPECT), not measured; a picture may be a little taller or shorter on a terminal whose cells differ.
- `plugins/sidepad/hooks/listing/listing-label-of.ts`, `listingLabelOf`: a cell per code point; a wide or combining character miscounts.
- `plugins/sidepad/hooks/page-layout/page-segments-of.ts`, `pageSegmentsOf`: a picture the window cuts is scaled into the rows it shows rather than cropped, since an Image scales to fill the box it is given.
- `plugins/sidepad/hooks/plan/code-source-lines-of.ts`, `codeSourceLinesOf`: on a page wider than the cap divided by its rows, a line longer than the cut shows cut.
- `plugins/sidepad/hooks/spans/wrapped-rows-of.ts`, `wrappedRowsOf`: width is counted in code points; a full-width or emoji character counts as one cell, so a row holding one comes out a cell short.
- `plugins/sidepad/hooks/surfaces/code-view.tsx`, `latest`: one box for the module: the pane draws a single code Client.
- `plugins/sidepad/hooks/tables/table-of.ts`, `tableOf`: a cell's inline markup is dropped, so bold, code and a link's target read as plain words.
- `plugins/sidepad/hooks/tables/table-rows-of.ts`, `tableRowsOf`: a table whose columns cannot fit, even at their smallest, is drawn wider than the page and cut at its right edge.

## In the tooling

Limits of the checks in `.github/scripts/`, not of the pane.

- `.github/scripts/live/screen.ts`, `paneOf`: columns are counted in code points, so a wide character left of the border on a pane row (an emoji in the transcript) shifts that row. The runner's sessions hold no model turn.
- `.github/scripts/live/screen.ts`, `codeRowsOf`: Claude Code 2.1.278 numbers no trailing blank line of a `Code` (#39), so a window ending on a selected blank line draws its row as the marker alone. Such a row right below a code row is read as the next line; an unselected one draws nothing and is not read at all.
