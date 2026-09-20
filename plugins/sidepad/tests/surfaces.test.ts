import type { On } from 'claude-code';
import type { Engine } from 'claude-code/testing';
import { describe, expect, test, tier } from 'claude-code/testing';

import Names from '../hooks/names';
import {
  CWD,
  hintAt,
  landedWrite,
  PANE,
  pngFileOf,
  SAMPLE_MARKDOWN,
  SAMPLE_PAGE_WITH_IMAGE,
  SAMPLE_TYPESCRIPT,
  SESSION,
  TURN_END,
  worldOf,
  writeOf,
} from './fixtures';

tier('user');

const FILE = `${CWD}/src/report.ts`;
const NOTES = `${CWD}/docs/notes.md`;
const INLINE = `${CWD}/docs/inline.md`;
const SHOT = `${CWD}/docs/shot.md`;
const LOGO = `${CWD}/docs/logo.png`;
const DIFF = `${CWD}/change.diff`;
const DATA = `${CWD}/data.csv`;

/** A unified diff of one hunk long enough that a window can sit inside it, past its `@@` header. */
const SAMPLE_DIFF = [
  '--- a/src/report.ts',
  '+++ b/src/report.ts',
  '@@ -1,40 +1,41 @@',
  ...Array.from({ length: 56 }, (_, at) => (at % 8 === 3 ? `+added ${at}` : ` kept ${at}`)),
].join('\n');

/** A delimited file of three records: a header and two rows. */
const SAMPLE_CSV = 'name,count\nalice,1\nbob,2\n';
const FILES = {
  [FILE]: SAMPLE_TYPESCRIPT,
  [NOTES]: SAMPLE_MARKDOWN,
  [INLINE]: ['# Inline', '', 'A line naming `readFile` in prose.', ''].join('\n'),
  [SHOT]: SAMPLE_PAGE_WITH_IMAGE,
  [LOGO]: pngFileOf(320, 40),
  [DIFF]: SAMPLE_DIFF,
  [DATA]: SAMPLE_CSV,
};

/** A formatted page with no picture is one Client: the hooks compose every row of it. */
const PAGE = 'page:0';

/** The run under the picture of SAMPLE_PAGE_WITH_IMAGE: the page's second, and its own Client. */
const BELOW = 'page:1';

/** A pane of ten body rows: the sample's formatted page is taller, so it has to scroll. */
const SHORT_PANE = { ...PANE, props: { ...PANE.props, scroll: { offset: 0, bodyRows: 10 } } };

/**
 * The pane Claude's Write opened at the end of the turn, mounted in the terminal as the engine
 * draws it: its Clients running, a gesture reaching the hooks through their own `surface.post`.
 */
