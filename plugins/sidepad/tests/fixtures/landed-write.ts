/** A Write that landed, answered beneath the mod with the record core would give. */
export const landedWrite = (path: string) => ({
  result: {
    type: 'update' as const,
    filePath: path,
    content: '',
    structuredPatch: [{ oldStart: 3, oldLines: 1, newStart: 3, newLines: 1, lines: [' a', '-b', '+c'] }],
    originalFile: '',
    userModified: false,
  },
});
