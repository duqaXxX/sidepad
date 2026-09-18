# Changelog

## Unreleased

- `docs/features.md` describes every feature with its rules and its limits, and is where a screenshot
  of one belongs. The two READMEs keep one line per feature and point at it: the root one is the
  landing page, the plugin's own states what it hooks and what it calls on the engine.
- An issue form for work on sidepad itself, beside the three for people reporting or asking.

- The sidepad plugin, version 0.1.0, in `plugins/sidepad/`, served by the marketplace at the
  repository root. `/sidepad` opens or closes a read-only pane beside the transcript; `/sidepad auto`
  switches its opening on Claude's edits. The pane shows one page at a time (a file, a directory
  listing, or the files Claude edited this session), draws code highlighted and Markdown formatted
  or as source, follows Claude's last edited file at the end of a turn, checks the page after shell
  commands, and sends a dragged or clicked selection to Claude with a bar command or the next prompt.
- On a terminal too narrow for a pane to be drawn, `/sidepad` says which width it needs instead of
  opening one nothing would show, and an edit opens none by itself. The widths are the engine's own
  floors: 110 columns for a pane asked for, 144 for one nobody asked for.
- A file larger than what Claude Code reads (4 MiB) is shown one window at a time: its lines are
  counted with `grep -c ''` and each window is read with `sed`, both through the engine's process
  call; where those commands are missing the pane says the file is too large. A binary file, a line
  longer than one drawing may hold, and a Markdown block past the same cap each show a note or a
  cut rather than breaking the pane.
- CI: a mod tests workflow that typechecks the plugin, runs its tests with the official kit, and
  validates the plugin and the marketplace. `bun run typecheck` covers the plugin too.
- Repository tooling: CI with a sensitive-data scan and a tests, types and lint job, Dependabot
  for actions and bun, issue and pull request templates, and documentation checks.
