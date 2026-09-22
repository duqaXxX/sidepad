import type { On } from 'claude-code';
import {
  CODE_WITH_EMPTY_LINE,
  COMMAND,
  PANE_ID,
  UNASKED_OPEN_DELAY_MS,
  UNASKED_PANE_ID,
  UNASKED_STATUS,
} from './cases';

/**
 * Registers `/engine-fixture code-no-gutter`, which opens a pane drawing `CODE_WITH_EMPTY_LINE` in a
 * `Code` with no `startLine`, and `/engine-fixture panes`, which answers `<id> isShown=<bool>
 * isPlaced=<bool>` for each pane `$.ui.panes()` reports. `/engine-fixture unasked` opens
 * `UNASKED_PANE_ID` on its own a moment after answering, and sets the status line to what that open
 * resolved, under the tag given after the word; `/engine-fixture asked` opens the same pane as the person's command. The scenarios read
 * all of it off the screen.
 *
 * @param on the engine's registrar
 */
export function register(on: On) {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Tooling for check:live: draw a gutterless Code, report the open panes, or open one unasked',
      argumentHint: 'code-no-gutter | panes | unasked | asked',
    });

    return next(e);
  });

  on('command.run', { command: COMMAND }, async ($, e) => {
    const [word, tag = ''] = e.args.trim().split(/\s+/);

    if (word === 'code-no-gutter') {
      await $.ui.open({ id: PANE_ID, title: 'engine fixture' });

      return { text: 'engine fixture: pane open' };
    }

    if (word === 'unasked') {
      // Opened once the command has answered, so the engine counts the open as the plugin's own.
      void $.clock
        .sleep(UNASKED_OPEN_DELAY_MS)
        .then(() => $.ui.open({ id: UNASKED_PANE_ID, title: 'engine fixture unasked' }))
        .then((opened) => $.ui.status(`${UNASKED_STATUS(tag)}${opened.isPlaced}`));

      return { text: 'engine fixture: unasked open scheduled' };
    }

    if (word === 'asked') {
      await $.ui.open({ id: UNASKED_PANE_ID, title: 'engine fixture unasked' });

      return { text: 'engine fixture: asked open' };
    }

    if (word === 'panes') {
      const panes = await $.ui.panes();
      const listed = panes.map((pane) => `${pane.id} isShown=${pane.isShown} isPlaced=${pane.isPlaced}`);

      return { text: `engine fixture: ${listed.join(', ') || 'no pane'}` };
    }

    return { text: 'engine fixture: code-no-gutter | panes | unasked | asked' };
  });

  on('ui.render', { component: 'Pane' }, ($, e, next) => {
    if ((e.requestId !== PANE_ID && e.requestId !== UNASKED_PANE_ID) || e.surface !== 'terminal') {
      return next(e);
    }

    const { Code } = $.ui.resolve(e);

    return <Code source={CODE_WITH_EMPTY_LINE} />;
  });
}
