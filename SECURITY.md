# Security policy

## Reporting a vulnerability

Use GitHub's private form: **[Report a vulnerability](../../security/advisories/new)**, also
reachable from the Security tab of this repository. It opens a draft advisory that only you and
the maintainer can read, and it is where a fix and a CVE would be coordinated from.

Please don't open a public issue or a pull request for it. An issue is readable by everyone the
moment it is filed, including for however long the fix takes. The advisory form is the only
private channel this project has, and there is no security mailing address.

Useful in a report: what an attacker gets, and the shortest way you got there. sidepad runs
inside Claude Code on a developer's own machine, so say who the attacker is: the author of a file
in the project being viewed, someone sending a pull request, or someone else.

## What you can expect

sidepad is a personal project maintained by one person outside working hours. There is no SLA and
no bounty. Realistically: an acknowledgement once I see the advisory, a fix when I understand it,
and credit in the published advisory unless you would rather not be named. If a report sits
untouched for a couple of weeks, a comment on the same advisory is welcome; it means I missed it.

Only the latest release is supported. A fix goes out as a new release, and there are no backports.

## In scope

No release exists yet. The surface sidepad is designed around:

- **File content reaching Claude without the user choosing it.** sidepad sends a passage to the
  Claude Code session only when the user selects it and submits a request. Anything that sends
  file content, or more than the selected range, without that action.
- **Content in a viewed file acting on the terminal or on Claude Code.** A file is displayed, never
  executed. Anything in a file's content (escape sequences, crafted Markdown) that runs a command,
  changes Claude Code's state, or makes the pane show something other than the file.
- **Reading outside what the user opened.** Anything that makes sidepad read or display a path the
  user did not open and Claude did not write.
- **The commands sidepad runs on the host.** To show a file larger than Claude Code reads, sidepad
  runs `grep -c ''` and `sed` through the engine's own process call, which takes an argument list
  and no shell. Anything that turns a file's name, or a path the user opened, into a command of its
  own.
- **The release.** Anything that lets code which is not in the tagged commit reach users through
  the marketplace.

## Not a vulnerability

- **Behaviour that changes with a Claude Code release.** Mods are early access and their API moves.
  A break after an upgrade is a bug, and [an issue](../../issues) is the right place for it.
- An attacker who is already the local user. They can read the project's files directly.
