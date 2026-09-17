import { describe, expect, test, tier } from 'claude-code/testing';

import Edits from '../hooks/edits';

tier('user');

describe('edits', () => {
  test('the first changed line is past the hunk leading context', () => {
    const record = {
      structuredPatch: [
        { oldStart: 47, oldLines: 7, newStart: 47, newLines: 7, lines: [' a', ' b', ' c', '-d', '+D'] },
      ],
    };

    expect(Edits.changedLineOf(record)).toBe(50);
  });

  test('a create, or a record with no patch, starts at line 1', () => {
    expect(Edits.changedLineOf({ type: 'create', structuredPatch: [] })).toBe(1);
    expect(Edits.changedLineOf(undefined)).toBe(1);
  });

  test('the edited path of each editing tool', () => {
    const call = { tool_use_id: 'toolu_1' };

    expect(Edits.editedPathOf({ ...call, tool: 'Write', file_path: '/p/a.md', content: '' })).toBe('/p/a.md');
    expect(Edits.editedPathOf({ ...call, tool: 'NotebookEdit', notebook_path: '/p/n.ipynb', new_source: '' })).toBe(
      '/p/n.ipynb',
    );
    expect(Edits.editedPathOf({ ...call, tool: 'Bash', command: 'ls' })).toBeNull();
  });

  test('a refused or failed call has not landed', () => {
    expect(Edits.hasLanded({ result: 'done' })).toBe(true);
    expect(Edits.hasLanded({ deny: 'no' })).toBe(false);
    expect(Edits.hasLanded({ result: 'failed', isError: true })).toBe(false);
  });
});
