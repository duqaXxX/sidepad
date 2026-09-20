/** A Write that landed on `line`, answered beneath the mod with the record core would give. */
export const landedWrite = (path: string, line = 3) => ({
  result: {
    type: 'update' as const,
    filePath: path,
    content: '',
    structuredPatch: [{ oldStart: line, oldLines: 1, newStart: line, newLines: 1, lines: [' a', '-b', '+c'] }],
    originalFile: '',
    userModified: false,
  },
});
