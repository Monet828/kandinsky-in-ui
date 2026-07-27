/**
 * Kandinsky in UI — 公開API。
 *
 * 利用側はこのファイル経由でのみimportする。内部ファイル（generate.ts,
 * rng.ts, primitives.tsx 等）への直接importは避ける。将来これを独立した
 * パッケージとして切り出す際、この一覧がそのままパッケージのエクスポート面になる。
 *
 * 使い方の詳細・適用範囲の原則は README.md を参照。
 */

// 完成品コンポーネント（すぐ使える）
export { KandinskyField, type KandinskyFieldProps } from "./KandinskyField";
export { KandinskyIcon, type KandinskyIconProps } from "./KandinskyIcon";

// 単体プリミティブ（自分で構図を組みたい場合）
export {
  KandinskyCircle,
  KandinskyLine,
  KandinskyArc,
  KandinskyTriangle,
  KandinskyCheckerGrid,
  type KandinskyCircleProps,
  type KandinskyLineProps,
  type KandinskyArcProps,
  type KandinskyTriangleProps,
  type KandinskyCheckerGridProps,
} from "./primitives";

// 構図生成（Reactに依存しない。独自コンポーネントを組みたい場合の土台）
export {
  generateKandinskyComposition,
  generateKandinskyIcon,
  type KandinskyShape,
  type KandinskyComposition,
  type KandinskyIconCircle,
  type KandinskyIconComposition,
} from "./generate";

// 決定的乱数（独自の生成ロジックを書きたい場合）
export { createSeededRandom, mulberry32, hashSeed } from "./rng";

// トークン
export { KANDINSKY_PALETTE, KANDINSKY_INK, KANDINSKY_BACKGROUND, type KandinskyDensity } from "./tokens";
