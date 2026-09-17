import type { CommandSpec } from 'claude-code';

/** What `session.start` hands `$.command.register`: `/sidepad` and its one subcommand. */
export const COMMAND_SPEC = {
  name: 'sidepad',
  description: "Open or close the sidepad pane; auto [on|off] reads or sets its opening on Claude's edits",
  argumentHint: 'auto [on|off]',
} as const satisfies CommandSpec;
