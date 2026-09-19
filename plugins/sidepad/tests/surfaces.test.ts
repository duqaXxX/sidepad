import type { On } from 'claude-code';
import type { Engine } from 'claude-code/testing';
import { describe, expect, test, tier } from 'claude-code/testing';

import Limits from '../hooks/limits';
import {
  CWD,
  hintAt,
  landedWrite,
  PANE,
  SAMPLE_MARKDOWN,
  SAMPLE_TYPESCRIPT,
  SESSION,
  TURN_END,
  worldOf,
  writeOf,
} from './fixtures';

tier('user');

const FILE = `${CWD}/src/report.ts`;
const NOTES = `${CWD}/docs/notes.md`;
const FILES = { [FILE]: SAMPLE_TYPESCRIPT, [NOTES]: SAMPLE_MARKDOWN };

/** The rows each block of SAMPLE_MARKDOWN takes drawn formatted: heading, paragraph, table, list, fence. */
const BLOCK_ROWS = [1, 2, 5, 2, 4];

/**
 * The pane Claude's Write opened at the end of the turn, mounted in the terminal as the engine
 * draws it: its Clients running, a gesture reaching the hooks through their own `surface.post`.
 */
async function mountedOn($: Engine, on: On, path: string) {
  worldOf(on, FILES);
  on('tool.call', () => landedWrite(path));
  await $.session.start(SESSION);
  await $.ui.render(hintAt(160));
  await $.tool.call(writeOf(path));
  await $.turn.complete(TURN_END);

  return $.ui.mount({ plugin: 'sidepad', ...PANE });
}

describe('surfaces', () => {
  test('a drag over code rows selects exactly their lines, and the bar names them', async ($, on) => {
    const ui = await mountedOn($, on, FILE);

    // Rows 3 to 5 of the window, which starts at line 1: lines 4 to 6.
    await ui.pointer({ type: 'down', x: 4, y: 3, button: 'left', in: 'code' });
    await ui.pointer({ type: 'move', x: 4, y: 4, button: 'left', in: 'code' });
    await ui.pointer({ type: 'move', x: 4, y: 5, button: 'left', in: 'code' });
    await ui.pointer({ type: 'up', x: 4, y: 5, button: 'left', in: 'code' });

    expect(await ui.find({ type: 'Text', text: 'lines 4-6' })).toBeDefined();
  });

  test('a click on a code row selects its block, and a second click clears the selection', async ($, on) => {
    const ui = await mountedOn($, on, FILE);
    const click = async (y: number) => {
      await ui.pointer({ type: 'down', x: 4, y, button: 'left', in: 'code' });
      await ui.pointer({ type: 'up', x: 4, y, button: 'left', in: 'code' });
    };

    // Row 2 is line 3, the function's first line: the block runs to its closing brace, line 10.
    await click(2);

    expect(await ui.find({ type: 'Text', text: 'lines 3-10' })).toBeDefined();

    await click(2);

    expect(await ui.find({ type: 'Text', text: /^lines / }), 'no bar once the selection is cleared').toBeUndefined();
  });

  test("a click on a formatted Markdown table selects the table's source lines", async ($, on) => {
    const ui = await mountedOn($, on, NOTES);

    // Each block drawn reports its height once the terminal lays it out, which the kit does on `resize`.
    // The page starts where the edit landed, so the blocks drawn are read, not assumed.
    for (const { key } of await ui.findAll({ type: 'Client' })) {
      const rows = BLOCK_ROWS[Number(key?.slice('block:'.length))];

      if (key && rows) {
        await ui.resize({ columns: 80, rows, in: key });
      }
    }
    await ui.advance(Limits.BLOCK_ROWS_POLL_MS);

    // The table is block 2, lines 6 to 8 of the source; row 3 is its first body row.
    await ui.pointer({ type: 'down', x: 2, y: 3, button: 'left', in: 'block:2' });
    await ui.pointer({ type: 'up', x: 2, y: 3, button: 'left', in: 'block:2' });

    expect(await ui.find({ type: 'Text', text: 'lines 6-8' })).toBeDefined();
  });
});
