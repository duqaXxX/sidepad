import type { RenderInput } from 'claude-code';

/** A docked pane drawing: 80 body columns, 30 body rows. */
export const PANE: RenderInput<'Pane', 'terminal'> = {
  component: 'Pane',
  surface: 'terminal',
  requestId: 'sidepad',
  viewport: { columns: 160, rows: 40 },
  props: {
    title: 'sidepad',
    isFocused: false,
    bodyColumns: 80,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
};
