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

Two CI jobs then run on the pull request, and both must be green before it can be merged. `main`
takes no direct pushes, from anyone, and cannot be force-pushed or deleted. The maintainer goes
through a pull request on the same terms.

- **Tests, types, lint:** the repository's own test suite, the type-checker, and `bun run lint`
  (Biome: a formatting violation blocks the change here, before review).
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

## Coding conventions

- **Language:** English for all code, comments, docs, and commit messages.
- **The tracker is this repository's issues.** A commit message, a comment or a doc may reference
  one as `#12`. References to any other tracker do not belong in a versioned file: CI blocks them.
- **TypeScript, strict**, with `noUncheckedIndexedAccess`.
- Formatting is not a discussion. `bun run lint:fix` before you push, and CI checks it. The rules
  are in `biome.jsonc`, and every disabled rule carries the reason it is off.
- **Comment the why, not the what.** Explain a non-obvious decision or invariant; never narrate
  what the code plainly does.
- **JSDoc on exported functions:** one line stating the contract (what it returns, key invariants,
  side effects). Trivial exports whose signature is already the contract don't need one.
- **Known limitations** are `// LIMIT:` comments at the exact code site.

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
