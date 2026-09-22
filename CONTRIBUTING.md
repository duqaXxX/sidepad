# Contributing to sidepad

Thanks for your interest in `sidepad`. The three things you are most likely to want are first:
how to report something, how to send a change, and what to expect from the people here.
Everything after them is setup and convention.

## Reporting a bug, or asking for a feature

Open an issue. The forms ask for what a report needs to be actionable: the sidepad version, the
Claude Code version, your operating system and your terminal.

**Redact before you attach anything.** sidepad shows the files of the project you run it in, so a
screenshot or a pasted pane can carry your file paths, your project names and your code. Nothing
in an issue is private. A **security** finding never goes in an issue: [`SECURITY.md`](SECURITY.md)
has the private route.

## Sending a change

1. Fork and branch from the default branch.
2. Make the change; keep it focused (no unrelated cleanup in the same commit).
3. Ensure `bun run test`, `bun run typecheck` and `bun run lint` pass.
4. Open a pull request describing **what** changed and **why**.

Three CI jobs then run on the pull request, and all three must be green before it can be merged.
`main` takes no direct pushes, from anyone, and cannot be force-pushed or deleted. The maintainer
goes through a pull request on the same terms.

- **Tests, types, lint:** the repository's own test suite, the type-checker, and `bun run lint`
  (Biome: a formatting violation blocks the change here, before review).
- **Mod tests:** the plugin's hooks and tests typechecked against the engine declarations, its test
  suite run with the official kit, and the plugin and marketplace manifests validated. It runs on
  every pull request, including one that touches no plugin file, because a required check that is
  skipped stays pending and blocks the merge. Run it yourself with
  `claude plugin test plugins/sidepad`, with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` set.
- **Sensitive-data scan:** the added lines are checked for real home paths, personal email
  addresses, secret markers and private tracker references. This repo is public and a leak
  committed once stays in the history forever, so this job blocks the change. The check is
  `.github/scripts/scan-sensitive-diff.sh`; run it yourself with
  `git diff main...HEAD | .github/scripts/scan-sensitive-diff.sh`.

## How we work together

Everyone taking part is covered by the [Contributor Covenant](CODE_OF_CONDUCT.md), and reporting
an unacceptable interaction uses the same private route as a vulnerability.

Two expectations beyond it, both about this project's shape:

- It is maintained by one person, outside working hours. There is no SLA. A pull request may sit;
  a question may take a week.
- **Say what you measured, not what you assume.** sidepad is built on an early-access API that
  changes between Claude Code releases, so "on Claude Code X, event Y carried Z" is one step from a
  fix, while "this is wrong" is not.

## Prerequisites

- [Bun](https://bun.sh), at the version named in `package.json` under `packageManager`.
- Claude Code, with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` set to load a mod.

`bun install` brings TypeScript 5.9.3, the version `package.json` pins exactly. The `mod-tests` CI
job installs the same one, as Anthropic's own mod workflow does, and `bun run test` fails while the
two differ, so `bun run typecheck` answers what CI will.

```
bun install
bun run test
```

A synthetic project to try the pane on, generated with sizes taken from the plugin's own limits, so
it keeps crossing them as they change:

```
bun run playground
```

It prints the directory it wrote and the command that opens Claude Code there. Use it for anything
that becomes public: the pane draws file contents and a file tree, so a screenshot of your own work
publishes it. For finding bugs, your own projects are better, and nothing stops you.

The plugin lives in `plugins/sidepad/`, and everything that installs with it is inside that folder.
Its own tests use Claude Code's test kit:

```
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test plugins/sidepad
claude plugin validate plugins/sidepad --strict
```

What only a terminal shows, the engine's own drawing after a person's input, is checked in one:

```
bun run check:live
```

It writes the playground, starts Claude Code at 200 by 50 cells with the plugin loaded from source,
on a pseudo-terminal Bun opens and read through the headless terminal emulator `@xterm/headless`,
and for each scenario injects a person's input and checks what the pane draws. Name scenarios to run
only those, as in `bun run check:live drag-selects-lines`. It needs a Claude Code you are logged in
to (logged out, it says so and exits 2), and CI does not run it. No scenario runs a model turn, so
it spends no tokens. It rewrites the playground where `bun run playground` puts it by default, and
answers Claude Code's folder trust question for that directory and no other.

When Claude Code updates, one command says what the new version changed for sidepad:

```
bun run probe
```

It prints the running version beside the one `plugins/types/claude-code.d.ts` was written by, runs
the plugin's tests, both `claude plugin validate --strict` and `check:live`, and ends with what
`.github/scripts/feature-proofs.ts` marks as checked by hand. For what moved in the engine's
declarations, first run `/plugin-types` in Claude Code started in the repository: it writes the
running version's declarations to `.claude/types/`, which git ignores, and the probe lists what was
added, removed or changed against the committed ones, by path, down to a `$` noun's members, an
event and an element's props, plus the paths whose JSDoc alone changed. Two files can be compared
directly with `bun .github/scripts/compare-declarations.ts <before.d.ts> <after.d.ts>`. The
comparison parses them with the compiler API of the pinned TypeScript.

The probe exits 0 when everything ran and held, 1 when a check failed, and 2 when a check could not
run on this machine: no claude CLI, nobody logged in for the live checks, or no declarations in
`.claude/types/` to compare.
Its last section repeats what was skipped: a run that never compared the declarations otherwise
reads as a release that moved nothing.

## Coding conventions

