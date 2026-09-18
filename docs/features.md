# Features

What sidepad does, feature by feature, with the rules each one follows and the limits it carries.
The pane is read only: every change to a file is Claude's, made from what the person selected.

Each behaviour below was measured on the Claude Code version the repository builds against. Mods are
early access, so a release can change what an event or a pane primitive does.

Screenshots belong beside the feature they show, and they are taken on a synthetic project: sidepad
draws file contents and a file tree, so a capture of a real project publishes it. `bun run
playground` writes one, with a file past the read cap, a line and a Markdown block past what one
element holds, and a binary file.

## Opening and closing the pane

`/sidepad` opens the pane and closes it again. It opens on the page it last showed, and on the
session directory's listing the first time. `/sidepad auto off` stops it opening on Claude's edits,
`/sidepad auto on` allows it again, and `/sidepad auto` says which it is; the setting is kept in the
plugin's store, so it survives a new session.

A pane the person closed with its mark stays closed for the rest of the session, whatever Claude
edits. `/sidepad` opens it again, and so does `/clear` or `/resume`, which forget the session's
state: the pane closes, the edited list empties and the selection goes, while the auto-open setting
and the terminal's layout stay.

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

## Navigating

The pane shows one page at a time: a file, a directory's listing, or the files Claude edited.

`..` sits on the top row and goes from a file to its directory and from a directory to its parent. It
never goes above the session's directory, and it is absent there. In a listing a directory is
entered and a file is opened, and the row the page was entered from is marked `●`.

The path on the top row is relative to the session's directory: `.` and each directory of it open
that directory, while the file, or the directory shown, is text. Leading pieces give way to `…/` when
the row is too narrow. A path outside the session's directory is text only.

`Edited N` lists the files Claude edited this session, most recent first. Its `•` means one changed
while the person was reading something else, and it goes when the list is opened.

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
lines per wheel tick.

Markdown is drawn two ways, and the top row switches between them:

- `Formatted`: the engine's renderer draws it, block by block, tables and fences included. One wheel
  tick moves one block, since a block's height is known only once it is laid out.
- `Source`: the file's own lines, as code is drawn.

The file's text is never altered to draw it. Two consequences the page carries:

- A line longer than the page is cut to the page's width and a margin before it is handed to the
  engine, which refuses a drawing whose block passes 10,000 characters. What shows is the same,
  since the page truncates every line at its right edge, and a selection reaches the model from the
  file's own lines.
- A formatted Markdown block past that same cap draws `Block too long to format: see Source`.

A file the pane cannot draw shows a dim note instead of its content: `Binary file: not shown` for a
file whose text holds a NUL, `Could not read this file` for one that is missing or is not a regular
file, and `File too large to show (N MB)` for one past the read cap where the pane has no way to read
a window of it.

A file over 4 MiB is past what the engine's `fs.read` returns. Such a file is read one window at a
time with commands on the host, `grep -c ''` to count its lines once and `sed` to print each window,
and a selection in it is read the same way when the prompt carries it. On a host without those
commands the page shows the too-large note instead. A file read this way is never formatted as
Markdown, since cutting a document into blocks needs all of it, and a click selects a block only
inside the window held.

## Selecting a passage

A drag selects lines. A click selects the block under it, and a click on the block that is already
selected clears it. The selected rows carry a `▌` over the line numbers' first cell and a background
in the cells their text leaves free.

What a click selects depends on the line:

- Code: a line that leaves brackets open selects through the line that closes them; else a line
  followed by more indented lines selects them with it (Python, YAML); else its paragraph, up to a
  blank line and never past a line less indented than it. A heuristic, with no parser: quotes and
  comments are read line by line, so a string or a block comment spanning lines can miscount.
- Markdown, formatted: the block under the pointer, and its source lines are what the selection
  holds.
- Markdown, source: the Markdown block the line belongs to, which is a CommonMark subset: no setext
  headings, no HTML blocks, no lazy continuation of a list item.

A drag held past the window's edge scrolls one line at a time and keeps growing. On release, and
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
line numbers and the lines as the file has them. The pane caps that context at 32,000 characters,
so a selection is cut at a whole line with a note saying the rest was cut. A selection with no room at all is dropped, and the pane's status line says so. The selection is
cleared once the prompt was not dropped.

## Files changed outside the pane

After a `Bash` or `PowerShell` call that ran, and when the pane opens, the page is checked against
the disk:

- A file that is gone gives way to its nearest existing directory, which opens on a dim note
  naming what left, for example `src/report.ts is no longer on disk`.
- A file whose size or modification time moved is read again in place, and an active selection in it
  is cleared.
- A directory is listed again, and one that is gone gives way as a file does.

A rename is not inferred from the command's text: the file is gone and its directory is listed.
