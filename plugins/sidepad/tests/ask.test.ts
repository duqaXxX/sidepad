import { describe, expect, test, tier } from 'claude-code/testing';

import Ask from '../hooks/ask';
import Names from '../hooks/names';
import { CWD, SAMPLE_TYPESCRIPT } from './fixtures';

tier('user');

describe('ask', () => {
  const lines = SAMPLE_TYPESCRIPT.split('\n');

  test('a selection names its file and lines, then each line numbered as the file has it', () => {
    expect(Ask.askTextOf(`${CWD}/src/report.ts`, lines, { start: 6, end: 8 })).toBe(
      [
        `The user selected lines 6-8 of ${CWD}/src/report.ts in the sidepad pane and attached them to this prompt:`,
        '6:   );',
        '7: ',
        '8:   log(sum);',
      ].join('\n'),
    );
  });

  const line = 'x'.repeat(40);
  const text = ['lead', line, line, line].join('\n');

  test('a text that fits is whole; one that does not keeps whole lines and the cut note', () => {
    const room = Names.ASK_CUT_NOTE.length + 'lead\n'.length + line.length + 1;

    expect(Ask.fittedAskTextOf(text, 10_000)).toBe(text);
    expect(Ask.fittedAskTextOf(text, room)).toBe(`lead\n${line}\n${Names.ASK_CUT_NOTE}`);
  });

  test('no room past the lead drops it', () => {
    expect(Ask.fittedAskTextOf(text, Names.ASK_CUT_NOTE.length + 'lead\n'.length)).toBeUndefined();
  });
});
