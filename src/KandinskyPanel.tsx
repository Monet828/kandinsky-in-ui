"use client";

import type { CSSProperties, ReactNode } from "react";
import { KandinskyField } from "./KandinskyField.js";
import type { KandinskyDensity } from "./tokens.js";

export interface KandinskyPanelProps {
  /** 同じseedなら常に同じ装飾になる */
  seed: string;
  density?: KandinskyDensity;
  palette?: readonly string[];
  animated?: boolean;
  /**
   * 装飾の不透明度。既定は0.75。
   * `KandinskyField`を単体で敷く場合（ログイン画面の全面背景など）より弱めているのは、
   * このコンポーネントは文字が上に載る前提のため。
   */
  decorationOpacity?: number;
  /**
   * 中央（コンテンツが載る場所）の装飾をマスクで抜くか。既定true。
   * 抜かないと文字の真下に色面が来て可読性が落ちる。
   */
  fadeCenter?: boolean;
  /**
   * 構図を組む座標系のサイズ。既定は 520x280 の横長。
   *
   * `KandinskyField`の既定(480x800)は縦長のログイン画面向けで、これを横長で短い面に
   * `preserveAspectRatio="slice"` で載せると、巨大な円のごく一部だけが引き伸ばされて
   * 見える（霞のような薄い色面になり幾何形が読めない）。面の縦横比に近い値で
   * 生成することで、形が形として見えるようにしている。
   */
  width?: number;
  height?: number;
  radius?: number | string;
  /**
   * 面の背景色。**既定は transparent**（敷かれた側の背景をそのまま使う）。
   * 紙色などを固定すると、ダークモードのアプリに置いたとき明るい面が浮いてしまうため。
   * 意図して紙の面にしたい場合のみ `KANDINSKY_BACKGROUND` 等を渡す。
   */
  background?: string;
  padding?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * 装飾を背面に敷いた「面」を作る合成コンポーネント。
 * 空状態・設定画面・オンボーディングのような低密度な面で、
 * position/overflow/z-index/マスクの決まりごとを毎回書かずに済むようにするための土台。
 *
 * 文字色は指定しない（`currentColor`を前提にした作りにしてある）ため、
 * ライト・ダークどちらのホストに置いても、また任意のブランド色の上でも成立する。
 *
 * 【適用範囲】低密度な面のみ。タスク一覧やKPIのような高密度な画面には使わない
 * （README「適用範囲の原則」を参照）。
 */
export function KandinskyPanel({
  seed,
  density = "md",
  palette,
  animated = true,
  decorationOpacity = 0.75,
  fadeCenter = true,
  width = 520,
  height = 280,
  radius = 10,
  background = "transparent",
  padding,
  className,
  style,
  children,
}: KandinskyPanelProps) {
  // 中央を抜くマスク。alphaが0の領域は装飾が描かれない。
  // 抜きを広げすぎると装飾が縁のわずかな残骸だけになるため、中央26%までを抜いて
  // 68%で完全に出る配分にしている（実機で見比べて決めた値）。
  const mask = "radial-gradient(105% 90% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,1) 68%)";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radius,
        background,
        padding,
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: decorationOpacity,
          pointerEvents: "none",
          ...(fadeCenter ? { maskImage: mask, WebkitMaskImage: mask } : null),
        }}
      >
        <KandinskyField
          seed={seed}
          density={density}
          palette={palette}
          animated={animated}
          width={width}
          height={height}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
      {/* 装飾より前面に出すため position を持たせる（z-indexは使わず重ね順に任せる） */}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
