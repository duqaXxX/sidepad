<!-- Describe what changed and WHY. The why is the part a reviewer cannot reconstruct. -->

## What

## Why

## Checks

- [ ] `bun run test`, `bun run typecheck` and `bun run lint` pass, and so does `claude plugin test` on the mod if this touches it.
- [ ] Docs under `docs/`, `README.md` and `CONTRIBUTING.md` are updated in this same change, and a structural change has an entry under `## Unreleased` in `docs/CHANGELOG.md`.
- [ ] A feature this adds or changes is exercised by `bun run playground`, in this same change. The
      generated project is what the pane is tried on and what every published capture comes from.
- [ ] Nothing here comes from a real project. Fixtures, screenshots and GIFs show a synthetic project (fake names, fake paths) and no real home path, personal address, private URL or internal identifier appears anywhere in the diff.

<!-- The last box is the one that cannot be undone: this repo is public, and anything committed
     once stays in its history. CI scans the added lines for the obvious shapes, but it only
     catches what it can recognise; the reading is yours. -->
