#!/usr/bin/env bash
#
# Opens the release watch's issue, or brings the open one up to date.
#
# The issue is the state: there is no counter to keep, so a missed run costs nothing and a run that
# happens twice writes the same thing. The body is rewritten every time; a comment is added only
# when release-report.ts says the release is worth one, and never twice for the same version.
#
#   GH_TOKEN=... REPO=owner/name LATEST=2.1.280 OUTCOME=pass bash .github/scripts/watch-claude-code-release.sh
#
# DRY_RUN=1 reads the repository and prints what it would write, touching nothing.
set -euo pipefail

REPO="${REPO:?REPO is required}"
LATEST="${LATEST:?LATEST is required}"
OUTCOME="${OUTCOME:-skipped}"
LABEL="claude-code release"

gh label create "$LABEL" --repo "$REPO" --color 5319e7 \
  --description "A Claude Code release sidepad has not been read against yet" >/dev/null 2>&1 || true

number="$(gh issue list --repo "$REPO" --label "$LABEL" --state open --limit 1 --json number --jq '.[0].number // empty')"
title="Claude Code $LATEST: read sidepad against it"

# A closed issue with this title means the release has been read: with no open issue to update,
# opening one would ask for the same reading again (#45, #61 and #70 all named 2.1.278).
if [ -z "$number" ]; then
  read_in="$(TITLE="$title" gh issue list --repo "$REPO" --label "$LABEL" --state closed --limit 100 \
    --json number,title --jq '[.[] | select(.title == env.TITLE)][0].number // empty')"
  if [ -n "$read_in" ]; then
    echo "$LATEST was read in #$read_in; nothing to open"
    exit 0
  fi
fi

# The version the open issue last commented about, so the same release is never announced twice.
last_commented=""
if [ -n "$number" ]; then
  last_commented="$(gh issue view "$number" --repo "$REPO" --json comments \
    --jq '[.comments[].body | capture("Claude Code (?<v>[0-9]+\\.[0-9]+\\.[0-9]+)").v] | last // empty')"
fi

report="$(LATEST="$LATEST" OUTCOME="$OUTCOME" LAST_COMMENTED="$last_commented" bun .github/scripts/release-report.ts)"
printf '%s' "$report" | jq -r .body > /tmp/release-body.md
comment="$(printf '%s' "$report" | jq -r '.comment // empty')"

if [ -n "${DRY_RUN:-}" ]; then
  echo "would ${number:+update issue #$number}${number:-open an issue} for $LATEST"
  echo "--- body"; cat /tmp/release-body.md
  echo "--- comment: ${comment:-none}"
  exit 0
fi

if [ -z "$number" ]; then
  number="$(gh issue create --repo "$REPO" --label "$LABEL" \
    --title "$title" --body-file /tmp/release-body.md \
    | grep -oE '[0-9]+$')"
  echo "opened issue #$number for $LATEST"
else
  gh issue edit "$number" --repo "$REPO" --title "$title" \
    --body-file /tmp/release-body.md >/dev/null
  echo "updated issue #$number for $LATEST"
fi

if [ -n "$comment" ]; then
  gh issue comment "$number" --repo "$REPO" --body "$comment"
  echo "commented: $comment"
fi
