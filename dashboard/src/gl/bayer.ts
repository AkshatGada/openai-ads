// Bayer 8x8 ordered-dither threshold matrix, normalized to [0,1].
// Uploaded once as an 8x8 single-channel texture (NEAREST/REPEAT) so the
// fragment shader can look it up by screen pixel — portable across WebGL1/2
// and avoids dynamic const-array indexing issues in GLSL ES 1.00.

// prettier-ignore
const BAYER_8X8 = [
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

/** 8x8 RGBA texel data (256 bytes); threshold value replicated into R/G/B/A.
 *  RGBA is the most portable format across WebGL1/2 (LUMINANCE is removed in WebGL2). */
export function bayerTextureData(): Uint8Array {
  const data = new Uint8Array(64 * 4);
  for (let i = 0; i < 64; i++) {
    const v = Math.round((BAYER_8X8[i]! / 64) * 255);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  return data;
}

export const BAYER_SIZE = 8;
