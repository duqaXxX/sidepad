import type { ResultOf } from 'claude-code';

/**
 * Whether a tool call ran to a result: not refused, not failed.
 *
 * @returns true when the call's result carries no `deny` and no `isError`
 */
export const hasLanded = (result: ResultOf['tool.call']) => result.deny === undefined && result.isError !== true;
