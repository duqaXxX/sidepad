/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code';

import Limits from '../limits';
import Names from '../names';
import type Plan from '../plan';
import type { TerminalUi } from './terminal-ui';

/**
 * A formatted Markdown page: one Client a block, a blank row between blocks. `Markdown` does not say
 * how tall a paragraph or a table draws, so each block reports its own height.
 *
 * @returns the page
 */
export function blocksPage(ui: TerminalUi, blocks: readonly Plan.BlockViewProps[], columns: number): RenderElement {
  const { Box, Client } = ui;

  return (
    <Box flexDirection="column" gap={Limits.BLOCK_GAP_ROWS} width={columns}>
      {blocks.map((block) => (
        <Client key={Names.keyOf('block', block.index)} module="../surfaces/markdown-block-view.tsx" props={block} />
      ))}
    </Box>
  );
}
