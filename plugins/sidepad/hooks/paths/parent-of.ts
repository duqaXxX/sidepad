/**
 * The directory that holds a path.
 *
 * @param path an absolute path without a trailing slash
 * @returns everything before its last `/`, or `/` itself
 */
export const parentOf = (path: string) => path.slice(0, Math.max(1, path.lastIndexOf('/')));
