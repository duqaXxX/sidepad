# Changelog

## Unreleased

- A `.csv` or a `.tsv` opens as a table, its first record the header, and the top row switches it to
  `Source` and back the way it does a Markdown file. A click on a table row selects the source lines
  of that record, and a cell too long for its column wraps inside it. A `.diff` or a `.patch` is
  coloured by the engine's diff highlighter, which on Claude Code 2.1.278 marks the `---`, `+++` and
  `@@` lines and leaves added and removed lines the colour of ordinary text. A file named like a
  diff that holds no hunk header is drawn as plain text, and so is a delimited file that does not
  parse. Measured on the same version: the engine can read a whole diff into hunks under
  `format: 'diff'`, but it refuses a source with no `@@` header and drops the page that drew it,
  while the pane hands it one window of the file at a time, so a reader who scrolled into a hunk was
  left with a blank page (#57).

- A PNG opens as a picture instead of the `Binary file: not shown` note, and a formatted Markdown
  page draws one where it names one: a paragraph holding nothing but `![alt](./logo.png)` whose
  target sits next to the file shown. A picture is as wide as the page and as tall as its
  proportion allows, up to 24 rows. The terminal opens and decodes the file itself, so no pixel
  passes through the plugin, and a terminal that draws no pixels shows the file's name and its
  pixel size in its place. A picture is not selectable: a click on it does nothing, and a drag
  across it selects the blocks either side. Another image format says `Image not shown: only PNG is
  drawn`, since a pane may hand the terminal a whole PNG or raw pixels and nothing decodes a JPEG,
  a GIF or a WebP; an `.svg` is XML and still reads as code, and a target that leads to no readable
  PNG keeps the `alt (target)` text it had (#56).

- A formatted Markdown page scrolls by rows, the way a code page scrolls by lines: three rows a
  wheel tick, and Page Down moves the rows the page shows. It used to move a block a tick and three
  blocks a key, because each block was drawn in a region of its own that reported its height back
  every 200 ms, and until a block had reported one the pane guessed its height from its source
  lines. The pane now lays every block out itself and draws a run of rows in one region, so a row's
  place is known before it is drawn: a heading comes out bold without its `#`, a list hangs its
  wrapped rows under its marker, a quote carries a coloured marker, a fence keeps the engine's
  highlighting, and a click still selects the block under the row it lands on. A selected block is
  painted from edge to edge, except a fence, which the engine's highlighter paints over; it is
  marked in the cells that leaves, as a selection on a code page is. Inline code takes a colour of
  its own, now that the pane draws the prose rather than the engine's renderer (#54).

- A formatted table is drawn by the pane, at the page's width. Measured on Claude Code 2.1.278, the
  engine's renderer wraps a paragraph to its region but sizes a table by a width of its own, so a
  table wider than the pane came out with its rows wrapped and its rules broken. The columns share
  the page in proportion to their longest cell, a cell too long for its column wraps inside it, and
  the delimiter row's alignments are kept. The playground carries a table no pane fits, and
  `check:live` checks every row of it is one width inside the pane (#51).

- A formatted paragraph flows to the pane's width. It used to break where its source line broke, so
  a file wrapped at 100 columns read as wrapped at 100 columns in a pane of any width. A single line
  break inside a paragraph is a space, as CommonMark reads it, while two trailing spaces or a
  backslash keep the break, and a paragraph holding one keeps its lines. Paragraphs nested in a quote
  or a list item flow too, each keeping the marker its first line carries (#50).

- A Markdown file is cut into blocks by markdown-it 15.0.2, vendored under
  `plugins/sidepad/hooks/vendor/` with its MIT license, instead of the plugin's own regular
  expressions. A setext heading, an HTML block and a list item continued by an unindented line now
  end where CommonMark says they do, which is what a click selects on a formatted page and under
  `Source`. A hooks module may import only its own files and `claude-code`, so the library is a
  copy of its bundled build (#53).

- The pane has a frame: the top row loses its grey band and ends its path on the page's name in
  bold, a dim rule sits under it, and a status line on the body's last row names a Markdown file's
  mode and where the page is (`lines 4–43 of 407`, `8 entries`). The page gives up one row for it,
  and the command bar sits above it. `check:live` reads the status line and has a scenario checking
  it names the lines a code page draws as it scrolls (#52).

- The page keeps one blank column between the pane's divider and its text, on a listing, a code
  page and a formatted Markdown page alike. The top row and the command bar had that column
  already. Lines are cut, and a Markdown block wraps, one column earlier (#52).

- The plugin's tests drive the pane's `Client` surfaces with the test kit's `$.ui.mount`: a drag
  over code lines, a click that selects a code block and a second one that clears it, and a click
  on a formatted Markdown table each reach the plugin's hooks through the surface's own post, so CI
  checks them on every pull request. `check:live` keeps the same gestures for what only a terminal
  draws (#22).

- sidepad targets Claude Code 2.1.278, and CI runs the plugin's tests on it. The engine's
  declarations are the same as 2.1.277's, and every limit Claude Code sets was measured again on
  2.1.278 and still holds (#45). `plugins/types/claude-code.d.ts` keeps the built-in tool section
  Anthropic published with 2.1.277, since no 2.1.278 copy is published yet.

- A selection reaches the model with up to 100,000 characters, where the pane used to cut it at
  32,000. Measured on Claude Code 2.1.278, a context entry up to that size arrives whole, and one
  past it, or past 200,000 characters together with the prompt's other entries, arrives as a 2 KB
  head and a path; the pane cuts at a whole line below both (#21).

- `docs/limits.md` lists every limit, split by whether Claude Code or sidepad sets it. `bun run
  limits` writes it from the `// LIMIT:` comments, and `bun run test` fails while the two disagree
  or while a limit Claude Code sets names no version. `bun run probe` lists the limits measured on
  a version other than the one running.

- `/sidepad` opens the pane holding the keyboard (`focus`), so the arrows move Claude Code's focus
  ring over the listing at once and Enter opens a row. Escape or a typed character hands the
  keyboard back to the prompt. A pane that opens on Claude's edits leaves it there (#32).

- Page Down and Page Up move a page by the lines or rows it shows, where they moved by the pane's
  whole body and skipped two lines each time. Home and End move one page as well: Claude Code sends
  them with the size of the pane's drawing, which always fits the pane (#5).

- The playground holds `many/`, a directory taller than the pane, and `check:live` has scenarios
  that walk the listing with the arrows and page keys and page through a file with the keyboard
  (#32, #5).

- A pane left open through a plugin reload shows the session directory's listing, where it used to
  keep its frame around an empty body, and the next `/sidepad` closes it. The reloaded plugin asks
  Claude Code for the panes it holds (`$.ui.panes()`) (#16).

- The pane closes and forgets the session's edits and selection when the session ends by `/clear`
  or a resume (`session.end`), where it used to do so on the `/clear` or `/resume` command. A
  `/resume` whose picker is dismissed without choosing a session no longer closes the pane or drops
  its selection (#6).

- `check:live` has scenarios for a plugin reload with the pane open, `/clear`, a dismissed
  `/resume`, and Claude Code's `/diff` panel, which takes the dock over the pane until it is closed
  (#16, #6, #4). A scenario can prepare the playground before Claude Code starts in it: the `/diff`
  one makes it a git repository for its own run.

- A selected blank line at the bottom of the code window carries its `▌` and its background. Claude
  Code 2.1.277 draws no gutter number for a trailing blank line, so that row still shows none (#37).
  `check:live` has a scenario that selects down to such a line and fails when its marker is missing.

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
  on the machine, which a missing `.claude/types/` or a missing login is: a run that skipped a check
  no longer reads as a release that moved nothing. The release watch's issue points at it.

- `bun run check:live` exits 2 with `check:live needs a Claude Code you are logged in to` when
  `claude auth status` finds nobody logged in, where every scenario used to fail the same way and
  read as a regression. `bun run probe` counts that run as one that could not run, not as a failure
  (#24).

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

- `bun run check:live` drives the pane in a real terminal: Claude Code on a pseudo-terminal Bun
  opens, its screen read through `@xterm/headless`, with the plugin loaded from source, a person's
  pointer input injected, and what the pane draws checked. No multiplexer sits in between: the
  session sees `TERM=xterm-256color`. Its first scenarios read the engine's own drawing after a
  gesture sent as a terminal sends it: a drag over lines, a click that selects a block and a second
  click that clears it, and a click on a formatted Markdown table.
- `check:live` also checks the pane's close mark, the answer to `/sidepad` one column short of 110
  and the pane at 110, a wheel tick on code and on formatted Markdown, a file past the read cap read
  one window at a time, a drag held past the window's bottom edge, and typing right after a drag.
- `.github/scripts/feature-proofs.ts` names what proves each section of `docs/features.md`, and
  `bun run test` fails when a section has nothing. The only part a proof may leave to a person is
  one a model turn reaches, and a section with no `check:live` scenario must name that turn.

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
