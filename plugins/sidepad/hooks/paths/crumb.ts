/** One piece of the path on the top row: a directory to press, or plain text. */
export type Crumb = { kind: 'link'; key: string; label: string } | { kind: 'text'; label: string };
