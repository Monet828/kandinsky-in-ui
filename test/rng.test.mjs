import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeededRandom, hashSeed, mulberry32 } from "../dist/index.js";

test("createSeededRandom: 同じseedなら同じ数列になる（決定論性の根本保証）", () => {
  const a = createSeededRandom("hello");
  const b = createSeededRandom("hello");
  const seqA = Array.from({ length: 20 }, () => a());
  const seqB = Array.from({ length: 20 }, () => b());
  assert.deepEqual(seqA, seqB);
});

test("createSeededRandom: seedが違えば違う数列になる", () => {
  const a = createSeededRandom("seed-one");
  const b = createSeededRandom("seed-two");
  const seqA = Array.from({ length: 10 }, () => a());
  const seqB = Array.from({ length: 10 }, () => b());
  assert.notDeepEqual(seqA, seqB);
});

test("createSeededRandom: 値は常に [0, 1) の範囲に収まる", () => {
  const rand = createSeededRandom("range-check");
  for (let i = 0; i < 1000; i++) {
    const v = rand();
    assert.ok(v >= 0 && v < 1, `value out of range: ${v}`);
  }
});

test("hashSeed: 同じ文字列なら同じ数値、違う文字列ならほぼ確実に違う数値", () => {
  assert.equal(hashSeed("abc"), hashSeed("abc"));
  assert.notEqual(hashSeed("abc"), hashSeed("abd"));
});

test("mulberry32: 同じ数値seedなら同じ数列（rng.ts単体としての契約）", () => {
  const a = mulberry32(12345);
  const b = mulberry32(12345);
  assert.deepEqual(
    Array.from({ length: 5 }, () => a()),
    Array.from({ length: 5 }, () => b()),
  );
});
