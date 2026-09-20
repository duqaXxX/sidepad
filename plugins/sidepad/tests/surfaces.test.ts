import type { On } from 'claude-code';
import type { Engine } from 'claude-code/testing';
import { describe, expect, test, tier } from 'claude-code/testing';

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

/** The formatted page's only Client: the hooks compose every row, so one Client draws them all. */
const PAGE = 'page:0';

/** A pane of ten body rows: the sample's formatted page is taller, so it has to scroll. */
const SHORT_PANE = { ...PANE, props: { ...PANE.props, scroll: { offset: 0, bodyRows: 10 } } };

/**
 * The pane Claude's Write opened at the end of the turn, mounted in the terminal as the engine
 * draws it: its Clients running, a gesture reaching the hooks through their own `surface.post`.
 */
async function mountedOn($: Engine, on: On, path: string, pane = PANE) {
  worldOf(on, FILES);
  on('tool.call', () => landedWrite(path));
  await $.session.start(SESSION);
  await $.ui.render(hintAt(160));
  await $.tool.call(writeOf(path));
  await $.turn.complete(TURN_END);

  return $.ui.mount({ plugin: 'sidepad', ...pane });
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

    expect(
      await ui.find({ type: 'Text', text: /^lines \d+-\d+$/ }),
      'no bar once the selection is cleared',
    ).toBeUndefined();
  });

  test('a formatted Markdown page is one Client, whatever its blocks', async ($, on) => {
    const ui = await mountedOn($, on, NOTES);

    expect((await ui.findAll({ type: 'Client' })).map((element) => element.key)).toEqual([PAGE]);
  });

  test("a click on a formatted Markdown table selects the table's source lines, a second clears it", async ($, on) => {
    const ui = await mountedOn($, on, NOTES);
    const click = async (y: number) => {
      await ui.pointer({ type: 'down', x: 2, y, button: 'left', in: PAGE });
      await ui.pointer({ type: 'up', x: 2, y, button: 'left', in: PAGE });
    };

    // The table is lines 6 to 8 of the source, drawn on rows 4 to 8; row 7 is its body row.
    await click(7);

    expect(await ui.find({ type: 'Text', text: 'lines 6-8' })).toBeDefined();

    await click(7);

    expect(
      await ui.find({ type: 'Text', text: /^lines \d+-\d+$/ }),
      'no bar once the selection is cleared',
    ).toBeUndefined();
  });

  test('a drag across two formatted blocks selects the source lines of both', async ($, on) => {
    const ui = await mountedOn($, on, NOTES);

    // From the heading on row 0 down into the table, which ends on source line 8.
    await ui.pointer({ type: 'down', x: 2, y: 0, button: 'left', in: PAGE });
    await ui.pointer({ type: 'move', x: 2, y: 4, button: 'left', in: PAGE });
    await ui.pointer({ type: 'move', x: 2, y: 7, button: 'left', in: PAGE });
    await ui.pointer({ type: 'up', x: 2, y: 7, button: 'left', in: PAGE });

    expect(await ui.find({ type: 'Text', text: 'lines 1-8' })).toBeDefined();
  });

  test('a formatted page scrolls by rows, not by blocks', async ($, on) => {
    const ui = await mountedOn($, on, NOTES, SHORT_PANE);
    const firstRow = async () => (await ui.findAll({ type: 'Text', in: PAGE }))[0]?.text;

    // The edit landed on line 3, so the page opens on the paragraph, row 2 of the page. Three rows
    // down is row 5, the table's header: a scroll of three blocks would have left the table behind.
    expect(await firstRow()).toBe('A paragraph on two lines.');

    await ui.post({ kind: 'scroll', by: 3 });

    expect(await firstRow()).toBe('│ a │ b │');
  });
});
