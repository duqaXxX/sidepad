import type { Args, ResultOf } from 'claude-code';

import Ask from '../ask';
import Limits from '../limits';
import Names from '../names';
import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import { readLineWindow } from './read-line-window';

/**
 * A prompt submitted while lines are selected: the selection rides it as one context entry, cut to
 * the room the context has left, and is cleared once the prompt was not dropped. A selection with no
 * room at all is cleared and the status line says so.
 *
 * @param next the hook's `next`
 * @returns what `next` resolved to
 */
export async function attachSelection(
  sidepad: Sidepad.Sidepad,
  e: Args<'prompt.submit'>,
  next: (e: Args<'prompt.submit'>) => Promise<ResultOf['prompt.submit']>,
): Promise<ResultOf['prompt.submit']> {
  const { selection, file } = sidepad.state;

  if (!selection || !file) {
    return next(e);
  }

  const context = e.context ?? [];
  const room = Limits.PROMPT_CONTEXT_MAX_CHARS - context.reduce((sum, entry) => sum + entry.length, 0);
  // A file too large to read whole holds one window: the lines selected are read for the prompt,
  // since a drag past the window's edge can have left them outside it.
  const range = selection.range;
  const selected =
    file.loaded.source === 'windowed'
      ? await readLineWindow(
          sidepad.host,
          file.loaded.path,
          range.start - 1,
          Math.min(range.end - range.start + 1, Limits.ASK_MAX_LINES),
        )
      : null;
  const lines = selected ?? file.loaded.lines;
  const firstLine = selected === null ? file.loaded.from : range.start - 1;
  const text = Ask.fittedAskTextOf(Ask.askTextOf(file.loaded.path, lines, range, firstLine), room);

  if (text === undefined) {
    sidepad.state = PaneState.withoutSelection(sidepad.state);
    sidepad.host.status(Names.ASK_DROPPED_TEXT);
    sidepad.host.invalidate();

    return next(e);
  }

  const result = await next({ ...e, context: [...context, text] });

  if (result.drop === undefined) {
    sidepad.state = PaneState.withoutSelection(sidepad.state);
    sidepad.host.invalidate();
  }

  return result;
}
