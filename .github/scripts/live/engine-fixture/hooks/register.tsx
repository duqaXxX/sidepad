import type { On } from 'claude-code';
import { CODE_WITH_EMPTY_LINE, COMMAND, PANE_ID } from './cases';

/**
 * Registers `/engine-fixture code-no-gutter`, which opens a pane drawing `CODE_WITH_EMPTY_LINE` in a
 * `Code` with no `startLine`, and `/engine-fixture panes`, which answers `<id> isShown=<bool>` for
 * each pane `$.ui.panes()` reports. The limit scenarios read both off the screen.
 *
 * @param on the engine's registrar
 */
export function register(on: On) {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Tooling for check:live: draw a gutterless Code, or report the open panes',
      argumentHint: 'code-no-gutter | panes',
    });

    return next(e);
  });

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim();

    if (word === 'code-no-gutter') {
      await $.ui.open({ id: PANE_ID, title: 'engine fixture' });

      return { text: 'engine fixture: pane open' };
    }

    if (word === 'panes') {
      const panes = await $.ui.panes();

      return {
        text: `engine fixture: ${panes.map((pane) => `${pane.id} isShown=${pane.isShown}`).join(', ') || 'no pane'}`,
      };
    }

    return { text: 'engine fixture: code-no-gutter | panes' };
  });

  on('ui.render', { component: 'Pane' }, ($, e, next) => {
    if (e.requestId !== PANE_ID || e.surface !== 'terminal') {
      return next(e);
    }

    const { Code } = $.ui.resolve(e);

    return <Code source={CODE_WITH_EMPTY_LINE} />;
  });
}
