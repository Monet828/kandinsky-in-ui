import { generateKandinskyIcon } from "./generate";
import { KandinskyCircle } from "./primitives";

export interface KandinskyIconProps {
  /** 同じseedなら常に同じ見た目になる。固定のブランドマークとして使うなら固定文字列を渡す */
  seed: string;
  size?: number;
  className?: string;
}

/**
 * サイドバー等の小さいブランドマーク用。KandinskyFieldのフル構図は
 * 16-24pxでは読めないため、重なる円だけの簡易版を使う。
 */
export function KandinskyIcon({ seed, size = 20, className }: KandinskyIconProps) {
  const { circles } = generateKandinskyIcon(seed, 24);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      {circles.map((c, i) => (
        <KandinskyCircle key={i} cx={c.cx} cy={c.cy} r={c.r} color={c.color} opacity={0.9} />
      ))}
    </svg>
  );
}
