#!/usr/bin/env bash
#
# Sensitive-data scan for the sidepad repo.
#
# Reads a unified diff on stdin and fails if any ADDED line looks like private data. The repo is
# public: a leak committed once stays in the history forever, so this runs in CI on every push and
# pull request, where a fork inherits it; a local git hook cannot, since `.git/` is untracked.
#
#   git diff <base>..<head> | .github/scripts/scan-sensitive-diff.sh
#
# Exit 0 = clean, 1 = something matched. High-confidence patterns only: a gate that cries wolf is
# a gate people bypass.
#
# The patterns below are written so the script cannot match ITSELF: `/[U]sers` matches the real
# path but not this line. Do not "simplify" those brackets away.

set -euo pipefail

added="$(grep '^+' | grep -v '^+++' || true)"
[ -z "$added" ] && exit 0

findings=""
flag() { findings="${findings}  - $1"$'\n'; }

# Every allowlist below filters MATCHES, not lines: `grep -o` puts each match on a line of its own,
# so one allowed path on a line no longer carries a real one past the gate.

# Real home paths leak the machine's user. /home/dev is the neutral placeholder the docs use.
echo "$added" | grep -oE '/[U]sers/[a-zA-Z][a-zA-Z0-9._-]*|/[h]ome/[a-zA-Z][a-zA-Z0-9._-]*' \
  | grep -vxE '/[h]ome/dev' >/dev/null 2>&1 \
  && flag 'real home path (/Users/... or /home/...): use a neutral placeholder'

# Personal email addresses. Asset filenames are excluded: '@' is idiomatic in them, and
# 'icons/128x128@2x.png' matches the address shape exactly.
echo "$added" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' \
  | grep -vE 'users\.noreply\.github\.com|@anthropic\.com|example\.(com|org)|@[a-zA-Z0-9.-]*\.(png|jpe?g|gif|svg|webp|ico|icns|woff2?|ttf|css|js)$' >/dev/null 2>&1 \
  && flag 'email address: remove or use a noreply/example address'

# Secret markers. The provider prefixes are listed by hand, since the generic 'long random string'
# shape matches a hash, a lockfile integrity field and a UUID far more often than a key:
#   sk-ant-      Anthropic API key (its dashes keep it out of the plain sk- shape)
#   gh[pousr]_   GitHub personal, OAuth, user, server and refresh tokens
#   github_pat_  GitHub fine-grained personal access token
#   AKIA         AWS access key id
echo "$added" | grep -E 'BEG[I]N (RSA|OPENSSH|EC|PGP) PRIVATE KEY|sk-[a-zA-Z0-9]{20,}|s[k]-ant-[a-zA-Z0-9_-]{16,}|gh[pousr]_[a-zA-Z0-9]{20,}|githu[b]_pat_[a-zA-Z0-9_]{20,}|AKI[A][0-9A-Z]{16}' >/dev/null 2>&1 \
  && flag 'possible secret / private key / token'

# References to the private issue tracker: keys, URLs, workspace slugs, and `EPIC N`, which is the
# shape that got through when the row named only the issue keys.
echo "$added" | grep -E 'PLU-[0-9]+|SE[E]-[0-9]+|linear[.]app|\b[E]PIC[ -][0-9]+\b' >/dev/null 2>&1 \
  && flag 'issue-tracker reference: describe the change, not the ticket'

if [ -n "$findings" ]; then
  {
    echo ""
    echo "Sensitive-data scan BLOCKED these changes:"
    printf '%s' "$findings"
    echo ""
    echo "  Fix the files. If you are certain it is a false positive, say so in the pull request."
    echo ""
  } >&2
  exit 1
fi

echo "Sensitive-data scan: clean."
