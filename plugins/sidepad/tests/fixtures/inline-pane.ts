import type { RenderInput } from 'claude-code';

import { PANE } from './pane';

/** The pane placed inline on the main screen, two rows tall, as an unasked open lands there. */
export const INLINE_PANE: RenderInput<'Pane', 'terminal'> = {
  ...PANE,
  viewport: { columns: 80, rows: 40 },
  props: { ...PANE.props, bodyColumns: 76, placement: 'inline', scroll: { offset: 0, bodyRows: 2 } },
};