- **Language:** English for all code, comments, docs, and commit messages.
- **The tracker is this repository's issues.** A commit message, a comment or a doc may reference
  one as `#12`. References to any other tracker do not belong in a versioned file: CI blocks them.
- **TypeScript, strict**, with `noUncheckedIndexedAccess`.
- Formatting is not a discussion. `bun run lint:fix` before you push, and CI checks it. The rules
  are in `biome.jsonc`, and every disabled rule carries the reason it is off.
- **A library travels with the plugin.** A hooks module imports only its own files and
  `claude-code`, so a dependency is a bundled build copied under `plugins/sidepad/hooks/vendor/`,
  with its license and its declarations beside it, pinned to one version and never edited.
  Formatting and lint skip that folder (`biome.jsonc`). Updating one means copying the new build,
  running the plugin's tests and `bun run check:live`, and saying in the changelog which version it
  is now.
- **Comment the why, not the what.** Explain a non-obvious decision or invariant; never narrate
  what the code plainly does.
- **JSDoc on exported functions:** one line stating the contract (what it returns, key invariants,
  side effects). Trivial exports whose signature is already the contract don't need one.
- **Known limitations** are `// LIMIT:` comments at the exact code site, each one readable on its
  own. One that Claude Code sets names the version it was measured on as `Claude Code 2.1.280`;
  a version written bare, or a number written with dots (`4.194.304`), fails the tests.
  [docs/limits.md](docs/limits.md) is written from them by `bun run limits` and never edited by
  hand; `bun run test` fails while the two disagree. A limit is not an issue: an issue is work, and
  a limit becomes one only once something can be done about it.

### How a source file is structured

This is the shape of `plugins/sidepad/hooks/`, the code that installs with the plugin.

- **One directory per subject** (`files/`, `listing/`, `pane-state/`), and in it **one module per
  exported symbol**, its file named after that symbol in kebab-case: `run-sidepad-command.ts`
  exports `runSidepadCommand`, `bar-commands.ts` exports `BAR_COMMANDS`. A subject that grows large
  splits the same way into directories of its own, as `pane-state/select/` does.
- **Exports are named.** The one exception is a module under `surfaces/`, which the engine loads by
  path to draw a region, and which exports its component as default.
- **A subject's `index.ts`** opens with `export * as default from '.'` and re-exports the modules
  other subjects may use. Another subject imports it through that index, as a namespace
  (`import Names from '../names'`, then `Names.PANE_ID`) or by name
  (`import type { Table } from '../tables'`). Inside a subject, modules import each other by file.
- **Never a file inside another subject.** `bun run lint` fails on an import such as
  `../files/is-unified-diff` (`noRestrictedImports` in `biome.jsonc`); the vendored library is the
  exception, since it is a file and not a subject.
- **No file-length limit.** No style guide sets one, and Biome's `noExcessiveLinesPerFile` is off,
  as it is by default. The rules above keep a hand-written module short. A table such as the live
  scenarios in `.github/scripts/live/scenarios.ts` stays one file, however long it gets.

## Tests

- A test earns its place only if a plausible bug could make it fail usefully. There is no coverage
  quota.
- Fix-on-touch: when you change a source file that has tests, update those tests in the same
  commit.
- The repository's tooling tests live in `.github/scripts/` and run with `bun run test`. A bare
  `bun test` skips dot-directories and runs none of them.
- The plugin's tests live in `plugins/sidepad/tests/`, one file named for what it covers under
  `hooks/`, and run with `claude plugin test plugins/sidepad`. The test kit mounts a `Client`
  surface with `$.ui.mount` and hands it a pointer, a key or a post, which reach the plugin's hooks
  as they do in a terminal. It cannot close a pane as a person does or scroll as a wheel does, and
  it never shows what the engine draws, so those are checked in a real terminal.
- `.github/scripts/feature-proofs.ts` names what proves each section of `docs/features.md`: a test
  file, a `check:live` scenario, or `modelTurn` naming a part only a model turn reaches, since no
  scenario runs one. A feature added or changed gets its `check:live` scenario in the same change.
  `bun run test` fails when a section has no entry, and when a section has neither a scenario nor a
  model turn.
- Fixtures and captures come from a synthetic project, with no real paths, project names or code.

## Documentation

- Permanent docs live in `docs/`. Keep them in sync with the code in the same change.
- Structural changes get an entry under `## Unreleased` in `docs/CHANGELOG.md`.

Four rules keep a reference usable:

- A reference states CURRENT behaviour. History belongs in the changelog and in git.
- Point at a symbol, never at a line number. `bun run test` fails on one in a doc.
- Do not publish a measurement a reader cannot reproduce. State the rule instead.
- One subject, one home.

`.github/scripts/docs.test.ts` checks what a machine can: every link and anchor resolves, every
repository path a doc names exists, no doc points at a line number, no doc under `docs/` is
unreachable, and no doc's prose uses an em dash. It runs over the whole doc set, not over your
diff.

### Every action is pinned to a commit SHA

A tag like `@v2` is a pointer its owner can move at any time, and a SHA is the content, so what runs
is what was reviewed. The tag is kept in a comment on the same line. A pinned action never updates
itself, and GitHub does not raise Dependabot alerts for actions pinned to a SHA, so
`.github/dependabot.yml` opens one grouped pull request a week that moves the SHAs and their
comments together.

## License

By contributing, you agree that your contributions are licensed under the project's
[MIT license](LICENSE).