async function mountedOn($: Engine, on: On, path: string, pane = PANE, line = 3) {
  worldOf(on, FILES);
  on('tool.call', () => landedWrite(path, line));
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

  test('inline code is drawn in a colour of its own, the prose around it in none', async ($, on) => {
    const ui = await mountedOn($, on, INLINE);
    const colourOf = async (text: string) => (await ui.find({ type: 'Text', text, in: PAGE }))?.props.color;

    expect(await colourOf('readFile')).toBe(Names.INLINE_CODE);
    expect(await colourOf('A line naming '), "the prose keeps the terminal's own colour").toBeUndefined();
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

  test('a page naming a picture draws it between two Clients, its alt in its place', async ($, on) => {
    const ui = await mountedOn($, on, SHOT);
    const picture = await ui.find({ type: 'Image' });

    expect((await ui.findAll({ type: 'Client' })).map((element) => element.key)).toEqual([PAGE, BELOW]);
    expect(picture?.props).toMatchObject({ source: { file: LOGO, format: 'png' }, alt: 'the logo', columns: 79 });
  });

  test('a click under a picture selects the block it lands on, and one above it the block above', async ($, on) => {
    const ui = await mountedOn($, on, SHOT);
    const click = async (y: number, at: string) => {
      await ui.pointer({ type: 'down', x: 2, y, button: 'left', in: at });
      await ui.pointer({ type: 'up', x: 2, y, button: 'left', in: at });
    };

    // The second run starts on the page's row 9; its row 1 is the paragraph on source line 7.
    await click(1, BELOW);

    expect(await ui.find({ type: 'Text', text: 'lines 7-7' })).toBeDefined();

    // The run above the picture drew first: a click in it must reach its own rows, not the last
    // run's, which is what one box of props for the module would have given it.
    await click(0, PAGE);

    expect(await ui.find({ type: 'Text', text: 'lines 1-1' })).toBeDefined();
  });

  test('a target that leads to no picture keeps its alt and its target as text', async ($, on) => {
    const ui = await mountedOn($, on, SHOT);

    expect(await ui.find({ type: 'Text', text: '(./gone.png)', in: BELOW })).toBeDefined();
  });

  test('the run under a picture keeps its own Client once the picture scrolls out of the window', async ($, on) => {
    const ui = await mountedOn($, on, SHOT, SHORT_PANE);

    await ui.post({ kind: 'scroll', by: 9 });

    // The window ends on the page's last row: the run before the picture is gone, and the run under
    // it keeps its key, so the drag that Client held is not handed the rows of the run above.
    expect((await ui.findAll({ type: 'Client' })).map((element) => element.key)).toEqual([BELOW]);
    expect(
      (await ui.find({ type: 'Image' }))?.props,
      'the picture the window cuts is drawn in the rows it shows',
    ).toMatchObject({ rows: 3 });
  });

  test('a drag from above a picture to below it selects the blocks on both sides of it', async ($, on) => {
    const ui = await mountedOn($, on, SHOT);

    // The pointer stays with the Client it went down in, so `y` runs past that run's own rows: row
    // 10 of the page is the paragraph on source line 7, under the picture drawn on rows 4 to 8.
    await ui.pointer({ type: 'down', x: 2, y: 0, button: 'left', in: PAGE });
    await ui.pointer({ type: 'move', x: 2, y: 6, button: 'left', in: PAGE });
    await ui.pointer({ type: 'move', x: 2, y: 10, button: 'left', in: PAGE });
    await ui.pointer({ type: 'up', x: 2, y: 10, button: 'left', in: PAGE });

    expect(await ui.find({ type: 'Text', text: 'lines 1-7' })).toBeDefined();
  });

  test('a diff draws through Code with the diff grammar, from a window holding no hunk header', async ($, on) => {
    // Line 30 of the file sits inside the hunk: the window opens a few lines above it, so no `@@`
    // header is in what Code is handed. Under `format: 'diff'` the engine refuses such a source and
    // unmounts the Client that drew it, which is why the page asks for the grammar instead.
    const ui = await mountedOn($, on, DIFF, PANE, 30);
    const code = await ui.find({ type: 'Code', in: 'code' });

    expect(code?.props.language).toBe('diff');
    expect(String(code?.props.source), 'the window starts inside the hunk').not.toContain('@@');
    expect(String(code?.props.source).split('\n')[0]).toBe(' kept 24');
  });

  test('a click on a table row selects the source line of its record', async ($, on) => {
    const ui = await mountedOn($, on, DATA, PANE, 1);
    const click = async (y: number) => {
      await ui.pointer({ type: 'down', x: 2, y, button: 'left', in: PAGE });
      await ui.pointer({ type: 'up', x: 2, y, button: 'left', in: PAGE });
    };

    // The rows drawn: the top rule, the header, the rule under it, then one row a record.
    await click(3);

    expect(await ui.find({ type: 'Text', text: 'lines 2-2' }), 'the first record, on line 2').toBeDefined();

    await click(4);

    expect(await ui.find({ type: 'Text', text: 'lines 3-3' }), 'the second, on line 3').toBeDefined();
  });
});
