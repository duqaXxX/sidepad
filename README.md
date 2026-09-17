# sidepad

A Claude Code mod that adds a read-only side pane to the terminal: a file tree, a viewer for code
and rendered Markdown, and a way to send a selected passage back to Claude.

## Status

The plugin is built and its tests pass, and there is no release to install yet: the marketplace here
serves it from source. Its own reference is [plugins/sidepad/README.md](plugins/sidepad/README.md).

## What it does

| Feature | Behaviour |
|---|---|
| Auto-open | At the end of Claude's turn the pane opens on the last file the turn edited, at its first changed line |
| Navigation | One page at a time: a file, a directory's listing, or the files Claude edited this session. `..` goes up, a directory is entered, a file opened |
| Viewer | Code with the engine's highlighting, Markdown formatted or line by line |
| Ask about a selection | Drag lines or click a block, then send it with a command of the bar or with the next prompt you type |

The pane is read-only. Every change to a file is made by Claude from a selection.

## Requirements

sidepad is a mod: a Claude Code plugin whose behaviour lives in a hooks module. Mods are early
access in Claude Code, load only with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`, and their API may
change between Claude Code releases without notice.

The pane draws where the layout docks it beside the transcript, which is the fullscreen layout, and
from 110 terminal columns. On the main screen nothing opens by itself.

## Installation

Once a release exists, sidepad installs from the plugin marketplace this repository serves:

```
claude plugin marketplace add duqaXxX/sidepad
claude plugin install sidepad@sidepad
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports go through [SECURITY.md](SECURITY.md).
Changes are recorded in [docs/CHANGELOG.md](docs/CHANGELOG.md).

## License

[MIT](LICENSE)
