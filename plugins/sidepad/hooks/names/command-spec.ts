import type { CommandSpec } from 'claude-code';

/** What `session.start` hands `$.command.register`: `/sidepad` and its two subcommands. */
export const COMMAND_SPEC = {
  name: 'sidepad',
  description:
    "Open or close the sidepad pane; auto [on|off] reads or sets its opening on Claude's edits; theme [auto|classic|contrast] reads or sets its colours",
  argumentHint: 'auto [on|off] | theme [auto|classic|contrast]',
} as const satisfies CommandSpec;
