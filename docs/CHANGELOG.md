# Changelog

## Unreleased

- A directory Claude Code refuses to list shows `Could not list this directory: ` and Claude Code's
  whole message, where the page used to show an empty listing and no word on why. A page's dim note
  now wraps over as many rows as it takes instead of being cut at the pane's edge, since the message
  names the path before the reason. The playground has a `locked/` directory to try it on, and
  `check:live` a scenario that opens it. Claude Code 2.1.277 refuses a network location on the host
  before any `fs.*` hook answers, and on macOS `/home` is an automounted network location: the
  plugin's tests no longer run in a directory under it (#31).

- `bun run probe` says what a Claude Code release changed for sidepad: the running version against
  the one the declarations were written by, the plugin's tests and validation, the live checks, and
  what is still checked by hand. Given the declarations `/plugin-types` writes, it lists what was
  added, removed or changed in them, down to a `$` noun's members, an event or an element's props.
  It exits 0 when everything ran and held, 1 when a check failed, and 2 when a check could not run
  on the machine, which a missing `.claude/types/` is: a run that skipped the comparison no longer
  reads as a release that moved nothing. The release watch's issue points at it.

- The mod tests job decides whether a change can be merged. It runs on every pull request rather
  than only on those touching the plugin, its test step fails instead of passing when the CLI has
  no `plugin test`, and the Claude Code version it installs is pinned to the one the declarations
  are written by.

- The pane learns the terminal's width and layout from Claude Code's first drawing on the terminal,
  which reports the layout from 2.1.276, and an edit opens the pane only once the terminal has said
  it docks one. On the main screen an edit made before any command no longer opens a pane that
  closes itself at once, and a drawing from a remote surface no longer sets the terminal's width.
- sidepad requires Claude Code 2.1.277 and builds against its declarations. Until mods are
  released it is verified against one version at a time and carries no code for an earlier one.

- `bun run check:live` drives the pane in a real terminal: Claude Code in tmux with the plugin loaded
  from source, a person's pointer input injected, and what the pane draws checked. Its first
  scenarios read the engine's own drawing after a gesture sent as a terminal sends it: a drag over
  lines, a click that selects a block and a second click that clears it, and a click on a formatted
  Markdown table.
- `.github/scripts/feature-proofs.ts` names what proves each section of `docs/features.md`, and
  `bun run test` fails when a section has nothing.

- A daily workflow reads the version npm serves for Claude Code, runs the plugin's tests against it,
  and keeps one issue up to date with the answer. The issue's body is rewritten on every run and a
  comment arrives only when the tests fail or the release is more than a patch past the declarations
  this repository ships, since Claude Code ships about a version a day.

- `bun run playground` writes a synthetic project to try the pane on. Its sizes come from the
  plugin's own limits rather than from constants of its own, and a test asserts that each generated
  file still crosses the limit it exists to cross.

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
