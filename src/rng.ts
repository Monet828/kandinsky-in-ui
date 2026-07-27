/**
 * Kandinsky in UI — 決定的な擬似乱数。
 *
 * 見た目の再現性のためだけに使う（暗号用途ではない）。文字列seedから
 * 常に同じ数列を作れることが、この設計システム全体の前提になっている。
 */

// mulberry32: 軽量な決定的PRNG。
export function mulberry32(seed: number): () => number {
  let s = seed;
  return function random() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h;
}

/** 文字列seedから直接、決定的な乱数関数を作る */
export function createSeededRandom(seed: string): () => number {
  return mulberry32(hashSeed(seed));
}
