import { describe, expect, test, tier } from 'claude-code/testing';

import Handlers from '../hooks/handlers';
import Limits from '../hooks/limits';
import Names from '../hooks/names';
import PaneState from '../hooks/pane-state';
import { CWD, fakeHostOf, pngFileOf, SAMPLE_PAGE_WITH_IMAGE, SAMPLE_TYPESCRIPT, sidepadOf, stateOf } from './fixtures';

tier('user');

const FILE = `${CWD}/src/report.ts`;
const PROMPT = { text: 'why?', origin: { kind: 'composer' as const }, turnId: 't', wait: false, context: [] };

describe('handlers', () => {
  test('a prompt carries the selection as one context entry, then the selection clears', async () => {
    const { host } = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    const sidepad = sidepadOf(
      host,
      PaneState.withDraggedLines(stateOf({ path: FILE, text: SAMPLE_TYPESCRIPT }), { start: 8, end: 9 }, 9),
    );
    const seen: (readonly string[] | undefined)[] = [];

    await Handlers.attachSelection(sidepad, PROMPT, async (e) => {
      seen.push(e.context);

      return { text: e.text };
    });

    expect(seen[0]).toEqual([`${Names.askLeadOf(FILE, 8, 9)}\n8:   log(sum);\n9:   return sum;`]);
    expect(sidepad.state.selection).toBeNull();
  });

  test('a selection with no room left is dropped with a status line', async () => {
    const { host, calls } = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    const sidepad = sidepadOf(
      host,
      PaneState.withDraggedLines(stateOf({ path: FILE, text: SAMPLE_TYPESCRIPT }), { start: 8, end: 9 }, 9),
    );
    const full = { ...PROMPT, context: ['x'.repeat(Limits.PROMPT_CONTEXT_MAX_CHARS - 10)] };

    await Handlers.attachSelection(sidepad, full, async (e) => ({ text: e.text, context: e.context }));

    expect(calls.statuses).toEqual([Names.ASK_DROPPED_TEXT]);
    expect(sidepad.state.selection).toBeNull();
  });

  test('a dropped prompt keeps the selection', async () => {
    const { host } = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    const sidepad = sidepadOf(
      host,
      PaneState.withDraggedLines(stateOf({ path: FILE, text: SAMPLE_TYPESCRIPT }), { start: 8, end: 9 }, 9),
    );

    await Handlers.attachSelection(sidepad, PROMPT, async () => ({ drop: 'dropped' }));

    expect(sidepad.state.selection).not.toBeNull();
  });

  test('a bar preset submits its prompt; Ask… shows the hint and submits nothing', async () => {
    const { host } = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    const sidepad = sidepadOf(
      host,
      PaneState.withDraggedLines(stateOf({ path: FILE, text: SAMPLE_TYPESCRIPT }), { start: 8, end: 9 }, 9),
    );
    const submitted: string[] = [];
    const submit = async (text: string) => submitted.push(text);

    await Handlers.pressInPane(sidepad, Names.keyOf('command', 'explain'), submit);
    await Handlers.pressInPane(sidepad, Names.keyOf('command', 'ask'), submit);

    expect(submitted).toEqual(['Explain the attached lines.']);
    expect(sidepad.state.selection?.isAsking).toBe(true);
  });

  test('an edit that clears the selection in the file shown keeps the view at the turn end', async () => {
    const fake = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    const long = Array.from({ length: 80 }, (_, at) => `line ${at + 1}`).join('\n');

    fake.write(FILE, long);

    const sidepad = sidepadOf(
      fake.host,
      PaneState.withDraggedLines(stateOf({ path: FILE, text: long, rows: 12 }), { start: 2, end: 3 }, 3),
    );
    const record = {
      filePath: FILE,
      oldString: 'a',
      newString: 'b',
      originalFile: long,
      structuredPatch: [{ oldStart: 60, oldLines: 1, newStart: 60, newLines: 1, lines: ['-a', '+b'] }],
      userModified: false,
      replaceAll: false,
    };
    const edit = { tool_use_id: 'u', tool: 'Edit' as const, file_path: FILE, old_string: 'a', new_string: 'b' };

    await Handlers.recordToolCall(sidepad, edit, { result: record });
    await Handlers.completeTurn(sidepad, {
      answer: '',
      durationMs: 1,
      isAborted: false,
      turnId: 't',
      reason: 'answer',
    });

    expect(sidepad.state.selection).toBeNull();
    expect(sidepad.state.file?.top).toBe(0);
  });

  test('a file gone after a command gives way to its directory with a note', async () => {
    const other = `${CWD}/src/other.ts`;
    const fake = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT, [other]: 'x' });
    const sidepad = sidepadOf(fake.host, stateOf({ path: FILE, text: SAMPLE_TYPESCRIPT }));

    fake.remove(FILE);
    await Handlers.checkPage(sidepad);

    expect(sidepad.state.page).toMatchObject({
      kind: 'directory',
      path: `${CWD}/src`,
      note: Names.goneNoteOf('src/report.ts'),
    });
  });

  test('a listing the engine refuses notes its reason over the kept note, and the next listing clears it', async () => {
    const fake = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    let isRefused = true;
    const host = {
      ...fake.host,
      list: (path: string) =>
        isRefused ? Promise.reject(new Error('EACCES: permission denied\nat list')) : fake.host.list(path),
    };
    const gone = Names.goneNoteOf('src/old.ts');
    const sidepad = sidepadOf(
      host,
      PaneState.withDirectory(stateOf(), `${CWD}/src`, { entries: [], failure: null }, '', gone),
    );

    await Handlers.checkPage(sidepad);

    expect(sidepad.state.page).toMatchObject({ entries: [], note: gone });
    expect(PaneState.pageNoteRowsOf(sidepad.state).join('')).toBe(Names.listFailedNoteOf('EACCES: permission denied'));

    isRefused = false;
    await Handlers.checkPage(sidepad);

    expect(sidepad.state.page).toMatchObject({ entries: [{ name: 'report.ts' }], failure: null });
    expect(PaneState.pageNoteRowsOf(sidepad.state).join('')).toBe(gone);
  });

  test('a file changed by a command is read again in place', async () => {
    const fake = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    const loaded = await Handlers.loadFile(fake.host, FILE);
    const sidepad = sidepadOf(fake.host, PaneState.withFile(stateOf(), loaded, null));

    fake.write(FILE, 'changed\n');
    await Handlers.checkPage(sidepad);

    expect(sidepad.state.file?.loaded.lines).toEqual(['changed']);
    expect(sidepad.state.page.kind).toBe('file');
  });

  test('a directory gone falls back to its nearest existing ancestor', async () => {
    const fake = fakeHostOf({ [`${CWD}/keep.md`]: 'k' });
    const sidepad = sidepadOf(
      fake.host,
      PaneState.withDirectory(stateOf(), `${CWD}/gone/deeper`, { entries: [], failure: null }, '', null),
    );

    await Handlers.checkPage(sidepad);

    expect(sidepad.state.page).toMatchObject({ kind: 'directory', path: CWD, note: Names.goneNoteOf('gone/deeper') });
  });

  test('a file past the read cap opens windowed, its lines counted and its window read', async () => {
    const huge = `${CWD}/huge.log`;
    const lines = Array.from({ length: 5_000 }, (_, at) => `line ${at + 1} ${'x'.repeat(900)}`);
    const fake = fakeHostOf({ [huge]: `${lines.join('\n')}\n` });
    const loaded = await Handlers.loadFile(fake.host, huge);
    const sidepad = sidepadOf(fake.host, PaneState.withFile(stateOf({ rows: 12 }), loaded, 2_000));

    expect(loaded.source).toBe('windowed');
    expect(loaded.total).toBe(5_000);
    expect(loaded.lines, 'nothing read before the page said where it is').toEqual([]);

    await Handlers.ensureWindow(sidepad);

    expect(sidepad.state.file?.loaded.from).toBe(1_996);
    expect(sidepad.state.file?.loaded.lines[0]).toBe(lines[1_996]);
    expect(sidepad.state.file?.markdown, 'no formatted Markdown for a windowed file').toBeNull();

    const scrolled = { ...sidepad, state: PaneState.scrolledBy(sidepad.state, { by: 10, isWheel: false }) };

    await Handlers.ensureWindow(scrolled);

    expect(scrolled.state.file?.loaded.from).toBe(2_006);
  });

  test('a selection of a windowed file is read from the host for the prompt', async () => {
    const huge = `${CWD}/huge.log`;
    const lines = Array.from({ length: 5_000 }, (_, at) => `line ${at + 1} ${'x'.repeat(900)}`);
    const fake = fakeHostOf({ [huge]: `${lines.join('\n')}\n` });
    const loaded = await Handlers.loadFile(fake.host, huge);
    const opened = PaneState.withFile(stateOf({ rows: 12 }), loaded, null);
    const sidepad = sidepadOf(fake.host, PaneState.withDraggedLines(opened, { start: 4_001, end: 4_002 }, 4_002));
    const seen: (readonly string[] | undefined)[] = [];

    await Handlers.attachSelection(sidepad, PROMPT, async (e) => {
      seen.push(e.context);

      return { text: e.text };
    });

    expect(seen[0]?.[0]).toContain(`4001: ${lines[4_000]}`);
    expect(seen[0]?.[0]).toContain(`4002: ${lines[4_001]}`);
  });

  test('a file past the read cap with no window command shows the too-large note', async () => {
    const huge = `${CWD}/huge.log`;
    const fake = fakeHostOf({ [huge]: 'x'.repeat(5_000_000) });
    const bare = { ...fake.host, run: async () => ({ exitCode: 127, stdout: '', stderr: 'command not found' }) };
    const loaded = await Handlers.loadFile(bare, huge);

    expect(loaded.source).toBe('whole');
    expect(loaded.note).toContain('too large');
  });

  test('/sidepad closes the pane even when the engine refuses the close', async () => {
    // The state follows the intent: leaving `isOpen` set would make the next /sidepad close a pane
    // that is no longer there, instead of opening one.
    const fake = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    const refusing = {
      ...fake.host,
      closePane: async () => {
        throw new Error('no such pane');
      },
    };
    const sidepad = sidepadOf(refusing, stateOf({ path: FILE, text: SAMPLE_TYPESCRIPT }));

    expect(sidepad.state.isOpen).toBe(true);
    expect(await Handlers.runSidepadCommand(sidepad, '')).toEqual({ text: Names.PANE_HIDDEN_TEXT });
    expect(sidepad.state.isOpen).toBe(false);
  });

  test('.. and a path piece open directories, marking where the person came from', async () => {
    const fake = fakeHostOf({ [FILE]: SAMPLE_TYPESCRIPT });
    const sidepad = sidepadOf(fake.host, stateOf({ path: FILE, text: SAMPLE_TYPESCRIPT }));

    await Handlers.pressInPane(sidepad, Names.NAV_UP_KEY, async () => undefined);
    expect(sidepad.state.page).toMatchObject({ kind: 'directory', path: `${CWD}/src`, cameFrom: FILE });

    await Handlers.pressInPane(sidepad, Names.keyOf('crumb', 0), async () => undefined);
    expect(sidepad.state.page).toMatchObject({ kind: 'directory', path: CWD, cameFrom: `${CWD}/src` });

    await Handlers.pressInPane(sidepad, Names.NAV_UP_KEY, async () => undefined);
    expect(sidepad.state.page, 'no .. above the session directory').toMatchObject({ path: CWD });
  });

  test('a PNG opens as a picture read from its header, another image format as a note', async () => {
    const png = `${CWD}/docs/logo.png`;
    const jpg = `${CWD}/docs/photo.jpg`;
    const fake = fakeHostOf({ [png]: pngFileOf(320, 40), [jpg]: 'whatever a camera wrote' });

    expect(await Handlers.loadFile(fake.host, png)).toMatchObject({
      kind: 'image',
      note: null,
      image: { path: png, width: 320, height: 40 },
    });
    expect(await Handlers.loadFile(fake.host, jpg)).toMatchObject({ note: Names.IMAGE_FORMAT_NOTE, image: null });
  });

  test('a .png the header does not read as a PNG shows the binary note', async () => {
    const png = `${CWD}/docs/broken.png`;
    const fake = fakeHostOf({ [png]: 'nothing a decoder would take, and long enough to have a header' });

    expect(await Handlers.loadFile(fake.host, png)).toMatchObject({ note: Names.BINARY_NOTE, image: null });
  });

  test('a Markdown page sizes the pictures it names, and leaves the targets that lead nowhere', async () => {
    const page = `${CWD}/docs/shot.md`;
    const logo = `${CWD}/docs/logo.png`;
    const fake = fakeHostOf({ [page]: SAMPLE_PAGE_WITH_IMAGE, [logo]: pngFileOf(320, 40) });
    const loaded = await Handlers.loadFile(fake.host, page);

    expect(loaded.images).toEqual({ './logo.png': { path: logo, width: 320, height: 40, generation: 1 } });
  });
});
