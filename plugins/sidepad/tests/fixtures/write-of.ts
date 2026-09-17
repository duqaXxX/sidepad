/** A Write call as the model makes it. */
export const writeOf = (path: string, content = 'line one\n\nline three\n') => ({
  tool: 'Write' as const,
  file_path: path,
  content,
});
