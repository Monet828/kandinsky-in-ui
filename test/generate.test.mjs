import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKandinskyComposition, generateKandinskyIcon, KANDINSKY_PALETTE } from "../dist/index.js";

const W = 480;
const H = 800;
const N_AUDIT = 500; // 500seedの機械監査で今まで見つかったバグ（アイコンの単色化）の再発防止用

function triangleArea(points) {
  const [[x1, y1], [x2, y2], [x3, y3]] = points;
  return Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) / 2;
}

test("generateKandinskyComposition: 同じseed・同じ引数なら常に同じ構図（決定論性）", () => {
  const a = generateKandinskyComposition("determinism-check", W, H, "md");
  const b = generateKandinskyComposition("determinism-check", W, H, "md");
  assert.deepEqual(a, b);
});

test("generateKandinskyComposition: densityごとの円の数がDENSITY_COUNTSの仕様通り", () => {
  const counts = { sm: 3, md: 5, lg: 7 };
  for (const [density, expected] of Object.entries(counts)) {
    const { shapes } = generateKandinskyComposition("density-check", W, H, density);
    const circles = shapes.filter((s) => s.kind === "circle");
    assert.equal(circles.length, expected, `density=${density}`);
  }
});

test("generateKandinskyComposition: smではcheckerを含まない、md/lgでは含む", () => {
  const sm = generateKandinskyComposition("checker-check", W, H, "sm");
  const md = generateKandinskyComposition("checker-check", W, H, "md");
  assert.ok(!sm.shapes.some((s) => s.kind === "checker"));
  assert.ok(md.shapes.some((s) => s.kind === "checker"));
});

test(`generateKandinskyComposition: ${N_AUDIT}seedにわたり、退化した図形・不正な値が出ない`, () => {
  for (let i = 0; i < N_AUDIT; i++) {
    const seed = `bulk-audit-${i}`;
    const { shapes } = generateKandinskyComposition(seed, W, H, "md");

    for (const s of shapes) {
      if (s.kind === "circle") {
        assert.ok(s.r > 0 && Number.isFinite(s.r), `[${seed}] circle radius invalid: ${s.r}`);
        assert.ok(s.opacity > 0 && s.opacity <= 1, `[${seed}] circle opacity out of range: ${s.opacity}`);
        assert.ok(KANDINSKY_PALETTE.includes(s.color), `[${seed}] circle color not in palette: ${s.color}`);
      }
      if (s.kind === "ring") {
        assert.ok(s.r > 0 && Number.isFinite(s.r), `[${seed}] ring radius invalid: ${s.r}`);
        assert.ok(s.strokeWidth > 0 && Number.isFinite(s.strokeWidth), `[${seed}] ring strokeWidth invalid: ${s.strokeWidth}`);
        assert.ok(KANDINSKY_PALETTE.includes(s.color), `[${seed}] ring color not in palette: ${s.color}`);
      }
      if (s.kind === "triangle") {
        assert.ok(triangleArea(s.points) > 1, `[${seed}] triangle is degenerate (near-zero area)`);
      }
    }
  }
});

test("generateKandinskyComposition: densityに関わらず輪っかがちょうど1個含まれる", () => {
  for (const density of ["sm", "md", "lg"]) {
    const { shapes } = generateKandinskyComposition("ring-count-check", W, H, density);
    const rings = shapes.filter((s) => s.kind === "ring");
    assert.equal(rings.length, 1, `density=${density}`);
  }
});

test("generateKandinskyComposition: paletteを差し替えると、円・輪っか・三角形の色がその候補（+INK）からのみ選ばれる", () => {
  const customPalette = ["#111111", "#222222", "#333333"];
  const KANDINSKY_INK = "#14110F";
  const { shapes } = generateKandinskyComposition("custom-palette-check", W, H, "lg", customPalette);
  for (const s of shapes) {
    if (s.kind === "circle" || s.kind === "ring") {
      assert.ok(customPalette.includes(s.color), `${s.kind} color ${s.color} not in custom palette`);
    }
    if (s.kind === "triangle") {
      assert.ok([...customPalette, KANDINSKY_INK].includes(s.color), `triangle color ${s.color} not in custom palette+ink`);
    }
  }
});

