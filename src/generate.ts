/**
 * Kandinsky in UI — 構図ジェネレータ。
 *
 * 円の重なり・直線・弧・輪っか・三角形・市松格子という語彙を、seed文字列から
 * 決定論的に生成する。同じ seed なら常に同じ構図になる。
 *
 * これにより「Unit名をseedにする」だけで、Unitごとに一貫した見た目の
 * 装飾を手作業のデザインなしに割り当てられる（Unitが増減しても壊れない）。
 *
 * React に依存しない純粋関数として実装している。KandinskyField / KandinskyIcon
 * はこれを描画するReact向けの薄いアダプタという位置づけ。
 */

import { createSeededRandom } from "./rng.js";
import { KANDINSKY_PALETTE, KANDINSKY_INK, type KandinskyDensity } from "./tokens.js";

export type KandinskyShape =
  | { kind: "circle"; cx: number; cy: number; r: number; color: string; opacity: number }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "arc"; cx: number; cy: number; r: number; startAngle: number; endAngle: number }
  | { kind: "ring"; cx: number; cy: number; r: number; strokeWidth: number; color: string }
  | { kind: "triangle"; points: [number, number][]; color: string }
  | { kind: "checker"; x: number; y: number; cell: number; cols: number; rows: number; rotation: number };

export interface KandinskyComposition {
  shapes: KandinskyShape[];
}

const DENSITY_COUNTS: Record<KandinskyDensity, { circles: number; lines: number; checker: boolean }> = {
  sm: { circles: 3, lines: 1, checker: false },
  md: { circles: 5, lines: 2, checker: true },
  lg: { circles: 7, lines: 4, checker: true },
};

/**
 * 幅width×高さheightの領域に収まる構図を生成する。
 * seedが同じなら、width/height/density/paletteが同じ限り常に同じ構図を返す。
 *
 * @param palette 円・輪っか・三角形に使う色の候補。既定は house palette
 *   （`KANDINSKY_PALETTE`）。他プロジェクトが自社のブランドカラーに
 *   差し替えたい場合はここに配列を渡す（3色以上を推奨。少なすぎると
 *   単色化のリスクが上がる）。
 */
export function generateKandinskyComposition(
  seed: string,
  width: number,
  height: number,
  density: KandinskyDensity = "md",
  palette: readonly string[] = KANDINSKY_PALETTE,
): KandinskyComposition {
  const rand = createSeededRandom(seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const shapes: KandinskyShape[] = [];
  const counts = DENSITY_COUNTS[density];

  for (let i = 0; i < counts.circles; i++) {
    const r = width * 0.06 + rand() * width * 0.15;
    shapes.push({
      kind: "circle",
      cx: rand() * width,
      cy: rand() * height,
      r,
      color: pick(palette),
      opacity: 0.75 + rand() * 0.15,
    });
  }

  for (let i = 0; i < counts.lines; i++) {
    shapes.push({
      kind: "line",
      x1: rand() * width,
      y1: rand() * height,
      x2: rand() * width,
      y2: rand() * height,
    });
  }

  const arcR = height * 0.08 + rand() * height * 0.08;
  const arcStart = rand() * Math.PI;
  shapes.push({
    kind: "arc",
    cx: rand() * width,
    cy: rand() * height,
    r: arcR,
    startAngle: arcStart,
    endAngle: arcStart + Math.PI * (0.4 + rand() * 0.4),
  });

  // 輪っか（Figmaでの探索段階で使い、コードへの翻訳で一度落ちていた形状）。
  // 太さは半径の0.3程度（Figma上の参考実装の比率に合わせている）。
  // arc/triangleと同様、density に関わらず常に1個。
  const ringR = width * 0.08 + rand() * width * 0.1;
  shapes.push({
    kind: "ring",
    cx: rand() * width,
    cy: rand() * height,
    r: ringR,
    strokeWidth: ringR * 0.3,
    color: pick(palette),
  });

  const tx = rand() * width;
  const ty = rand() * height;
  const s = width * 0.05 + rand() * width * 0.06;
  shapes.push({
    kind: "triangle",
    points: [
      [tx, ty],
      [tx + s, ty + s * 0.3],
      [tx - s * 0.3, ty + s],
    ],
    color: pick([...palette, KANDINSKY_INK]),
  });

  if (counts.checker) {
    const cell = Math.max(10, width * 0.03);
    const cols = 4;
    const rows = 4;
    shapes.push({
      kind: "checker",
      x: rand() * Math.max(1, width - cell * cols),
      y: rand() * Math.max(1, height - cell * rows),
      cell,
      cols,
      rows,
      rotation: (rand() - 0.5) * 20,
    });
  }

  return { shapes };
}

// ============================================================
// アイコン用（小さいサイズで使う簡易版）
// ============================================================
// フル構図(円・線・弧・輪っか・三角形・市松)は16-24pxでは読めないため、
// 重なる円2個だけの「Circles in a Circle」に絞った専用ロジック。
// 円3個+multiplyだと小さいサイズでは重なりすぎて黒く潰れるため、
// 2個に絞り位置も広めに散らして「重なって混ざる部分」が見える程度にする。

export interface KandinskyIconCircle {
  cx: number;
  cy: number;
  r: number;
  color: string;
}

export interface KandinskyIconComposition {
  circles: KandinskyIconCircle[];
}

export function generateKandinskyIcon(
  seed: string,
  size = 24,
  /**
   * 半径の基準値に掛ける係数。既定は1.3（複数seed・複数倍率の見比べで確定した値。
   * 1.6以上にすると円の中心位置の範囲が現状のままでは枠から欠けはじめるため、
   * その場合は cx/cy の範囲も同時に狭める調整が必要）。
   */
  radiusScale = 1.3,
  /** 円に使う色の候補。既定は house palette（`KANDINSKY_PALETTE`） */
  palette: readonly string[] = KANDINSKY_PALETTE,
): KandinskyIconComposition {
  // フル構図と同じseedを渡された時に見た目が連動しすぎないよう、接尾辞で名前空間を分ける。
  const rand = createSeededRandom(`${seed}:icon`);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

  // 円が2個しかないため、重複ありで色を選ぶと1/6の確率で同色になり単色の塊に見えてしまう
  // （500seedの監査で実測16.4%が単色化することを確認）。2個目は1個目と異なる色のみから選ぶ。
  const circles: KandinskyIconCircle[] = [];
  let previousColor: string | null = null;
  for (let i = 0; i < 2; i++) {
    const r = (size * 0.24 + rand() * size * 0.1) * radiusScale;
    const cx = size * 0.22 + rand() * size * 0.56;
    const cy = size * 0.22 + rand() * size * 0.56;
    const candidates: readonly string[] = previousColor === null ? palette : palette.filter((c) => c !== previousColor);
    const color: string = pick(candidates.length > 0 ? candidates : palette);
    previousColor = color;
    circles.push({ cx, cy, r, color });
  }
  return { circles };
}
