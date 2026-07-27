/**
 * Kandinsky in UI — 共有CSS（モーション・ブレンドモードのダーク対応）。
 *
 * `KandinskyField` / `KandinskyIcon` は内部で自動的にこれを埋め込むので、
 * これらを使う分には意識しなくてよい。`primitives.tsx` の形状を単体で
 * 直接使う場合のみ、`<KandinskyStyles />` を1回どこかに置く必要がある。
 */
export const KANDINSKY_STYLES_CSS = `
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

  /*
   * mix-blend-mode: multiply は明るい背景でこそ機能する（重なった部分が
   * 暗く・濃くなることで色が混ざって見える）。暗い背景の上では逆効果で、
   * 円がほぼ黒く潰れて見えなくなる（実機確認済み: ダークモードのサイドバーで
   * ほぼ視認不可能だった）。暗い背景では screen（重なった部分が明るくなる）に
   * 切り替える。
   *
   * [data-theme="dark"] は本アプリ（Unit Console）の手動テーマ切り替えの
   * 慣習。prefers-color-scheme は、そのようなアプリ側の慣習を持たない
   * 他プロジェクトで使われた場合のためのフォールバック。
   */
  .kandinsky-blend { mix-blend-mode: multiply; }
  [data-theme="dark"] .kandinsky-blend { mix-blend-mode: screen; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme]) .kandinsky-blend { mix-blend-mode: screen; }
  }
`;

/** 上記CSSを埋め込むコンポーネント。`<svg>` の中で使う。 */
export function KandinskyStyles() {
  return <style>{KANDINSKY_STYLES_CSS}</style>;
}
