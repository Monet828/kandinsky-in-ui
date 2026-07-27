"use client";

import type { CSSProperties, ReactNode } from "react";
import { KANDINSKY_INK } from "./tokens.js";

/**
 * Kandinsky in UI — 単体で使える形状プリミティブ。
 *
 * `KandinskyField`（生成された構図をまとめて描く）とは別に、
 * 「特定のカードの角に円を1つだけ添える」「見出しの横に三角形を1つ置く」
 * といった単発の使い方ができるように、各形状を独立したコンポーネントとして
 * 公開している。すべて `<svg>` の中で使う前提（自身ではsvgタグを作らない）。
 */

interface CommonProps {
  className?: string;
  style?: CSSProperties;
}

function joinClassNames(...parts: (string | undefined | false)[]): string | undefined {
  const joined = parts.filter(Boolean).join(" ");
  return joined || undefined;
}

export interface KandinskyCircleProps extends CommonProps {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity?: number;
  /**
   * 他の形状との重なりを mix-blend-mode に任せるか。既定で true。
   * 重なった部分の色計算をブラウザに任せることで、3枚以上重なっても
   * 予測しづらい濁った色にならないようにする。
   *
   * 明るい背景では multiply、暗い背景（`[data-theme="dark"]` または
   * `prefers-color-scheme: dark`）では screen に自動で切り替わる
   * （multiplyは暗い背景では円がほぼ黒く潰れて見えなくなるため）。
   * この切り替えは `./styles` の CSS が定義しているクラスに依存するので、
   * `KandinskyField` / `KandinskyIcon` を経由せずこのプリミティブを
   * 単体で使う場合は `<KandinskyStyles />` を一度だけ描画すること。
   */
  blend?: boolean;
}

export function KandinskyCircle({ cx, cy, r, color, opacity = 1, blend = true, className, style }: KandinskyCircleProps) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      opacity={opacity}
      className={joinClassNames(blend ? "kandinsky-blend" : undefined, className)}
      style={style}
    />
  );
}

export interface KandinskyLineProps extends CommonProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  strokeWidth?: number;
}

export function KandinskyLine({
  x1,
  y1,
  x2,
  y2,
  color = KANDINSKY_INK,
  strokeWidth = 1.5,
  className,
  style,
}: KandinskyLineProps) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} className={className} style={style} />
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface KandinskyArcProps extends CommonProps {
  cx: number;
  cy: number;
  r: number;
  /** ラジアン */
  startAngle: number;
  endAngle: number;
  color?: string;
  strokeWidth?: number;
}

export function KandinskyArc({
  cx,
  cy,
  r,
  startAngle,
  endAngle,
  color = KANDINSKY_INK,
  strokeWidth = 1.5,
  className,
  style,
}: KandinskyArcProps) {
  // Math.cos/sin はIEEE754で bit-exact 一致が保証されていない（+-*/ と sqrt のみ保証対象）。
  // SSR(Node)とCSR(ブラウザ)でV8のビルドが異なるため、丸めないと最後の桁がズレて
  // ハイドレーション不整合になる。
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const x1 = round2(cx + r * Math.cos(startAngle));
  const y1 = round2(cy + r * Math.sin(startAngle));
  const x2 = round2(cx + r * Math.cos(endAngle));
  const y2 = round2(cy + r * Math.sin(endAngle));
  return (
    <path
      d={`M ${x1} ${y1} A ${round2(r)} ${round2(r)} 0 ${large} 1 ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}

export interface KandinskyRingProps extends CommonProps {
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  color: string;
}

/** 輪っか（塗りつぶし無しの太い円）。Figmaでの探索段階で使い、コードへの翻訳で一度落ちていた形状。 */
export function KandinskyRing({ cx, cy, r, strokeWidth, color, className, style }: KandinskyRingProps) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}

export interface KandinskyTriangleProps extends CommonProps {
  points: [number, number][];
  color: string;
}

export function KandinskyTriangle({ points, color, className, style }: KandinskyTriangleProps) {
  // 回転アニメーションの軸を図形自身の重心にする（指定しないとSVGビューポート左上を軸に回ってしまう）。
  const cx = (points[0][0] + points[1][0] + points[2][0]) / 3;
  const cy = (points[0][1] + points[1][1] + points[2][1]) / 3;
  return (
    <polygon
      points={points.map((p) => p.join(",")).join(" ")}
      fill={color}
      className={className}
      style={{ transformOrigin: `${cx}px ${cy}px`, ...style }}
    />
  );
}

export interface KandinskyCheckerGridProps extends CommonProps {
  x: number;
  y: number;
  cell: number;
  cols: number;
  rows: number;
  rotation?: number;
  color?: string;
}

export function KandinskyCheckerGrid({
  x,
  y,
  cell,
  cols,
  rows,
  rotation = 0,
  color = KANDINSKY_INK,
  className,
  style,
}: KandinskyCheckerGridProps) {
  const squares: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        squares.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill={color} />);
      }
    }
  }
  const originX = (cols * cell) / 2;
  const originY = (rows * cell) / 2;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotation} ${originX} ${originY})`}
      className={className}
      style={style}
    >
      {squares}
    </g>
  );
}
