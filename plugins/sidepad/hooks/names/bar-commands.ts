/**
 * The command bar's Buttons, left to right: each preset submits its prompt at once with the
 * selection attached; `ask` has no prompt and points the person to the prompt box.
 */
export const BAR_COMMANDS = [
  { id: 'explain', label: 'Explain', prompt: 'Explain the attached lines.' },
  { id: 'find-issues', label: 'Find issues', prompt: 'Find issues in the attached lines.' },
  { id: 'rewrite', label: 'Rewrite', prompt: 'Rewrite the attached lines to be clearer, and show the result.' },
  { id: 'ask', label: 'Ask…', prompt: null },
] as const;
