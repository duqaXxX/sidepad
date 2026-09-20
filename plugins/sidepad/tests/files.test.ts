import { describe, expect, test, tier } from 'claude-code/testing';

import Files from '../hooks/files';
import Limits from '../hooks/limits';
import Names from '../hooks/names';
import { CWD, SAMPLE_TYPESCRIPT } from './fixtures';

tier('user');

describe('files', () => {
  const path = `${CWD}/src/report.ts`;
  const stat = { kind: 'file' as const, size: SAMPLE_TYPESCRIPT.length, mtimeMs: 5, isLink: false };

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
    expect(Files.pageChangeOf({ size: 3, mtimeMs: 5 }, { kind: 'dir', size: 0, mtimeMs: 5, isLink: false })).toBe(
      'gone',
    );
    expect(Files.pageChangeOf({ size: 3, mtimeMs: 5 }, { kind: 'file', size: 3, mtimeMs: 6, isLink: false })).toBe(
      'changed',
    );
    expect(Files.pageChangeOf({ size: 3, mtimeMs: 5 }, { kind: 'file', size: 3, mtimeMs: 5, isLink: false })).toBe(
      'same',
    );
  });

  test('a PNG is a page of its own, and every other image format is a note saying so', () => {
    const stat = { kind: 'file' as const, size: 32, mtimeMs: 1, isLink: false };

    expect(Files.fileKindOf(`${CWD}/docs/logo.png`)).toBe('image');
    expect(Files.fileKindOf(`${CWD}/docs/LOGO.PNG`)).toBe('image');
    expect(Files.fileKindOf(`${CWD}/docs/notes.md`)).toBe('markdown');
    expect(Files.fileKindOf(`${CWD}/docs/icon.svg`), 'an SVG is XML, and reads as code').toBe('code');
    expect(Files.loadedFileOf(`${CWD}/docs/photo.jpg`, stat, 'whatever').note).toBe(Names.IMAGE_FORMAT_NOTE);
  });

  test('a PNG the pane could size draws, one it could not shows a note in its place', () => {
    const path = `${CWD}/docs/logo.png`;
    const stat = { kind: 'file' as const, size: 32, mtimeMs: 1, isLink: false };

    expect(Files.imageFileOf(path, stat, { width: 320, height: 40 })).toMatchObject({
      kind: 'image',
      note: null,
      lines: [],
      total: 0,
      image: { path, width: 320, height: 40, generation: stat.mtimeMs },
    });
    expect(Files.imageFileOf(path, stat, null).note).toBe(Names.BINARY_NOTE);
    expect(Files.imageFileOf(path, null, { width: 1, height: 1 }).note).toBe(Names.READ_FAILED_NOTE);
    expect(
      Files.imageFileOf(path, { ...stat, size: Limits.READ_MAX_BYTES + 1 }, { width: 1, height: 1 }).note,
    ).toContain('too large');
  });
});
