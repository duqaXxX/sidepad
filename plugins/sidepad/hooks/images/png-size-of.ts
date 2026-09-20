const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decode the first `n` bytes of a base64 string without touching the rest of the input.
 * `Uint8Array.fromBase64` is not in ES2023 lib and `atob` is a runtime-only global, so
 * this small decoder keeps the module self-contained.
 *
 * @returns a `Uint8Array` of length `n`, or `null` when the input is too short or malformed.
 */
const headerBytesOf = (b64: string, n: number): Uint8Array | null => {
  // 4 base64 characters encode 3 bytes; ceil(n/3)*4 characters are needed.
  const need = Math.ceil(n / 3) * 4;
  if (b64.length < need) return null;
  const out = new Uint8Array(n);
  let o = 0;
  for (let i = 0; i < need && o < n; i += 4) {
    const a = B64_ALPHABET.indexOf(b64[i]!);
    const b = B64_ALPHABET.indexOf(b64[i + 1]!);
    const c = B64_ALPHABET.indexOf(b64[i + 2]!);
    const d = B64_ALPHABET.indexOf(b64[i + 3]!);
    if (a < 0 || b < 0) return null;
    out[o++] = (a << 2) | (b >> 4);
    if (c >= 0 && o < n) out[o++] = ((b & 0xf) << 4) | (c >> 2);
    if (d >= 0 && o < n) out[o++] = ((c & 0x3) << 6) | d;
  }
  return o >= n ? out : null;
};

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const IHDR_TYPE = [0x49, 0x48, 0x44, 0x52] as const; // "IHDR"

/**
 * The pixel dimensions of a PNG from its IHDR header, decoding only the first 32 bytes.
 *
 * @returns `{ width, height }` in pixels, or `null` when the base64 is not a valid PNG header.
 */
export const pngSizeOf = (base64: string): { width: number; height: number } | null => {
  const bytes = headerBytesOf(base64, 32);
  if (!bytes) return null;

  // PNG signature: bytes 0..7
  for (let i = 0; i < PNG_SIG.length; i++) {
    if (bytes[i] !== PNG_SIG[i]) return null;
  }

  // IHDR chunk type: bytes 12..15 (bytes 8..11 are the chunk length)
  for (let i = 0; i < IHDR_TYPE.length; i++) {
    if (bytes[12 + i] !== IHDR_TYPE[i]) return null;
  }

  // Width and height: big-endian uint32 at byte offsets 16 and 20
  const width = ((bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!) >>> 0;
  const height = ((bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!) >>> 0;

  return { width, height };
};
