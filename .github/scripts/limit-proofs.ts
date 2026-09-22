/**
 * What proves each limit Claude Code sets, keyed by the id its comment carries: `LIMIT(id):`.
 *
 * A proof is a scenario of `bun run check:live --limits` that passes while the limit holds, a path in
 * the engine's declarations whose text states it, which the probe's comparison reports when a release
 * changes it, or `modelTurn` naming what only a model turn reaches. A limit is a measured fact of one
 * release, so none stays without a way to measure it again: limit-proofs.test.ts fails when an engine
 * limit has no id or no entry, when an entry names no limit, and when a proof does not resolve.
 */
export type LimitProof = { live: string } | { declaration: string } | { modelTurn: string };

export const LIMIT_PROOFS: Record<string, readonly LimitProof[]> = {
  'element-char-cap': [{ declaration: 'CodeProps.source' }, { declaration: 'MarkdownProps.text' }],
  'diff-panel-covers-pane': [{ live: 'diff-panel-covers-a-shown-pane' }],
  'wheel-reversal-drops-tick': [{ live: 'wheel-reversal-drops-first-tick' }],
  'home-end-move-one-page': [{ live: 'end-moves-one-page' }],
  'image-png-only': [{ declaration: 'ImageProps' }],
  'context-entry-cap': [
    { modelTurn: 'a selection past 100,000 characters reaching the model as a 2 KB head and a path' },
  ],
  'context-total-cap': [
    { modelTurn: "a prompt's context past 200,000 characters reaching the model as a 2 KB head and a path" },
  ],
  'code-diff-format-refuses': [{ declaration: 'CodeProps.format' }],
  'diff-grammar-headers-only': [{ live: 'diff-grammar-colours-headers-only' }],
  'code-trailing-blank-unnumbered': [{ live: 'window-ending-blank-line-unnumbered' }],
  'screen-trailing-blank-row': [{ live: 'window-ending-blank-line-unnumbered' }],
  'link-url-after-text': [{ live: 'link-draws-its-url-after-text' }],
  'code-no-gutter-drops-empty-line': [{ live: 'code-without-gutter-drops-empty-line' }],
  // The names are read from the build, and `color` is a bare string in the declarations: a release
  // that types it names them there.
  'theme-colour-names': [{ declaration: 'TextProps.color' }, { live: 'theme-colour-names-resolve' }],
  'focus-ring-drawn-rows': [{ live: 'arrows-wrap-at-drawn-rows' }],
};
