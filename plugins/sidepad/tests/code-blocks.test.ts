import { describe, expect, test, tier } from 'claude-code/testing';

import CodeBlocks from '../hooks/code-blocks';
import { SAMPLE_TYPESCRIPT } from './fixtures';

tier('user');

describe('code-blocks', () => {
  const lines = SAMPLE_TYPESCRIPT.split('\n');

  test('a line that opens a bracket selects through its closer, blank lines inside included', () => {
    expect(CodeBlocks.codeBlockAt(lines, 3)).toEqual({ start: 3, end: 10 });
    expect(CodeBlocks.codeBlockAt(lines, 4)).toEqual({ start: 4, end: 6 });
  });

  test('another line selects its paragraph, never past a less indented line', () => {
    expect(CodeBlocks.codeBlockAt(lines, 9)).toEqual({ start: 8, end: 9 });
    expect(CodeBlocks.codeBlockAt(lines, 1)).toEqual({ start: 1, end: 1 });
  });

  test('a blank line selects itself', () => {
    expect(CodeBlocks.codeBlockAt(lines, 7)).toEqual({ start: 7, end: 7 });
  });

  test('a line followed by deeper indentation selects them, not their trailing blank lines', () => {
    const python = ['def area(r):', '    pi = 3.14', '', '    return pi * r * r', '', 'print(area(2))'];

    expect(CodeBlocks.codeBlockAt(python, 1)).toEqual({ start: 1, end: 4 });
  });

  test('brackets inside strings and after a line comment do not count', () => {
    expect(CodeBlocks.bracketBalanceOf('const s = "{(" // ) ]')).toBe(0);
    expect(CodeBlocks.bracketBalanceOf('if (a) { // {')).toBe(1);
  });
});
