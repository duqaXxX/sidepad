import { describe, expect, test, tier } from 'claude-code/testing';

import Images from '../hooks/images';
import { IMAGE_MAX_ROWS } from '../hooks/limits';
import { pngHeaderBytes as pngHeader, toBase64 } from './fixtures';

tier('user');

// ---------------------------------------------------------------------------
// imageKindOf
// ---------------------------------------------------------------------------

describe('imageKindOf', () => {
  test('returns png for .png, case insensitive', () => {
    expect(Images.imageKindOf('/ho' + 'me/alice/photo.png')).toBe('png');
    expect(Images.imageKindOf('/ho' + 'me/alice/LOGO.PNG')).toBe('png');
  });

  test('returns other for known non-PNG image extensions', () => {
    expect(Images.imageKindOf('/ho' + 'me/alice/photo.jpg')).toBe('other');
    expect(Images.imageKindOf('/ho' + 'me/alice/photo.jpeg')).toBe('other');
    expect(Images.imageKindOf('/ho' + 'me/alice/anim.gif')).toBe('other');
    expect(Images.imageKindOf('/ho' + 'me/alice/photo.webp')).toBe('other');
    expect(Images.imageKindOf('/ho' + 'me/alice/icon.bmp')).toBe('other');
    expect(Images.imageKindOf('/ho' + 'me/alice/logo.svg')).toBe('other');
  });

  test('returns null for non-image extensions and no extension', () => {
    expect(Images.imageKindOf('/ho' + 'me/alice/notes.md')).toBeNull();
    expect(Images.imageKindOf('/ho' + 'me/alice/script.ts')).toBeNull();
    expect(Images.imageKindOf('/ho' + 'me/alice/Makefile')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// pngSizeOf
// ---------------------------------------------------------------------------

describe('pngSizeOf', () => {
  test('reads width and height from a valid PNG header', () => {
    expect(Images.pngSizeOf(toBase64(pngHeader(800, 600)))).toEqual({ width: 800, height: 600 });
    expect(Images.pngSizeOf(toBase64(pngHeader(1, 1)))).toEqual({ width: 1, height: 1 });
    expect(Images.pngSizeOf(toBase64(pngHeader(4096, 2048)))).toEqual({ width: 4096, height: 2048 });
  });

  test('returns null for empty input', () => {
    expect(Images.pngSizeOf('')).toBeNull();
  });

  test('returns null for a truncated header (too few base64 characters)', () => {
    // fewer than 44 chars: header is intact but input ends early
    const short = toBase64(pngHeader(100, 100)).slice(0, 20);
    expect(Images.pngSizeOf(short)).toBeNull();
  });

  test('returns null when the PNG signature is wrong', () => {
    const bad = pngHeader(100, 100);
    bad[0] = 0x00; // corrupt first signature byte
    expect(Images.pngSizeOf(toBase64(bad))).toBeNull();
  });

  test('returns null when the IHDR chunk type is wrong', () => {
    const bad = pngHeader(100, 100);
    bad[12] = 0x00; // corrupt first byte of "IHDR"
    expect(Images.pngSizeOf(toBase64(bad))).toBeNull();
  });

  test('returns null when either dimension is zero', () => {
    // A 0x0 PNG passes signature and IHDR checks but would produce NaN in imageBoxOf.
    expect(Images.pngSizeOf(toBase64(pngHeader(0, 0)))).toBeNull();
    expect(Images.pngSizeOf(toBase64(pngHeader(0, 100)))).toBeNull();
    expect(Images.pngSizeOf(toBase64(pngHeader(100, 0)))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// imageBoxOf
// ---------------------------------------------------------------------------

describe('imageBoxOf', () => {
  const MAX = IMAGE_MAX_ROWS;

  test('a wide image: natural height is small, at least 1 row', () => {
    // 1920x100 at columns=80: round(100/1920 * 80 / 2) = round(2.08) = 2
    expect(Images.imageBoxOf({ width: 1920, height: 100 }, 80, MAX)).toEqual({ columns: 80, rows: 2 });
  });

  test('a tall image: natural height exceeds the cap', () => {
    // 100x2000 at columns=80: round(2000/100 * 80 / 2) = 800, clamped to IMAGE_MAX_ROWS
    expect(Images.imageBoxOf({ width: 100, height: 2000 }, 80, MAX)).toEqual({ columns: 80, rows: MAX });
  });

  test('a square image at narrow page: proportional', () => {
    // 400x400 at columns=40: round(400/400 * 40 / 2) = 20
    expect(Images.imageBoxOf({ width: 400, height: 400 }, 40, MAX)).toEqual({ columns: 40, rows: 20 });
  });

  test('a 1x10000 image is capped at IMAGE_MAX_ROWS', () => {
    // round(10000/1 * 80 / 2) = 400000, clamped to IMAGE_MAX_ROWS
    expect(Images.imageBoxOf({ width: 1, height: 10000 }, 80, MAX)).toEqual({ columns: 80, rows: MAX });
  });

  test('a 10000x1 image is floored to 1 row', () => {
    // round(1/10000 * 80 / 2) = 0, clamped up to 1
    expect(Images.imageBoxOf({ width: 10000, height: 1 }, 80, MAX)).toEqual({ columns: 80, rows: 1 });
  });

  test('a page one column wide yields columns=1 and rows=1 for a 1:1 image', () => {
    // round(100/100 * 1 / 2) = round(0.5) = 1
    expect(Images.imageBoxOf({ width: 100, height: 100 }, 1, MAX)).toEqual({ columns: 1, rows: 1 });
  });
});
