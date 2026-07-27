import { generateKandinskyIcon } from "./generate.js";
import { KandinskyCircle } from "./primitives.js";
import { KandinskyStyles } from "./styles.js";
import { KANDINSKY_PALETTE } from "./tokens.js";

export interface KandinskyIconProps {
  /** 同じseedなら常に同じ見た目になる。固定のブランドマークとして使うなら固定文字列を渡す */
  seed: string;
  size?: number;
  className?: string;
  /** 円の大きさの係数。既定は1.3（複数seed・複数倍率を見比べて確定） */
  radiusScale?: number;
  /** 円に使う色の候補。既定は house palette。ブランドカラーへの差し替え用 */
  palette?: readonly string[];
}

/**
 * サイドバー等の小さいブランドマーク用。KandinskyFieldのフル構図は
 * 16-24pxでは読めないため、重なる円だけの簡易版を使う。
 */
export function KandinskyIcon({
  seed,
  size = 20,
  className,
  radiusScale = 1.3,
  palette = KANDINSKY_PALETTE,
}: KandinskyIconProps) {
  const { circles } = generateKandinskyIcon(seed, 24, radiusScale, palette);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <KandinskyStyles />
      {circles.map((c, i) => (
        <KandinskyCircle key={i} cx={c.cx} cy={c.cy} r={c.r} color={c.color} opacity={0.9} />
      ))}
    </svg>
  );
}
