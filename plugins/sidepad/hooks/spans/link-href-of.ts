/** The longest `href` a `Link` takes (plugins/types/claude-code.d.ts, LinkProps). */
const MAX_HREF_CHARS = 2048;

// Only an href already spelled as `new URL(href).href` passes: a lowercase host with no user part and
// no port on https, a path with no `.` or `..` piece, and no character the URL parser would encode.
// A host the parser would read as IPv4 or check as punycode is left out, and so is an encoded dot.
// A `Link` whose href breaks the engine's rule refuses the whole tree it is in, so this errs towards
// refusing a link the engine would have taken.
const ORIGIN =
  /^(https:\/\/(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|http:\/\/localhost(?::([0-9]+))?)(.*)$/;
const REST =
  /^(?:\/[A-Za-z0-9\-._~!$&'()*+,;=:%]*)*(?:\?[A-Za-z0-9\-._~!$&()*+,;=:%/?]*)?(?:#[A-Za-z0-9\-._~!$&'()*+,;=:%/?]*)?$/;
const DOT_PIECE = /\/\.{1,2}(?=[/?#]|$)/;
/** A last label the URL parser takes for a number, which makes the whole host an IPv4 address. */
const NUMERIC_LABEL = /(?:^|\.)(?:[0-9]+|0x[0-9a-f]*)$/;
/** A punycode label: whether the parser takes it needs the IDNA tables, which the plugin lacks. */
const PUNYCODE_LABEL = /(?:^|\.)xn--/;
/** A dot the parser decodes, and then walks as it walks `.` and `..`. */
const ENCODED_DOT = /%2e/i;

/** A port the URL parser keeps as written: no leading zero, in range, and not http's default. */
const isKeptPort = (port: string) => /^[1-9][0-9]*$/.test(port) && Number(port) <= 65535 && port !== '80';

/**
 * The href a `Link` can carry for a link target, or null when the target has to stay text.
 *
 * A bare origin gains the `/` the URL parser adds. Anything else is taken only when it is already in
 * the parser's spelling, which markdown-it's encoding of a target mostly ensures.
 *
 * @param target the link's `href` as the parser hands it
 * @returns the href to draw as a `Link`, or null for a target that is not `https:` or
 *   `http://localhost`, or not spelled the way the engine takes it
 */
export function linkHrefOf(target: string): string | null {
  const parts = ORIGIN.exec(target);

  if (parts === null) {
    return null;
  }

  const [, origin, port, after] = parts as unknown as [string, string, string | undefined, string];

  // A host the pattern stopped short of, as in `https://example.com@example.org` or `https://example.com:443`.
  if (after !== '' && !/^[/?#]/.test(after)) {
    return null;
  }

  const rest = after.startsWith('/') ? after : `/${after}`;
  const path = rest.split(/[?#]/, 1)[0]!;
  const href = origin + rest;

  if (port !== undefined && !isKeptPort(port)) {
    return null;
  }

  const host = origin.startsWith('https://') ? origin.slice('https://'.length) : 'localhost';

  if (NUMERIC_LABEL.test(host) || PUNYCODE_LABEL.test(host)) {
    return null;
  }

  return href.length <= MAX_HREF_CHARS && REST.test(rest) && !DOT_PIECE.test(path) && !ENCODED_DOT.test(path)
    ? href
    : null;
}
