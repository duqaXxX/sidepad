# sidepad

A read-only pane beside the transcript. `/sidepad` opens it and closes it again, and it opens by
itself on the file Claude last wrote or edited, at the end of the turn. It shows one page at a time:
a file, a directory's listing, or the files Claude edited this session. Code is drawn with the
engine's own highlighter, Markdown with its own renderer, and a passage selected with the mouse
reaches Claude through a command of the bar or the next prompt typed.

Nothing in the pane edits a file: every change is Claude's, made from what the person selected.

## What it does

Each feature with its rules and its limits is in [docs/features.md](../../docs/features.md). In one
line each:

| Part | In one line |
|---|---|
| Opening | `/sidepad` opens the pane on the page it last showed, holding the keyboard, and closes it again, and `/sidepad auto [on\|off]` governs its opening on Claude's edits |
| Following Claude | At the end of the main loop's turn the pane shows the turn's last edited file, or marks `Edited N` when the person is reading something else |
| Frame | The top row ends on the page's name in bold; a status line names the Markdown mode and the lines or entries shown |
| Navigation | `..`, the path's directories, the listing's rows and `Edited N`, one page at a time, by pointer or by the arrows and Enter |
| Viewer | Code with the engine's highlighting and line numbers, Markdown formatted or under `Source`, a `.diff` coloured as a diff, a `.csv` or `.tsv` as a table, a PNG as a picture |
| Selection | A drag takes lines, a click takes the block under it, and a second click clears it |
| Asking | The bar sends the selection with `Explain`, `Find issues` or `Rewrite`, and `Ask…` points at the prompt |
| Files changed elsewhere | After a shell call the page is checked against the disk and follows what it finds |

## Requirements

Claude Code 2.1.278 with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`. Mods are early access and their API
changes between releases, so the pane is verified against one Claude Code version at a time, and
until mods are released it carries no code for an earlier one.

A hooks module may import only its own files and `claude-code`, so the one library the pane uses
travels with it: [markdown-it](https://github.com/markdown-it/markdown-it) (MIT), the bundled ESM
build under `hooks/vendor/`, with its license and its type declarations beside it. It cuts a
Markdown file into the blocks a click selects, and nothing is rendered from it.

The pane draws where the layout docks it beside the transcript, from 110 terminal columns when
`/sidepad` asks for it and from 144 when an edit opens it unasked. On the main screen a pane lands
inline and two rows tall, so nothing opens there by itself.

## What it hooks

| Event | What the hook does |
|---|---|
| `session.start` | Binds the engine's calls once and registers `/sidepad`. It runs again on a plugin reload, which starts from an empty state; a pane the engine still holds shows the session directory's listing |
| `command.run` of `sidepad` | Opens or closes the pane, or reads and sets the auto-open switch |
| `command.run`, any | Reads the terminal's width from the command's `presentation` |
| `ui.render` of `PromptHint` | Reads the terminal's width and layout from the line the engine draws under the prompt, on the terminal only, which is how both are known before a pane exists |
| `ui.render` of `Pane` | Draws the pane: the top row, the page, and the command bar over a selection |
| `ui.scroll` of the pane | Moves the page's own window (three lines or rows a wheel tick, a page key the lines or rows the page shows) and leaves the engine's window still |
| `ui.message` of the pane | The presses, drags and scrolls its `Client` surfaces post |
| `ui.press` of the pane | The top row's Buttons, the list's rows and the bar's commands |
| `ui.close` of the pane | Remembers a close the person made with the pane's mark |
| `prompt.submit` | Attaches the selection to the prompt's context and clears it |
| `tool.call` of `Edit`, `Write`, `NotebookEdit` | Records an edit that landed and reads the open file again |
| `tool.call` of `Bash`, `PowerShell` | Checks the page against the disk after a command that ran |
| `turn.complete` | The main loop's turn end decides which file the pane shows; a subagent's turn carries `agentId` and waits for its parent |
| `session.end` of reason `clear`, `resume` | Closes the pane and forgets the session's edits, selection and close |

## What it calls on `$`

`command.register`, `fs.list`, `fs.read`, `fs.stat`, `process.run` (a window of a file too large to
read whole), `prompt.submit`, `store.get`, `store.set`, `ui.close`, `ui.invalidate`, `ui.open`,
`ui.panes`, `ui.resolve`, `ui.status`.

## Limits

Every feature's limits are stated with it in [docs/features.md](../../docs/features.md), and the
code carries each one as a `// LIMIT:` comment at its site. [docs/limits.md](../../docs/limits.md)
lists them all, split by whether Claude Code or sidepad sets them, written from those comments by
`bun run limits`.

## Reading it from source

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir plugins/sidepad
```

Its tests run with `claude plugin test plugins/sidepad`, and `claude plugin validate plugins/sidepad
--strict` checks the manifest.
