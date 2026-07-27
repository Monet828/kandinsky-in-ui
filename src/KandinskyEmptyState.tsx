"use client";

import type { CSSProperties, ReactNode } from "react";
import { KandinskyIcon } from "./KandinskyIcon.js";
import { KandinskyPanel } from "./KandinskyPanel.js";
import type { KandinskyDensity } from "./tokens.js";

export interface KandinskyEmptyStateProps {
  /** 同じseedなら常に同じ装飾になる。画面ごとに固定文字列を渡す想定 */
  seed: string;
  title: string;
  description?: string;
  /**
   * 「タスクを追加」等のボタンを置く枠。
   * ボタンはこのデザインシステムでは提供しない（アプリ側のボタンをそのまま渡す）。
   * 装飾の言語だけを担当し、操作部品の見た目には踏み込まないという線引き。
   */
  action?: ReactNode;
  /**
   * 見出しの上に置くマーク。既定はseedから生成した`KandinskyIcon`。
   * `false`で非表示、ReactNodeで任意のアイコンに差し替え。
   */
  mark?: ReactNode | false;
  density?: KandinskyDensity;
  palette?: readonly string[];
  animated?: boolean;
  /** 「空の枠」であることを示す破線の枠を出すか。既定true */
  bordered?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * 「まだ1件も無い」状態のための完成品。
 *
 * 【使う場面を間違えないこと】
 * - ✅ 初回状態・まだデータが一件も無い状態（例:「タスクがまだありません」）。
 *   ユーザーがこれから何をすればいいかを説明する余白があり、装飾が機能する。
 * - ❌ 絞り込み・検索の結果0件（例:「該当するアカウントがありません」）。
 *   こちらは一覧の中に一瞬出ては消える表示で、入力のたびに装飾が点滅して邪魔になる。
 *   素の一行テキストのままにしておくこと。
 *
 * 文字色は`currentColor`を継承するため、ライト・ダークどちらのホストでも成立する。
 */
export function KandinskyEmptyState({
  seed,
  title,
  description,
  action,
  mark,
  density = "sm",
  palette,
  animated = true,
  bordered = true,
  className,
  style,
}: KandinskyEmptyStateProps) {
  const resolvedMark = mark === false ? null : (mark ?? <KandinskyIcon seed={seed} size={28} palette={palette} />);

  return (
    <KandinskyPanel
      seed={seed}
      density={density}
      palette={palette}
      animated={animated}
      className={className}
      style={{
        // 破線の枠は「空の枠」の合図。currentColorをそのまま使うと線が強すぎるため
        // color-mixで薄めている（テーマの文字色に追従しつつ、主張しすぎない）。
        ...(bordered
          ? { border: "1px dashed", borderColor: "color-mix(in srgb, currentColor 22%, transparent)" }
          : null),
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 8,
          padding: "40px 24px",
        }}
      >
        {resolvedMark}
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{title}</div>
        {description ? (
          // 説明文は横に伸びすぎると読みにくいので上限を設ける
          <div style={{ fontSize: 12.5, lineHeight: 1.7, opacity: 0.62, maxWidth: 420 }}>{description}</div>
        ) : null}
        {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
      </div>
    </KandinskyPanel>
  );
}
