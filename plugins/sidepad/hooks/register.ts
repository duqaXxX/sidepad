import type { On } from 'claude-code';

import Handlers from './handlers';
import Names from './names';
import type Sidepad from './sidepad';
import Tools from './tools';

/**
 * Registers the sidepad pane: `/sidepad` and the pane's drawing, following Claude's edits at the end
 * of the main loop's turn, checking the page after shell commands, and the selection that rides a
 * prompt. Each hook hands its event to one handler; the state lives in `sidepad`.
 *
 * @param on the engine's registrar
 */
export function register(on: On) {
  let sidepad: Sidepad.Sidepad | null = null;

  // Runs at the session's start and again on a plugin reload.
  on('session.start', async ($, e, next) => {
    sidepad = await Handlers.startSession(
      {
        stat: (path) => $.fs.stat(path),
        read: (path) => $.fs.read(path),
        list: (path) => $.fs.list(path),
        run: (argv, init) => $.process.run(argv, init),
        storeGet: (key) => $.store.get(key),
        storeSet: (key, value) => $.store.set(key, value),
        invalidate: () => $.ui.invalidate('ui.render'),
        status: (text) => $.ui.status(text),
        openPane: (pane) => $.ui.open(pane),
        closePane: (pane) => $.ui.close(pane),
        registerCommand: (spec) => $.command.register(spec),
      },
      e.cwd,
    );

    return next(e);
  });

  on('command.run', ($, e, next) => {
    if (sidepad) {
      Handlers.learnCommandWidth(sidepad, e.presentation);
    }

    return next(e);
  });

  on('command.run', { command: Names.COMMAND_SPEC.name }, ($, e, next) =>
    sidepad ? Handlers.runSidepadCommand(sidepad, e.args) : next(e),
  );

  on('command.run', { command: ['clear', 'resume'] }, async ($, e, next) => {
    const result = await next(e);

    if (sidepad) {
      await Handlers.resetSession(sidepad);
    }

    return result;
  });

  // The hint line under the prompt is drawn whatever the pane is doing, so its viewport is where
  // the terminal's width and layout come from before a pane exists. Only the terminal's: the pane
  // is drawn there, and a remote surface reports its own size and layout (the mobile app, none).
  on('ui.render', { component: 'PromptHint' }, ($, e, next) => {
    if (sidepad && e.surface === 'terminal') {
      Handlers.learnViewport(sidepad, e.viewport);
    }

    return next(e);
  });

  on('ui.render', { component: 'Pane' }, ($, e, next) => {
    const tree =
      sidepad && e.requestId === Names.PANE_ID && e.surface === 'terminal'
        ? Handlers.drawPane(sidepad, e, $.ui.resolve(e))
        : null;

    return tree ?? next(e);
  });

  on('ui.scroll', { requestId: Names.PANE_ID }, ($, e, next) => {
    if (!sidepad) {
      return next(e);
    }

    Handlers.scrollPane(sidepad, e);

    return {};
  });

  on('ui.message', { requestId: Names.PANE_ID }, ($, e, next) => {
    if (sidepad) {
      // What a Client posted is the pane's own business: a throw here must not fail the event.
      try {
        Handlers.receiveMessage(sidepad, e.data);
      } catch {
        // The post is dropped; the pane keeps the state it had.
      }
    }

    return next(e);
  });

  on('ui.press', { requestId: Names.PANE_ID }, async ($, e, next) => {
    if (sidepad) {
      await Handlers.pressInPane(sidepad, e.element, (text) => $.prompt.submit({ text })).catch(() => undefined);
    }

    return next(e);
  });

  on('prompt.submit', ($, e, next) => (sidepad ? Handlers.attachSelection(sidepad, e, next) : next(e)));

  on('tool.call', { tool: [...Tools.EDITING_TOOLS, ...Tools.SHELL_TOOLS] }, async ($, e, next) => {
    const result = await next(e);

    if (sidepad) {
      // A failure to read the pane's page must never fail Claude's tool call.
      await Handlers.recordToolCall(sidepad, e, result).catch(() => undefined);
    }

    return result;
  });

  on('turn.complete', async ($, e, next) => {
    const result = await next(e);

    if (sidepad) {
      await Handlers.completeTurn(sidepad, e).catch(() => undefined);
    }

    return result;
  });

  on('ui.close', { id: Names.PANE_ID }, async ($, e, next) => {
    const result = await next(e);

    if (sidepad) {
      Handlers.closePane(sidepad, e);
    }

    return result;
  });
}
