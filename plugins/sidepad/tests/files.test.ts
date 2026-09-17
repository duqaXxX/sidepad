import { describe, expect, test, tier } from 'claude-code/testing';

import Files from '../hooks/files';
import Limits from '../hooks/limits';
import Names from '../hooks/names';
import { CWD, SAMPLE_TYPESCRIPT } from './fixtures';

tier('user');

describe('files', () => {
  const path = `${CWD}/src/report.ts`;
  const stat = { kind: 'file' as const, size: SAMPLE_TYPESCRIPT.length, mtimeMs: 5 };

  test('a file splits into its lines unaltered, blank ones kept, one trailing newline opening none', () => {
    const loaded = Files.loadedFileOf(path, stat, SAMPLE_TYPESCRIPT);

    expect(loaded.lines).toEqual(SAMPLE_TYPESCRIPT.split('\n').slice(0, -1));
    expect(loaded.lines.at(-1), 'the blank last line stays').toBe('');
    expect(Files.loadedFileOf(path, stat, 'a\n\n').lines).toEqual(['a', '']);
    expect(loaded.note).toBeNull();
    expect(loaded.stamp).toEqual({ size: stat.size, mtimeMs: 5 });
  });

  test('a missing, binary, oversized or unreadable file is a note', () => {
    const nul = String.fromCharCode(0);

    expect(Files.loadedFileOf(path, null, null).note).toBe(Names.READ_FAILED_NOTE);
    expect(Files.loadedFileOf(path, stat, `a${nul}b`).note).toBe(Names.BINARY_NOTE);
    expect(Files.loadedFileOf(path, { ...stat, size: Limits.READ_MAX_BYTES + 1 }, null).note).toContain('too large');
    expect(Files.loadedFileOf(path, stat, null).note).toBe(Names.READ_FAILED_NOTE);
    expect(Files.shouldRead({ ...stat, size: Limits.READ_MAX_BYTES + 1 })).toBe(false);
    expect(Files.shouldRead({ ...stat, kind: 'dir' })).toBe(false);
  });

  test('Markdown by its extension', () => {
    expect(Files.fileKindOf('/x/NOTES.MD')).toBe('markdown');
    expect(Files.fileKindOf('/x/notes.ts')).toBe('code');
  });

  test('a file on disk is gone, changed or the same as read', () => {
    expect(Files.pageChangeOf({ size: 3, mtimeMs: 5 }, null)).toBe('gone');
    expect(Files.pageChangeOf({ size: 3, mtimeMs: 5 }, { kind: 'dir', size: 0, mtimeMs: 5 })).toBe('gone');
    expect(Files.pageChangeOf({ size: 3, mtimeMs: 5 }, { kind: 'file', size: 3, mtimeMs: 6 })).toBe('changed');
    expect(Files.pageChangeOf({ size: 3, mtimeMs: 5 }, { kind: 'file', size: 3, mtimeMs: 5 })).toBe('same');
  });
});
