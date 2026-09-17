import { describe, expect, test, tier } from 'claude-code/testing';

import Bar from '../hooks/bar';

tier('user');

describe('bar', () => {
  const range = { start: 30, end: 61 };

  test('a wide pane lays the label and the four commands on one row', () => {
    const layout = Bar.barLayoutOf(range, false, 89);

    expect(layout).toHaveLength(1);
    expect(layout[0]?.map((item) => (item.kind === 'button' ? item.label : item.text))).toEqual([
      'lines 30-61',
      'Explain',
      'Find issues',
      'Rewrite',
      'Ask…',
    ]);
    expect(Bar.barRowsOf(range, false, 89)).toBe(2);
  });

  test('a narrow pane wraps onto more rows, the blank row counted', () => {
    expect(Bar.barLayoutOf(range, false, 30).map((row) => row.length)).toEqual([2, 2, 1]);
    expect(Bar.barRowsOf(range, false, 30)).toBe(4);
  });

  test('after Ask… the hint replaces the Buttons; no selection covers no row', () => {
    const words = Bar.barLayoutOf(range, true, 200)[0]?.filter((item) => item.kind === 'hint');

    expect(words?.map((item) => (item.kind === 'hint' ? item.text : '')).join(' ')).toBe(
      'type your question in the prompt, then Enter',
    );
    expect(Bar.barRowsOf(null, false, 30)).toBe(0);
  });
});
