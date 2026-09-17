import { CWD } from './cwd';

/** A terminal session starting in CWD. */
export const SESSION = { surface: 'terminal' as const, isInteractive: true, cwd: CWD };
