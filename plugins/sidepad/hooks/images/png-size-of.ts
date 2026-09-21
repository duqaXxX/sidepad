// fromBase64 is available at runtime (engine-documented at plugins/types/claude-code.d.ts:4005)
// but not declared in the ES2023 lib.
declare global {
  interface Uint8ArrayConstructor {
    fromBase64(b64: string): Uint8Array;
  }
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const IHDR_TYPE = [0x49, 0x48, 0x44, 0x52] as const; // "IHDR"

// 44 base64 characters decode to 33 bytes; the signature and the IHDR size read the first 24.
const PNG_HEADER_B64_CHARS = 44;

/**
 * The pixel dimensions of a PNG from its IHDR header, decoding only the first 33 bytes.
 *
 * @returns `{ width, height }` in pixels, or `null` when the text does not decode as base64, when
 * it is not a valid PNG header, or when either dimension is zero (malformed per the PNG spec).
 */
export const pngSizeOf = (base64: string): { width: number; height: number } | null => {
  if (base64.length < PNG_HEADER_B64_CHARS) return null;

  // `fromBase64` throws on a character no alphabet holds, and the caller is a hook: a file whose
  // head is not base64 at all has no size, it does not end the handler.
  let bytes: Uint8Array;

  try {
    bytes = Uint8Array.fromBase64(base64.slice(0, PNG_HEADER_B64_CHARS));
  } catch {
    return null;
  }

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

  // A zero dimension produces NaN in imageBoxOf; it is also malformed per the PNG spec.
  if (width === 0 || height === 0) return null;

  return { width, height };
};
