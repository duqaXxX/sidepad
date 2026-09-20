# Features

What sidepad does, feature by feature, with the rules each one follows and the limits it carries.
The pane is read only: every change to a file is Claude's, made from what the person selected.

Each behaviour below was measured on the Claude Code version the repository builds against. Mods are
early access, so a release can change what an event or a pane primitive does. Every limit, and
whether Claude Code or sidepad sets it, is also listed in one place in [limits.md](limits.md).

Screenshots belong beside the feature they show, and they are taken on a synthetic project: sidepad
draws file contents and a file tree, so a capture of a real project publishes it. `bun run
playground` writes one, with a file past the read cap, a line and a Markdown block past what one
element holds, and a binary file.

## Opening and closing the pane

`/sidepad` opens the pane and closes it again. It opens on the page it last showed, and on the
session directory's listing the first time. `/sidepad auto off` stops it opening on Claude's edits,
`/sidepad auto on` allows it again, and `/sidepad auto` says which it is; the setting is kept in the
plugin's store, so it survives a new session.

The pane opened by `/sidepad` takes the keyboard, so the arrows work in it at once. Claude Code
grants that only over an empty prompt box. Typing a character hands the keyboard back to the prompt
and the character lands there; Escape hands it back and leaves the pane open. A pane that opens on
Claude's edits leaves the keyboard with the prompt, whose Up is the prompt history. Claude Code's
`ctrl+x tab` gives the keyboard to the pane, and so does a click on a listing.

A pane the person closed with its mark stays closed for the rest of the session, whatever Claude
edits. `/sidepad` opens it again, and so does `/clear` or `/resume`, which forget the session's
state: the pane closes, the edited list empties and the selection goes, while the page, the
auto-open setting and the terminal's layout stay. This happens when the session ends, so a
`/resume` whose picker is dismissed without choosing a session leaves the pane as it was.

A plugin reload, which Claude Code runs when a module of a plugin loaded from source changes on
disk, starts sidepad from an empty state. A pane still open through it shows the session
directory's listing, since the page it showed and the edited list are gone with the old state.

Claude Code's own `/diff` panel takes the dock while it is open, whichever of the two opened first:
the pane is still open but not drawn, and no tab leads to it. Closing the diff panel with its mark
shows the pane again on its page. While the diff panel is up, `/sidepad` closes or opens a pane
that cannot be seen.

The pane is drawn where the layout docks it beside the transcript, which needs terminal width:

- from 110 columns when `/sidepad` asks for it. Narrower, the command answers
  `Resize your terminal to at least 110 columns to show the sidepad pane` and opens nothing.
- from 144 columns when an edit opens it unasked. Both floors are the engine's own, which keeps a
  pane undrawn below them.

On the main screen, where a pane lands inline and two rows tall, nothing opens by itself. The
terminal says which layout it has from its first drawing, and an edit opens the pane only once the
terminal has said it docks one.

The pane's width is the person's to drag, and no plugin API sets it.

## Following Claude's edits

An edit is recorded as it lands, and which file the pane shows waits for the end of the turn, so a
turn that writes three files moves the pane once. Edits a person approves arrive at the person's own
pace, so no pause groups them; the boundary is the turn, an interrupted one included, since its
edits landed. A subagent's turn carries `agentId` and waits for its parent's.

At the end of the turn, first match wins:

| Where the person is | What the pane does |
|---|---|
| The pane is closed | Opens on the turn's last edited file, at its first changed line, unless the auto-open setting is off, the person closed the pane, the screen is the main one or the terminal is too narrow |
| On the turn's last file, where one of its edits cleared a selection | Stays where it is |
| On the file that was the most recent edit before the turn, or on the turn's last file | Moves to the turn's last file, at its first changed line |
| Reading another file, or a listing | Stays, and `Edited N` is marked `•` |

The first changed line comes from the edit's own record, past the leading context lines of its first
hunk; a file Claude created starts at line 1. A file the pane holds is read again as each edit lands,
so what shows is the file on disk, and an active selection in it is cleared.

## The pane's frame

Every page sits in the same frame, top to bottom:

- The top row: its buttons on the left (`..`, `Edited N`, and on a Markdown file the mode it switches
  to), the path on the right, dim, ending on the file or directory shown in bold. The engine draws
  the close mark at the row's right end.
