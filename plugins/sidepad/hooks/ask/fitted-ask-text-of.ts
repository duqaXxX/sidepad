import Names from '../names';

/**
 * A selection's text as it fits the room a prompt's context has left: whole when it fits, else its
 * first whole lines and ASK_CUT_NOTE. Mechanism of `diff`'s `fittedAskTextOf`.
 *
 * @param text the selection's context entry
 * @param room the characters the context has left
 * @returns the text to attach, or undefined when not even one line after the lead fits
 */
export function fittedAskTextOf(text: string, room: number): string | undefined {
  if (text.length <= room) {
    return text;
  }

  const kept: string[] = [];
  let used = Names.ASK_CUT_NOTE.length;

  for (const line of text.split('\n')) {
    const cost = line.length + 1;

    if (used + cost > room) {
      break;
    }

    kept.push(line);
    used += cost;
  }

  return kept.length > 1 ? `${kept.join('\n')}\n${Names.ASK_CUT_NOTE}` : undefined;
}
