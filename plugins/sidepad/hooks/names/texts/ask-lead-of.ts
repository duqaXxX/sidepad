/**
 * The sentence an attached selection starts with, naming its file and lines for the model.
 *
 * @returns one line, no trailing newline
 */
export const askLeadOf = (path: string, start: number, end: number) =>
  `The user selected lines ${start}-${end} of ${path} in the sidepad pane and attached them to this prompt:`;