test("generateKandinskyComposition: 同じseed・paletteなら常に同じ構図（palette込みの決定論性）", () => {
  const customPalette = ["#aaaaaa", "#bbbbbb"];
  const a = generateKandinskyComposition("palette-determinism-check", W, H, "md", customPalette);
  const b = generateKandinskyComposition("palette-determinism-check", W, H, "md", customPalette);
  assert.deepEqual(a, b);
});

test(`generateKandinskyComposition: ${N_AUDIT}seedにわたり、円の色に極端な偏りが無い（6色がほぼ均等に出現する）`, () => {
  const histogram = {};
  let totalCircles = 0;
  for (let i = 0; i < N_AUDIT; i++) {
    const { shapes } = generateKandinskyComposition(`color-bias-${i}`, W, H, "md");
    for (const s of shapes) {
      if (s.kind === "circle") {
        histogram[s.color] = (histogram[s.color] || 0) + 1;
        totalCircles++;
      }
    }
  }
  const expected = totalCircles / KANDINSKY_PALETTE.length;
  for (const color of KANDINSKY_PALETTE) {
    const count = histogram[color] || 0;
    // 均等分布から±40%を超えて外れたら偏りとみなす（ゆるめの閾値。厳密な検定ではない）
    assert.ok(
      count > expected * 0.6 && count < expected * 1.4,
      `color ${color} appeared ${count} times, expected around ${expected.toFixed(0)}`,
    );
  }
});

// --- アイコン: 過去に実際に踏んだ回帰（16.4%が単色化）に対するテスト ---

test(`generateKandinskyIcon: ${N_AUDIT}seedにわたり、2つの円が同色にならない（過去の回帰: 修正前は16.4%が単色化していた）`, () => {
  let monochrome = 0;
  for (let i = 0; i < N_AUDIT; i++) {
    const { circles } = generateKandinskyIcon(`icon-audit-${i}`);
    assert.equal(circles.length, 2);
    if (circles[0].color === circles[1].color) monochrome++;
  }
  assert.equal(monochrome, 0, `${monochrome}/${N_AUDIT} seeds produced a monochrome icon`);
});

test("generateKandinskyIcon: 同じseedなら常に同じ見た目（決定論性）", () => {
  const a = generateKandinskyIcon("icon-determinism-check");
  const b = generateKandinskyIcon("icon-determinism-check");
  assert.deepEqual(a, b);
});

test("generateKandinskyIcon: paletteを差し替えると、その候補からのみ色が選ばれる", () => {
  const customPalette = ["#101010", "#202020", "#303030"];
  const { circles } = generateKandinskyIcon("custom-palette-icon-check", 24, 1.3, customPalette);
  for (const c of circles) {
    assert.ok(customPalette.includes(c.color), `icon circle color ${c.color} not in custom palette`);
  }
});

test("generateKandinskyIcon: 単色のpalette（要素1個）を渡してもクラッシュしない（2個目の円は同色除外フィルタが空になるフォールバック）", () => {
  const singleColorPalette = ["#123456"];
  assert.doesNotThrow(() => {
    const { circles } = generateKandinskyIcon("single-color-palette-check", 24, 1.3, singleColorPalette);
    assert.equal(circles.length, 2);
    for (const c of circles) {
      assert.equal(c.color, "#123456");
    }
  });
});

test("generateKandinskyIcon: フル構図と同じseedを渡しても、内部で名前空間を分けているため独立した結果になる", () => {
  const seed = "shared-seed-namespacing-check";
  const icon = generateKandinskyIcon(seed);
  const field = generateKandinskyComposition(seed, W, H, "sm");
  const firstFieldCircle = field.shapes.find((s) => s.kind === "circle");
  // 完全に無関係であることの厳密証明ではないが、座標系も乱数消費順も違うため
  // 少なくとも同一の値にはならないはずという緩いチェック
  assert.notEqual(icon.circles[0].cx, firstFieldCircle.cx);
});
