/**
 * The last piece of a path: the file's or directory's own name.
 *
 * @param path an absolute path without a trailing slash
 * @returns everything after its last `/`, the whole path when it holds none
 */
export const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);
