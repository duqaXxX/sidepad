import type { ClientPointerEvent, ClientSurface } from 'claude-code';

import Limits from '../limits';
import type SurfaceMessage from '../surface-message';
import { type CodeDrag, NO_DRAG } from './code-drag';

/** A file Client's drag after a pointer event or an edge tick, and the message to post. */
type Moved = { drag: CodeDrag; post: SurfaceMessage.SurfaceMessage | null };

/**
 * Sets a file Client's pointer listener, once, at mount: each event goes through `step`, and while
 * the held pointer is past an edge `tick` runs every `EDGE_SCROLL_MS`, so the selection grows as
 * the page scrolls. Each reads the window from the Client's latest props, which `windowNow` gives.
 *
 * No `surface.onKey`, on purpose: while a Client has a key listener a click hands it the keyboard,
 * and typing after a selection never reached the prompt box. Without one the keys stay with the
 * prompt, and page keys on a focused pane still reach the hooks' `ui.scroll`.
 *
 * @param windowNow the window the Client's latest props describe, null before it has any
 * @param step a pointer event's effect, and the edge the held pointer is past (null: unchanged)
 * @param tick one tick past `edge`
 */
export function listenForDrag<W>(
  surface: ClientSurface<CodeDrag>,
  windowNow: () => W | null,
  step: (drag: CodeDrag, event: ClientPointerEvent, window: W) => Moved & { edge: -1 | 0 | 1 | null },
  tick: (drag: CodeDrag, edge: -1 | 0 | 1, window: W) => Moved,
): void {
  let edge: -1 | 0 | 1 = 0;
  let stopEdge: (() => void) | null = null;

  const apply = ({ drag, post }: Moved) => {
    if (drag !== surface.state) {
      surface.setState(drag);
    }

    if (post !== null) {
      surface.post(post);
    }
  };

  surface.onPointer((event: ClientPointerEvent) => {
    const window = windowNow();

    if (window === null) {
      return;
    }

    const stepped = step(surface.state ?? NO_DRAG, event, window);

    apply(stepped);

    if (stepped.edge === null) {
      return;
    }

    edge = stepped.edge;

    if (edge === 0) {
      stopEdge?.();
      stopEdge = null;
    } else {
      stopEdge ??= surface.every(Limits.EDGE_SCROLL_MS, () => {
        const now = windowNow();

        if (now !== null) {
          apply(tick(surface.state ?? NO_DRAG, edge, now));
        }
      });
    }
  });
}
