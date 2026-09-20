const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Standard padded base64 for bytes, the way `$.fs.read(path, { as: 'bytes' })` answers.
 *
 * @returns the base64, no line breaks
 */
export function toBase64(bytes: Uint8Array): string {
  let out = '';

  for (let at = 0; at < bytes.length; at += 3) {
    const b0 = bytes[at]!;
    const b1 = at + 1 < bytes.length ? bytes[at + 1]! : 0;
    const b2 = at + 2 < bytes.length ? bytes[at + 2]! : 0;

    out += B64[b0 >> 2]! + B64[((b0 & 3) << 4) | (b1 >> 4)]!;
    out += at + 1 < bytes.length ? B64[((b1 & 0xf) << 2) | (b2 >> 6)]! : '=';
    out += at + 2 < bytes.length ? B64[b2 & 0x3f]! : '=';
  }

  return out;
}

/**
 * A PNG's first 32 bytes for a picture of a given size: the 8-byte signature, the IHDR chunk's
 * length and type, and the two big-endian dimensions. Nothing under test decodes a picture, so the
 * pixels are left out.
 *
 * @returns the header bytes
 */
export function pngHeaderBytes(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(32);

  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x00, 0x00, 0x00, 0x0d], 8); // IHDR chunk length, 13
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"

  for (let at = 0; at < 4; at += 1) {
    bytes[16 + at] = (width >>> (8 * (3 - at))) & 0xff;
    bytes[20 + at] = (height >>> (8 * (3 - at))) & 0xff;
  }

  return bytes;
}

/**
 * A PNG as the fake disks hold a file: one character a byte, so the file's size is its length and
 * `bytesOf` gives the bytes back as the engine's `{ as: 'bytes' }` read does.
 *
 * @returns the file's content
 */
export const pngFileOf = (width: number, height: number): string =>
  String.fromCharCode(...pngHeaderBytes(width, height));

/**
 * The base64 of a file a fake disk holds as one character a byte.
 *
 * @returns what `$.fs.read(path, { as: 'bytes' })` answers with for that file
 */
export const bytesOf = (text: string): string => toBase64(Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff));
