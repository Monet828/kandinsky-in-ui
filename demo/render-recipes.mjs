/**
 * 合成コンポーネント（KandinskyEmptyState / KandinskyPanel）を実際に描画して
 * `demo/recipes.html` を書き出す、目視確認用のハーネス。
 *
 * 自動テスト（test/ssr.test.mjs）はマークアップの契約しか見ておらず、
 * 「装飾が濃すぎないか」「文字が読めるか」は判定できない。ここで書き出したHTMLを
 * ブラウザで開いて、明るい面・紙の面・暗い面の3列を見比べて判断する。
 *
 * 使い方: npm run demo:recipes && open demo/recipes.html
 */

import { writeFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  KandinskyEmptyState,
  KandinskyPanel,
  KANDINSKY_STYLES_CSS,
  KANDINSKY_BACKGROUND,
} from "../dist/index.js";

const fakeButton = (label) =>
  h(
    "button",
    {
      style: {
        font: "inherit",
        fontSize: 12.5,
        padding: "7px 14px",
        borderRadius: 7,
        border: "1px solid color-mix(in srgb, currentColor 25%, transparent)",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
      },
    },
    label,
  );

const samples = [
  h(KandinskyEmptyState, {
    key: "a",
    seed: "tasks-empty",
    title: "タスクがまだありません",
    description:
      "「Slack取込（自動 8:30/18:00）」または「AIタスク抽出（議事録から）」、「手動でタスク追加」から積み上がっていきます",
    action: fakeButton("手動でタスク追加"),
  }),
  h(KandinskyEmptyState, {
    key: "b",
    seed: "memo-empty",
    title: "まだメモがありません",
    description: "最初の一枚を貼ってみよう",
    action: fakeButton("メモを追加"),
  }),
  h(KandinskyEmptyState, {
    key: "c",
    seed: "no-mark-empty",
    title: "マークなし・説明なしの最小形",
    mark: false,
    bordered: true,
  }),
  h(
    KandinskyPanel,
    { key: "d", seed: "settings-header", density: "md", padding: "28px 24px", radius: 12 },
    h("div", { style: { fontSize: 15, fontWeight: 600, marginBottom: 6 } }, "KandinskyPanel — 設定画面の見出し面"),
    h(
      "div",
      { style: { fontSize: 12.5, lineHeight: 1.7, opacity: 0.62, maxWidth: 480 } },
      "任意の中身を載せられる土台。position/overflow/マスクの決まりごとを毎回書かずに済む。背景色は既定でtransparentなので、置いた面の色をそのまま使う。",
    ),
  ),
  h(
    KandinskyPanel,
    {
      key: "e",
      seed: "settings-header",
      density: "md",
      padding: "28px 24px",
      radius: 12,
      fadeCenter: false,
      decorationOpacity: 0.5,
    },
    h("div", { style: { fontSize: 15, fontWeight: 600, marginBottom: 6 } }, "fadeCenter={false} — 中央を抜かない場合"),
    h(
      "div",
      { style: { fontSize: 12.5, lineHeight: 1.7, opacity: 0.62, maxWidth: 480 } },
      "文字の真下に色面が来るため可読性が落ちる。既定でtrueにしている理由の確認用。",
    ),
  ),
];

function column({ label, theme, bg, fg }) {
  const inner = samples
    .map((el) => `<div style="margin-bottom:20px">${renderToStaticMarkup(el)}</div>`)
    .join("");
  return `<div ${theme ? `data-theme="${theme}"` : ""} style="flex:1;background:${bg};color:${fg};padding:24px">
    <div style="font:600 12px ui-monospace,Menlo,monospace;opacity:.55;margin-bottom:14px">${label}</div>
    ${inner}
  </div>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,-apple-system,'Hiragino Sans',sans-serif;display:flex;align-items:flex-start}
  ${KANDINSKY_STYLES_CSS}
</style></head><body>
${column({ label: 'light host (background: #FFFFFF)', theme: null, bg: "#FFFFFF", fg: "#14110F" })}
${column({ label: 'paper host (background: ' + KANDINSKY_BACKGROUND + ")", theme: null, bg: KANDINSKY_BACKGROUND, fg: "#14110F" })}
${column({ label: 'dark host ([data-theme="dark"], background: #1C1917)', theme: "dark", bg: "#1C1917", fg: "#F5F5F4" })}
</body></html>`;

const out = new URL("./recipes.html", import.meta.url);
writeFileSync(out, html);
console.log("wrote", out.pathname);

// SSRが2回とも同じ文字列を返すか（ハイドレーション安定性の最低条件）
const once = renderToStaticMarkup(samples[0]);
const twice = renderToStaticMarkup(samples[0]);
console.log("deterministic SSR:", once === twice);
