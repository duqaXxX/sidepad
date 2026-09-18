import { describe, expect, test, tier } from 'claude-code/testing';

import CodeBlocks from '../hooks/code-blocks';
import Files from '../hooks/files';
import Handlers from '../hooks/handlers';
import Limits from '../hooks/limits';
import { fakeHostOf } from './fixtures';

tier('user');

describe('line-window', () => {
  const path = '/home/dev/project/huge.log';

  test('the window command prints the lines asked for and quits right after them', () => {
    expect(Files.lineWindowArgvOf(path, 1_200, 1_240)).toEqual(['sed', '-n', '1200,1240p;1241q', path]);
    expect(Files.lineWindowArgvOf(path, 0, 0), 'a file starts at line 1').toEqual(['sed', '-n', '1,1p;2q', path]);
    expect(Files.lineCountArgvOf(path), 'lines, not newlines').toEqual(['grep', '-c', '', path]);
  });

  test('the count is read out of the output, with or without the path before it', () => {
    expect(Files.lineCountOf('1200000\n')).toBe(1_200_000);
    expect(Files.lineCountOf(' 1200000 /home/dev/project/huge.log\n')).toBe(1_200_000);
    expect(Files.lineCountOf('grep: no such file\n')).toBeNull();
  });

  test('a window of lines drops the empty piece the trailing newline leaves', () => {
    expect(Files.windowLinesOf('one\n\nthree\n')).toEqual(['one', '', 'three']);
    expect(Files.windowLinesOf('one')).toEqual(['one']);
  });

  test('a windowed file holds a window, and says when the page wants another', () => {
    const stat = { kind: 'file' as const, size: 9_000_000, mtimeMs: 2, isLink: false };
    const empty = Files.windowedFileOf(`${path}`, stat, 1_000);
    const held = Files.withWindow(empty, 100, ['a', 'b', 'c']);

    expect(empty.source).toBe('windowed');
    expect(empty.total).toBe(1_000);
    expect(Files.isWindowHeld(empty, 0, 3)).toBe(false);
    expect(Files.isWindowHeld(held, 100, 3)).toBe(true);
    expect(Files.isWindowHeld(held, 100, 4), 'a taller page wants more lines').toBe(false);
    expect(Files.isWindowHeld(held, 101, 3), 'another page start wants its own window').toBe(false);
    expect(Files.isWindowHeld(Files.withWindow(empty, 998, ['x', 'y']), 998, 10), 'the file ends there').toBe(true);
  });

  test('a file held on one long line opens with the line it has, not none', async () => {
    // `wc -l` counts newlines, so it returned 0 here and `isWindowHeld` was satisfied at once: the
    // pane drew an empty body with no note. A minified bundle is exactly this shape.
    const oneLine = 'x'.repeat(Limits.READ_MAX_BYTES + 1);
    const { host } = fakeHostOf({ [path]: oneLine });
    const loaded = await Handlers.loadFile(host, path);

    expect(loaded.source).toBe('windowed');
    expect(loaded.total).toBe(1);
    expect(Files.isWindowHeld(loaded, 0, 12), 'its one line still has to be read').toBe(false);
  });

  test('a file whose last line has no newline after it counts that line', async () => {
    const noEol = `${'filler\n'.repeat(700_000)}last line, no newline`;
    const { host } = fakeHostOf({ [path]: noEol });
    const loaded = await Handlers.loadFile(host, path);

    expect(loaded.total, 'the last line counts').toBe(700_001);
  });

  test('a click over a window names the file lines, not the window rows', () => {
    const window = ['export function report() {', '  return 1;', '}'];

    expect(CodeBlocks.codeBlockAt(window, 1_201, 1_200)).toEqual({ start: 1_201, end: 1_203 });
    expect(CodeBlocks.codeBlockAt(window, 1_202, 1_200)).toEqual({ start: 1_202, end: 1_202 });
  });
});
