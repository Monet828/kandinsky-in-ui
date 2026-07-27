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
export { KandinskyField, type KandinskyFieldProps } from "./KandinskyField.js";
export { KandinskyIcon, type KandinskyIconProps } from "./KandinskyIcon.js";
export { KandinskyPanel, type KandinskyPanelProps } from "./KandinskyPanel.js";
export { KandinskyEmptyState, type KandinskyEmptyStateProps } from "./KandinskyEmptyState.js";

// 単体プリミティブ（自分で構図を組みたい場合）
export {
  KandinskyCircle,
  KandinskyLine,
  KandinskyArc,
  KandinskyRing,
  KandinskyTriangle,
  KandinskyCheckerGrid,
  type KandinskyCircleProps,
  type KandinskyLineProps,
  type KandinskyArcProps,
  type KandinskyRingProps,
  type KandinskyTriangleProps,
  type KandinskyCheckerGridProps,
} from "./primitives.js";

// 共有CSS（モーション・ブレンドモードのダーク対応）。primitivesを単体で使う場合に必要
export { KandinskyStyles, KANDINSKY_STYLES_CSS } from "./styles.js";

// 構図生成（Reactに依存しない。独自コンポーネントを組みたい場合の土台）
export {
  generateKandinskyComposition,
  generateKandinskyIcon,
  type KandinskyShape,
  type KandinskyComposition,
  type KandinskyIconCircle,
  type KandinskyIconComposition,
} from "./generate.js";

// 決定論的乱数（独自の生成ロジックを書きたい場合）
export { createSeededRandom, mulberry32, hashSeed } from "./rng.js";

// トークン
export { KANDINSKY_PALETTE, KANDINSKY_INK, KANDINSKY_BACKGROUND, type KandinskyDensity } from "./tokens.js";
