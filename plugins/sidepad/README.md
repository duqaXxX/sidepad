# sidepad

A read-only pane beside the transcript. `/sidepad` opens it and closes it again, and it opens by
itself on the file Claude last wrote or edited, at the end of the turn. It shows one page at a time:
a file, a directory's listing, or the files Claude edited this session. Code is drawn with the
engine's own highlighter, Markdown with its own renderer, and a passage selected with the mouse
reaches Claude through a command of the bar or the next prompt typed.

Nothing in the pane edits a file: every change is Claude's, made from what the person selected.

## What it does

| Part | Behaviour |
|---|---|
| Opening | `/sidepad` opens the pane on the page it last showed, the session directory's listing the first time, and closes it again. On a terminal under 110 columns it answers `Resize your terminal to at least 110 columns to show the sidepad pane` and opens nothing, since the engine draws no pane there; an edit opens one by itself only from 144 columns, the engine's floor for a pane nobody asked for. `/sidepad auto off` stops it opening on Claude's edits, `/sidepad auto on` allows it, and `/sidepad auto` says which it is. The setting is kept in the plugin's store |
| Following Claude | At the end of the main loop's turn the pane opens on, or moves to, the last file the turn edited, at its first changed line. A person reading another file or a listing is left alone and `Edited N` is marked `•`. A selection cleared by one of the turn's edits keeps the view where it was. A pane closed with its mark stays closed for the session |
| Navigation | `..` on the top row goes from a file to its directory and from a directory to its parent, never above the session's directory. In a listing a directory is entered and a file opened. Each directory of the path on the top row opens that directory. `Edited N` lists the files Claude edited, most recent first |
| Viewer | Code with the engine's highlighting and its line numbers. Markdown formatted, or line by line under `Source`. A directory listing shows every entry, hidden ones included |
| Selection | A drag selects lines, a click selects the block under it (a bracketed block, an indented block, or a paragraph in code; a paragraph, table, list or fenced block in Markdown), and a click on the block already selected clears it. The selected rows carry a `▌` and a background |
| Asking | The bar over a selection sends it at once with `Explain`, `Find issues` or `Rewrite`; `Ask…` says to type the question in the prompt, where the selection rides the next prompt as context the model reads. A selection too long for the prompt's context is cut, and one with no room at all is dropped with a line saying so |
| Files changed elsewhere | After a `Bash` or `PowerShell` call the page is checked against the disk: a file that is gone gives way to its directory with a note naming it, a file that changed is read again in place, and a listing is read again. A rename is not inferred from the command |

## Requirements

Claude Code with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`. Mods are early access and their API changes
between releases, so the pane is verified against one Claude Code version at a time.

The pane draws where the layout docks it beside the transcript, from 110 terminal columns when
`/sidepad` asks for it and from 144 when an edit opens it unasked. On the main screen a pane lands
inline and two rows tall, so nothing opens there by itself.

## What it hooks

| Event | What the hook does |
|---|---|
| `session.start` | Binds the engine's calls once and registers `/sidepad`. It runs again on a plugin reload, which starts from an empty pane |
| `command.run` of `sidepad` | Opens or closes the pane, or reads and sets the auto-open switch |
| `command.run`, any | Keeps the layout the first command's `presentation` reports, fixed per session, and reads the terminal's width from it |
| `ui.render` of `PromptHint` | Reads the terminal's width from the line the engine draws under the prompt, which is how the width is known before a pane exists |
| `command.run` of `clear`, `resume` | Closes the pane and forgets the session's edits, selection and close |
| `ui.render` of `Pane` | Draws the pane: the top row, the page, and the command bar over a selection. The first drawing after an unasked open closes a pane placed inline |
| `ui.scroll` of the pane | Moves the page's own window (three lines a wheel tick, a block of formatted Markdown a tick) and leaves the engine's window still |
| `ui.message` of the pane | The pointer and the block heights its `Client` surfaces post |
| `ui.press` of the pane | The top row's Buttons, the list's rows and the bar's commands |
| `ui.close` of the pane | Remembers a close the person made with the pane's mark |
| `prompt.submit` | Attaches the selection to the prompt's context and clears it |
| `tool.call` of `Edit`, `Write`, `NotebookEdit` | Records an edit that landed and reads the open file again |
| `tool.call` of `Bash`, `PowerShell` | Checks the page against the disk after a command that ran |
| `turn.complete` | The main loop's turn end decides which file the pane shows; a subagent's turn carries `agentId` and waits for its parent |

## What it calls on `$`

`command.register`, `fs.list`, `fs.read`, `fs.stat`, `process.run` (a window of a file too large to
read whole), `prompt.submit`, `store.get`, `store.set`, `ui.close`, `ui.invalidate`, `ui.open`,
`ui.resolve`, `ui.status`.

## Limits

- A file over 4 MiB is past what `$.fs.read` returns, so it is read one window at a time with
  commands on the host: `grep -c ''` counts its lines once and `sed` prints each window. Where those
  commands are missing the pane says the file is too large.
  Such a file is never formatted as Markdown, and a click selects a block only inside the window
  held.
- A binary file, told by a NUL in its text, is not shown.
- One `Code` or `Markdown` element holds 10,000 characters, so a line longer than the page is cut at
  its width (the page truncates it there anyway) and a Markdown block past the cap draws a note
  pointing at `Source`.
- The command bar takes the body's last rows and wraps onto more of them in a narrow pane.
- The pane's width is the person's to drag; no mod API sets it.

## Reading it from source

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir plugins/sidepad
```

Its tests run with `claude plugin test plugins/sidepad`, and `claude plugin validate plugins/sidepad
--strict` checks the manifest.
