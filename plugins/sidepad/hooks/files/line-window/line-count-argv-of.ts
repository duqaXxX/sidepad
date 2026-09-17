/**
 * The command that counts a file's lines, run once when the pane opens a file past the read cap.
 *
 * `grep -c ''` counts LINES; `wc -l` counts newlines, so it misses a file's last line when the file
 * does not end with one, and returns 0 for a whole file held on a single line (a minified bundle, a
 * one-line JSON). It is also the faster of the two: on a 134 MB file of 1.2M lines, macOS arm64,
 * measured 2026-09-17, `grep -c ''` took ~25 ms against ~110 ms for `wc -l`, ~160 ms for
 * `sed -n '$='` and ~2200 ms for `awk 'END{print NR}'`.
 *
 * @returns the argv, the executable first
 */
export const lineCountArgvOf = (path: string) => ['grep', '-c', '', path];
