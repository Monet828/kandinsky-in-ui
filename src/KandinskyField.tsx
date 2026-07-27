"use client";

import { useMemo, type CSSProperties } from "react";
import { generateKandinskyComposition } from "./generate";
import { KandinskyCircle, KandinskyLine, KandinskyArc, KandinskyTriangle, KandinskyCheckerGrid } from "./primitives";
import type { KandinskyDensity } from "./tokens";

export interface KandinskyFieldProps {
  /** 同じseedなら常に同じ構図になる。UnitのIDや名前を渡すとUnitごとの見た目になる */
  seed: string;
  density?: KandinskyDensity;
  width?: number;
  height?: number;
  className?: string;
  /**
   * 円の呼吸・三角形の回転・線のドリフトを付けるか。
   * Figmaのuse_figma(manualKeyframeTracks)で動きを検証した結果を
   * CSS @keyframes に翻訳したもの。デフォルトで有効。
   */
  animated?: boolean;
}

/**
 * Kandinsky in UI の生成構図をまとめて描く、装飾レイヤー用の完成品コンポーネント。
 * 実コンテンツの背後に `absolute inset-0 -z-10` 等で敷いて使う想定。
 *
 * 個々の形状を単発で使いたい場合は `./primitives` を直接使う。
 *
 * 【適用範囲についての注意】このシステムは低密度な画面
 * （ログイン・空状態・設定画面など）向け。タスク一覧やKPIのような
 * 高密度なデータ画面の背景には使わないこと（余白が無いと情報の
 * コントラストと視線誘導を損なう。実機確認済みの判断）。
 */
export function KandinskyField({
  seed,
  density = "md",
  width = 480,
  height = 800,
  className,
  animated = true,
}: KandinskyFieldProps) {
  const { shapes } = useMemo(
    () => generateKandinskyComposition(seed, width, height, density),
    [seed, width, height, density],
  );

  // 動かす対象は「最初の円2つ」「三角形」「最初の線」に絞る。
  // 全部の円が同じ周期・位相で動くと機械的に見えるので、2つ目の円は
  // duration/delayをずらして呼吸のタイミングを意図的に非同期にする。
  let circlesSeen = 0;
  let lineSeen = false;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      // "none" は円をコンテナの縦横比に合わせて楕円に引き伸ばしてしまう。
      // "slice" は object-fit:cover と同様に縦横比を保ったまま拡大・トリミングするので、
      // どんなコンテナサイズでも円は円のまま保たれる。
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      {animated && (
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .kandinsky-breathe { animation: kandinsky-breathe-kf 3.5s ease-in-out infinite; }
            .kandinsky-breathe-2 { animation: kandinsky-breathe-kf 4.5s ease-in-out infinite; animation-delay: -1.8s; }
            .kandinsky-sway { animation: kandinsky-sway-kf 4.5s ease-in-out infinite; }
            .kandinsky-drift { animation: kandinsky-drift-kf 5s ease-in-out infinite; }
          }
          @keyframes kandinsky-breathe-kf {
            0%, 100% { opacity: var(--kandinsky-peak-opacity, 0.82); }
            50% { opacity: calc(var(--kandinsky-peak-opacity, 0.82) * 0.45); }
          }
          @keyframes kandinsky-sway-kf {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(24deg); }
          }
          @keyframes kandinsky-drift-kf {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(18px, -11px); }
          }
        `}</style>
      )}
      {shapes.map((shape, i) => {
        let motionClass: string | undefined;
        if (animated) {
          if (shape.kind === "circle" && circlesSeen < 2) {
            motionClass = circlesSeen === 0 ? "kandinsky-breathe" : "kandinsky-breathe-2";
            circlesSeen++;
          } else if (shape.kind === "triangle") {
            motionClass = "kandinsky-sway";
          } else if (shape.kind === "line" && !lineSeen) {
            motionClass = "kandinsky-drift";
            lineSeen = true;
          }
        }

        switch (shape.kind) {
          case "circle":
            return (
              <KandinskyCircle
                key={i}
                cx={shape.cx}
                cy={shape.cy}
                r={shape.r}
                color={shape.color}
                opacity={motionClass ? undefined : shape.opacity}
                className={motionClass}
                style={motionClass ? ({ ["--kandinsky-peak-opacity" as string]: shape.opacity } as CSSProperties) : undefined}
              />
            );
          case "line":
            return (
              <KandinskyLine key={i} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} className={motionClass} />
            );
          case "arc":
            return <KandinskyArc key={i} cx={shape.cx} cy={shape.cy} r={shape.r} startAngle={shape.startAngle} endAngle={shape.endAngle} />;
          case "triangle":
            return <KandinskyTriangle key={i} points={shape.points} color={shape.color} className={motionClass} />;
          case "checker":
            return (
              <KandinskyCheckerGrid
                key={i}
                x={shape.x}
                y={shape.y}
                cell={shape.cell}
                cols={shape.cols}
                rows={shape.rows}
                rotation={shape.rotation}
              />
            );
          default:
            return null;
        }
      })}
    </svg>
  );
}