- A dim rule.
- The page, one blank column in from the pane's divider.
- The command bar, over a selection, on the rows above the status line.
- The status line, on the body's last row: on its left a Markdown file's mode, `Formatted` or
  `Source`; on its right where the page is. A file shows the lines drawn and the file's total, `lines
  4–43 of 407`, a formatted page counting the source lines of the whole blocks drawn. A listing
  shows its count, `8 entries`, and the edited list `3 files`. A page showing a dim note in place of a
  file leaves the right side empty.

The row under the body's last one is the pane's frame, where nothing drawn shows, so the status
line cannot sit lower. Claude Code numbers no blank line ending a code window (#39), so the last lines
the status line names can be blank rows with no number beside them.

## Navigating

The pane shows one page at a time: a file, a directory's listing, or the files Claude edited.

`..` sits on the top row and goes from a file to its directory and from a directory to its parent. It
never goes above the session's directory, and it is absent there. In a listing a directory is
entered and a file is opened, and the row the page was entered from is marked `●`.

The path on the top row is relative to the session's directory: `.` and each directory of it open
that directory, while the file, or the directory shown, is bold text. Leading pieces give way to `…/` when
the row is too narrow. A path outside the session's directory is text only.

`Edited N` lists the files Claude edited this session, most recent first. Its `•` means one changed
while the person was reading something else, and it goes when the list is opened.

With the pane holding the keyboard, Up, Down and Tab move Claude Code's focus ring over the top
row's buttons and the listing's rows, and Enter opens the row the ring is on. The ring knows only
the rows drawn: past the last one it goes back to `..`, and when the listing moves under it the ring
keeps its place on the screen, on the row now drawn there. A listing taller than the pane is brought
into view with Page Down and Page Up, a page of rows at a time. On a file the arrows move the ring
over the top row only; the lines move with the page keys.

A directory's listing shows every entry, hidden ones included, directories first and then the rest,
each group by name.

A directory Claude Code refuses to list shows a dim note and no entries: `Could not list this
directory: ` followed by Claude Code's message, whole, such as a permission refused (`EACCES`) or a
network location it does not reach. The message names the path before the reason, so the note wraps
over as many rows as it takes rather than being cut at the pane's edge. It stands in place of a note
naming what left the disk, and it goes when the page is listed again and the listing succeeds, after
a shell command or when the pane opens.

Every dim note of a page wraps the same way when it is wider than the pane.

## Reading a file

Code is drawn by the engine's own highlighter, with its own line numbers, one window of lines at a
time: a pane's tree is capped, so the whole file is never handed over at once. The window moves three
lines per wheel tick. Claude Code 2.1.278 never delivers the first tick after the wheel changes
direction, so turning the wheel back moves nothing for that one tick, on every page (#38).

With the pane holding the keyboard, Page Down and Page Up move the window by the lines the page
shows, so no line goes by unseen. Claude Code sends Home and End with the size of the pane's own
drawing, which always fits the pane, so they move one page as well rather than to the file's ends.

A Markdown file is cut into blocks by markdown-it, which reads CommonMark and GFM tables: a setext
heading, an HTML block and a list item continued by an unindented line each end where the spec says
they do. The blocks are what a click selects on both pages below.

Markdown is drawn two ways; the top row switches between them and the status line names the one
shown:

- `Formatted`: the pane composes every row itself and draws them in one region, so a formatted page
  scrolls exactly as a code page does: three rows a wheel tick, and a page key moves the rows the
  page shows. A heading is drawn bold without its `#`, a list keeps its marker with its wrapped rows
  hanging under it, a quote carries a coloured marker, inline code takes a colour of its own, and a
  fence is handed to the engine's highlighter, cut at the page's right edge. A paragraph wrapped in
  the file flows to the pane's width, as CommonMark reads a single line break inside a paragraph: a
  space, inside a quote and a list item too. Two spaces or a backslash at a line's end keep the
  break. A table is drawn at the page's width: the columns share the page in proportion to their
  longest cell, a cell too long for its column wraps inside it, and the delimiter row's alignments
  are kept. A cell's inline markup is dropped, so bold, code and a link's target read as plain
  words, and a table whose columns cannot fit even at their smallest is cut at the page's right
  edge. A click selects the block drawn on the row it lands on, and a drag selects every block
  between the two rows. The page keeps its first row while `Source` shows, so switching back lands
  where it was left.
- `Source`: the file's own lines, as code is drawn.

A `.diff` or a `.patch` is coloured by the engine's own diff highlighter, with the pane's line
numbers beside it. Measured on Claude Code 2.1.278, that highlighter marks the `---`, `+++` and `@@`
lines, which open a file and a hunk, and leaves added and removed lines the colour of ordinary text.
The engine can also read a whole diff into hunks and draw their numbers in place of the pane's, but
it refuses a source holding no `@@` header and drops the page that drew it, and the pane hands it one
window of the file at a time: a reader who scrolled into a hunk would be left with a blank page.

A file named `.diff` or `.patch` that holds no `@@ -a,b +c,d @@` header anywhere is drawn as plain
text. The engine reads the diff colours from the name alone, so the pane hands it no path at all for
such a file: a file that is not a diff should not be marked as one. A diff past the read cap keeps
its colours, since the pane never holds all of it to test.

A `.csv` or a `.tsv` is drawn as a table, at the page's width, with the first record as its header.
The columns share the page in proportion to their longest cell, a cell too long for its column wraps
inside it, and a click selects the source lines of the record under it: one line, or the two a
quoted newline spreads a record over. The fields are read per RFC 4180, so a quoted field may hold
the separator, a newline and `""` for one literal quote. The separator comes from the extension, a
comma for `.csv` and a tab for `.tsv`. A file that does not parse, one holding an unterminated
quoted field or no record at all, is plain text; nothing shows an error in the file's place. The
records and the rows come from one reading of the file, so a click never names lines another pass
would have read differently. The top row switches a
table to `Source` and back, as it does a Markdown file, and the status line names the one shown: the
file as it is written is what tells a table that came out wrong, a separator its name does not
match or quoting the parser read another way.

