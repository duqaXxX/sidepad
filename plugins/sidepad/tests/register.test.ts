import type { ConfigRow } from 'claude-code';
import { describe, expect, test, tier } from 'claude-code/testing';

import Theme from '../hooks/theme';
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
const FILES = { [FILE]: SAMPLE_TYPESCRIPT, [NOTES]: SAMPLE_MARKDOWN, [`${CWD}/.env.example`]: 'KEY=\n' };

const sidepad = (args = '', isFullscreen = true, columns = 160) => ({
  command: 'sidepad',
  args,
  origin: { kind: 'composer' as const },
  presentation: { isFullscreen, columns },
});

/** The end of the session, as `/clear` or a resume that took its place ends it. */
const sessionEnd = (reason: 'clear' | 'resume') => ({ reason, sessionId: 'session-1', resume: { id: 'session-1' } });

describe('register', () => {
  test('/sidepad opens on the session directory listing, closes, and reopens on the kept page', async ($, on) => {
    const world = worldOf(on, FILES);

    await $.session.start(SESSION);

    const shown = await $.command.run(sidepad());
    const listing = JSON.stringify(await $.ui.render(PANE));
    const hidden = await $.command.run(sidepad());

    expect(shown.text).toBe('sidepad pane shown');
    expect(listing).toContain('  src/');
    expect(listing, 'hidden entries listed').toContain('.env.example');
    expect(listing, 'no .. at the session directory').not.toContain('"key":"nav:up"');
    expect(hidden.text).toBe('sidepad pane hidden');
    expect(world.opened.map((pane) => pane.id)).toEqual(['sidepad']);
    expect(world.opened[0]?.focus, 'the person asked: the pane asks for the keyboard').toBe(true);
    expect(world.closed.map((pane) => pane.id)).toEqual(['sidepad']);
  });

  test('on a narrow terminal /sidepad says so and opens nothing', async ($, on) => {
    const world = worldOf(on, FILES);

    await $.session.start(SESSION);
    await $.ui.render(hintAt(100));

    expect((await $.command.run(sidepad('', true, 100))).text).toBe(
      'Resize your terminal to at least 110 columns to show the sidepad pane',
    );
    expect(world.opened).toEqual([]);

    await $.ui.render(hintAt(160));

    expect((await $.command.run(sidepad())).text).toBe('sidepad pane shown');
    expect(world.opened.map((pane) => pane.id)).toEqual(['sidepad']);
  });

  test('/sidepad draws a pane an edit opened undrawn, rather than closing it', async ($, on) => {
    const world = worldOf(on, FILES, {}, true);

    on('tool.call', () => landedWrite(FILE));
    await $.session.start(SESSION);
    await $.ui.render(hintAt(120));
    await $.tool.call(writeOf(FILE));
    await $.turn.complete(TURN_END);

    expect(
      world.opened.map((pane) => pane.id),
      "the width is the engine's to judge",
    ).toEqual(['sidepad']);
    expect((await $.command.run(sidepad('', true, 120))).text, 'drawn, not closed').toBe('sidepad pane shown');
    expect(world.opened.at(-1)?.focus).toBe(true);
    expect(world.closed).toEqual([]);
    expect(JSON.stringify(await $.ui.render(PANE)), 'on the page the edit opened').toContain('code-view.tsx');
    expect((await $.command.run(sidepad('', true, 120))).text).toBe('sidepad pane hidden');
    expect(world.closed.map((pane) => pane.id)).toEqual(['sidepad']);
  });

  test('/sidepad auto off, then an edit opens nothing; auto reads the switch', async ($, on) => {
    const world = worldOf(on, FILES);

    on('tool.call', () => landedWrite(FILE));
    await $.session.start(SESSION);

    expect((await $.command.run(sidepad('auto off'))).text).toBe("Opening on Claude's edits is off");
    await $.tool.call(writeOf(FILE));
    await $.turn.complete(TURN_END);

    expect(world.opened).toEqual([]);
    expect((await $.command.run(sidepad('auto'))).text).toBe("Opening on Claude's edits is off");
    expect((await $.command.run(sidepad('open now'))).text).toContain('Usage');
  });

  test("/sidepad theme sets and names the theme, and classic follows Claude Code's at a turn's end", async ($, on) => {
    worldOf(on, FILES, { theme: 'neon' });

    const claude = { theme: 'light' };
    const themeRow = (): ConfigRow => ({
      key: 'theme',
      label: 'Theme',
      kind: 'choice',
      value: claude.theme,
      options: ['auto', 'dark', 'light'],
      provider: { plugin: 'engine', tier: 'core' },
      isLocked: false,
    });
    const band = (palette: Theme.Palette) => `"backgroundColor":"${palette.statusBackground}"`;

    on('config.list', () => ({ value: [themeRow()] }));
    await $.session.start(SESSION);

    expect((await $.command.run(sidepad('theme'))).text, 'a stored value that names no theme').toBe(
      "The pane's theme is auto",
    );
    expect((await $.command.run(sidepad('theme pink'))).text).toContain('Usage');
    expect((await $.command.run(sidepad('theme classic'))).text).toBe("The pane's theme is classic");

    await $.command.run(sidepad());
    const light = JSON.stringify(await $.ui.render(PANE));

    // The `/theme` picker raises no event: the pane reads the setting again when a turn ends.
    claude.theme = 'dark';
    await $.turn.complete(TURN_END);
    const dark = JSON.stringify(await $.ui.render(PANE));

    expect(light).toContain(band(Theme.PALETTES.classicLight));
    expect(light).not.toContain(band(Theme.PALETTES.classicDark));
    expect(dark).toContain(band(Theme.PALETTES.classicDark));
    expect(dark).not.toContain(band(Theme.PALETTES.classicLight));
    expect((await $.command.run(sidepad('theme'))).text, 'kept in the store').toBe("The pane's theme is classic");
  });

  test("a landed Write opens the pane on Claude's file when the turn ends, not before", async ($, on) => {
    const world = worldOf(on, FILES);

    on('tool.call', () => landedWrite(FILE));
    await $.session.start(SESSION);
    await $.ui.render(hintAt(160));
    await $.tool.call(writeOf(FILE));

    expect(world.opened, 'nothing opens while the turn runs').toEqual([]);

    await $.turn.complete(TURN_END);

    const tree = JSON.stringify(await $.ui.render(PANE));

    expect(world.opened.map((pane) => pane.id)).toEqual(['sidepad']);
    expect(world.opened[0]?.focus, 'unasked: the keys stay with the prompt').toBeUndefined();
    expect(tree).toContain('code-view.tsx');
    expect(tree).toContain('"children":["report.ts"]');
    expect(tree).toContain('Edited 1');
  });

  test('a refused Write opens nothing', async ($, on) => {
    const world = worldOf(on, FILES);

    on('tool.call', () => ({ deny: 'refused' }));
    await $.session.start(SESSION);
    await $.tool.call(writeOf(FILE)).catch(() => undefined);
    await $.turn.complete(TURN_END);

    expect(world.opened).toEqual([]);
  });

  test('a burst of Writes opens once, on the last file; a subagent turn end waits for its parent', async ($, on) => {
    const world = worldOf(on, FILES);

    on('tool.call', ($, e) => landedWrite(String((e as { file_path?: unknown }).file_path)));
    await $.session.start(SESSION);
    await $.ui.render(hintAt(160));
    await $.tool.call(writeOf(`${CWD}/a.ts`));
    await $.tool.call(writeOf(`${CWD}/b.ts`));
    await $.tool.call(writeOf(NOTES));
    await $.turn.complete({ ...TURN_END, agentId: 'agent-1' });

    expect(world.opened, 'a subagent ended, the main turn runs on').toEqual([]);

    await $.turn.complete(TURN_END);

    const tree = JSON.stringify(await $.ui.render(PANE));

    expect(world.opened).toHaveLength(1);
    expect(tree).toContain('Edited 3');
    expect(tree, 'a Markdown file draws the formatted page').toContain('markdown-page-view.tsx');
  });

  test('reading a listing, a new edit does not move the person and marks Edited', async ($, on) => {
    worldOf(on, FILES);
    on('tool.call', ($, e) => landedWrite(String((e as { file_path?: unknown }).file_path)));
    await $.session.start(SESSION);
    await $.ui.render(hintAt(160));
    await $.tool.call(writeOf(FILE));
    await $.turn.complete(TURN_END);
    await $.ui.render(PANE);
    await $.ui.press({ plugin: 'sidepad', key: 'nav:up' });
    await $.tool.call(writeOf(NOTES));
    await $.turn.complete(TURN_END);

    const tree = JSON.stringify(await $.ui.render(PANE));

    expect(tree).toContain('● report.ts');
    expect(tree).toContain('Edited 2 •');
  });

  test('a drawing on the main screen settles the layout: an edit before any command opens nothing', async ($, on) => {
    const world = worldOf(on, FILES);

    on('tool.call', () => landedWrite(FILE));
    await $.session.start(SESSION);
    await $.ui.render(hintAt(160, false));
    await $.tool.call(writeOf(FILE));
    await $.turn.complete(TURN_END);

    expect(world.opened).toEqual([]);
  });

  test("a remote surface's drawing settles nothing: the terminal's layout and width decide", async ($, on) => {
    const world = worldOf(on, FILES);

    on('tool.call', () => landedWrite(FILE));
    await $.session.start(SESSION);
    await $.ui.render({ ...hintAt(40, false), surface: 'mobile' });
    await $.ui.render(hintAt(160));
    await $.tool.call(writeOf(FILE));
    await $.turn.complete(TURN_END);

    expect(world.opened.map((pane) => pane.id)).toEqual(['sidepad']);
  });

  for (const reason of ['clear', 'resume'] as const) {
    test(`a session ended by ${reason} closes the pane and forgets the edited files`, async ($, on) => {
      const world = worldOf(on, FILES);

      on('tool.call', () => landedWrite(FILE));
      await $.session.start(SESSION);
      await $.ui.render(hintAt(160));
      await $.tool.call(writeOf(FILE));
      await $.turn.complete(TURN_END);
      await $.session.end(sessionEnd(reason));
      await $.command.run(sidepad());

      const tree = JSON.stringify(await $.ui.render(PANE));

      expect(world.closed.map((pane) => pane.id)).toEqual(['sidepad']);
      expect(tree).not.toContain('Edited');
    });
  }

  test('a /resume that ends no session, as a cancelled picker does, leaves the pane open', async ($, on) => {
    const world = worldOf(on, FILES);

    await $.session.start(SESSION);
    await $.command.run(sidepad());
    await $.command.run({ ...sidepad(), command: 'resume' });

    expect(world.closed).toEqual([]);
    expect((await $.command.run(sidepad())).text).toBe('sidepad pane hidden');
  });

  test('a reload with the pane up draws the session directory listing, and /sidepad closes it', async ($, on) => {
    const world = worldOf(on, FILES);

    await $.session.start(SESSION);
    await $.command.run(sidepad());
    // A reload runs `session.start` again, on a module whose state starts from nothing.
    await $.session.start(SESSION);

    const tree = JSON.stringify(await $.ui.render(PANE));

    expect(tree).toContain('  src/');
    expect((await $.command.run(sidepad())).text).toBe('sidepad pane hidden');
    expect(world.opened.map((pane) => pane.id)).toEqual(['sidepad']);
  });

  test('after a Bash command removes the file shown, the pane lists its directory with a note', async ($, on) => {
    const world = worldOf(on, { ...FILES, [`${CWD}/src/other.ts`]: 'x' });

    on('tool.call', { tool: 'Write' }, () => landedWrite(FILE));
    on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '', interrupted: false } }));
    await $.session.start(SESSION);
    await $.ui.render(hintAt(160));
    await $.tool.call(writeOf(FILE));
    await $.turn.complete(TURN_END);
    world.remove(FILE);
    await $.tool.call({ tool: 'Bash', command: 'rm src/report.ts' });

    const tree = JSON.stringify(await $.ui.render(PANE));

    expect(tree).toContain('src/report.ts is no longer on disk');
    expect(tree).toContain('other.ts');
  });
});