A PNG opens as a picture, as wide as the page and as tall as its proportion allows, up to 24 rows.
The terminal opens and decodes the file itself, so no pixel passes through the plugin. A terminal
that draws no pixels shows the file's name and its pixel size in its place (`logo.png (120×56)`),
which is also what a screen reader reads. A picture overwritten under the same path is drawn again
once the page reads it. Every other image format shows a note instead: a pane may hand the terminal
a whole PNG or raw pixels, and nothing decodes a JPEG, a GIF or a WebP. An `.svg` is not among them,
since it is XML, and it reads as code.

A formatted Markdown page draws a picture where it names one: a paragraph holding nothing but
`![alt](./logo.png)`, whose target resolves next to the file shown and leads to a readable PNG. The
alt is what shows where no pixel is drawn, and the file's own name when the source carries none. A
picture is not selectable: a click on it does nothing, and a drag across it selects the blocks
either side, the paragraph naming the picture with them. A target that leads to no readable PNG
keeps its `alt (target)` text, and so does a paragraph that names a picture beside other words.

The file's text is never altered to draw it. Two consequences the page carries:

- A line longer than the page is cut to the page's width and a margin before it is handed to the
  engine, which refuses a drawing whose block passes 10,000 characters. What shows is the same,
  since the page truncates every line at its right edge, and a selection reaches the model from the
  file's own lines.
- A formatted Markdown block whose source passes that same cap draws
  `Block too long to format: see Source` on one row.

A file the pane cannot draw shows a dim note instead of its content: `Binary file: not shown` for a
file whose text holds a NUL, `Could not read this file` for one that is missing or is not a regular
file, `Image not shown: only PNG is drawn` for a `.jpg`, `.jpeg`, `.gif`, `.webp` or `.bmp`,
and `File too large to show (N MB)` for one past the read cap where the pane has no way to read a
window of it.

A file over 4 MiB is past what the engine's `fs.read` returns. Such a file is read one window at a
time with commands on the host, `grep -c ''` to count its lines once and `sed` to print each window,
and a selection in it is read the same way when the prompt carries it. On a host without those
commands the page shows the too-large note instead. A file read this way is never formatted as
Markdown and never drawn as a table, since each needs all of the file, and a click selects a block
only inside the window held.

## Selecting a passage

A drag selects lines. A click selects the block under it, and a click on the block that is already
selected clears it. On a code page the selected rows carry a `▌` over the line numbers' first cell
and a background in the cells their text leaves free. A formatted Markdown page draws its text from
its own left edge, with no gutter to put a marker in, so its selected rows are painted from edge to
edge instead; a fence inside one is painted only in the cells the engine's highlighter leaves, since
it paints its own background.

What a click selects depends on the line:

- Code: a line that leaves brackets open selects through the line that closes them; else a line
  followed by more indented lines selects them with it (Python, YAML); else its paragraph, up to a
  blank line and never past a line less indented than it. A heuristic, with no parser: quotes and
  comments are read line by line, so a string or a block comment spanning lines can miscount.
- Markdown, formatted: the block under the pointer, and its source lines are what the selection
  holds.
- Markdown, source: the Markdown block the line belongs to.

A drag held past the window's edge scrolls one line, or one row on a formatted page, at a time and
keeps growing. On release, and
again when the pane's width changes, the page scrolls the least that shows the selection above the
command bar; a selection taller than the window keeps the line the drag ended on in view.

Typing right after a selection reaches the prompt box, with no key to press first: the pane's file
view holds no key listener, because one would keep the keyboard after a click.

## Asking Claude about a selection

A command bar draws over a selection, on the pane's last rows, and says which lines it holds. It
wraps onto more rows when the pane is narrow.

`Explain`, `Find issues` and `Rewrite` submit their request at once, and the transcript shows it as a
message the plugin sent. `Ask…` says to type the question in the prompt, where the selection rides
the next prompt.

Either way the selection reaches the model as context the person does not see: the file's path, the
line numbers and the lines as the file has them. Claude Code hands the model a context entry longer
than 100,000 characters, or one that takes the prompt's context past 200,000, as its first 2 KB and
the path of a copy. The pane cuts a selection to the room it has below both, at a whole line, with
a note saying the rest was cut; the lines it keeps reach the model whole, and the entry still names
the file and the lines selected. A selection with no room at all is dropped, and the pane's status
line says so. The selection is cleared once the prompt was not dropped.

## Files changed outside the pane

After a `Bash` or `PowerShell` call that ran, and when the pane opens, the page is checked against
the disk:

- A file that is gone gives way to its nearest existing directory, which opens on a dim note
  naming what left, for example `src/report.ts is no longer on disk`.
- A file whose size or modification time moved is read again in place, and an active selection in it
  is cleared.
- A directory is listed again, and one that is gone gives way as a file does.

A rename is not inferred from the command's text: the file is gone and its directory is listed.
