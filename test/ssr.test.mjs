/**
 * Reactコンポーネント層のスモークテスト。
 *
 * `generate.ts`/`rng.ts` は純粋関数として別途テストしているが、コンポーネント層は
 * これまで自動テストが無かった。ここでは react-dom/server で実際に描画し、
 * 「同じseedなら同じマークアップになる」（ハイドレーション不整合の最低条件）と、
 * propsの分岐が実際に出力へ効いていることを確認する。
 *
 * ブラウザのレイアウトや見た目の良し悪しは検証できない。そこは実機で見ること。
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { KandinskyEmptyState, KandinskyPanel, KandinskyField, KandinskyIcon } from "../dist/index.js";

const countSvgs = (html) => (html.match(/<svg/g) || []).length;

test("KandinskyEmptyState: title/descriptionが出力に含まれる", () => {
  const html = renderToStaticMarkup(
    h(KandinskyEmptyState, { seed: "s", title: "タスクがまだありません", description: "説明文です" }),
  );
  assert.ok(html.includes("タスクがまだありません"));
  assert.ok(html.includes("説明文です"));
});

test("KandinskyEmptyState: 同じseed・同じpropsなら常に同じマークアップ（ハイドレーション安定性の最低条件）", () => {
  const make = () => renderToStaticMarkup(h(KandinskyEmptyState, { seed: "stable", title: "t" }));
  assert.equal(make(), make());
});

test("KandinskyEmptyState: seedが違えばマークアップも変わる", () => {
  const a = renderToStaticMarkup(h(KandinskyEmptyState, { seed: "seed-a", title: "t" }));
  const b = renderToStaticMarkup(h(KandinskyEmptyState, { seed: "seed-b", title: "t" }));
  assert.notEqual(a, b);
});

test("KandinskyEmptyState: 既定ではマーク(KandinskyIcon)が描かれ、mark={false}で消える", () => {
  const withMark = renderToStaticMarkup(h(KandinskyEmptyState, { seed: "s", title: "t" }));
  const withoutMark = renderToStaticMarkup(h(KandinskyEmptyState, { seed: "s", title: "t", mark: false }));
  // 背面の装飾(KandinskyField)とマーク(KandinskyIcon)で2つ、マーク無しなら1つ
  assert.equal(countSvgs(withMark), 2);
  assert.equal(countSvgs(withoutMark), 1);
});

test("KandinskyEmptyState: bordered={false}で破線の枠が消える", () => {
  const bordered = renderToStaticMarkup(h(KandinskyEmptyState, { seed: "s", title: "t" }));
  const plain = renderToStaticMarkup(h(KandinskyEmptyState, { seed: "s", title: "t", bordered: false }));
  assert.ok(bordered.includes("dashed"));
  assert.ok(!plain.includes("dashed"));
});

test("KandinskyEmptyState: actionに渡した要素がそのまま描かれる（ボタンの見た目には踏み込まない設計）", () => {
  const html = renderToStaticMarkup(
    h(KandinskyEmptyState, { seed: "s", title: "t", action: h("button", null, "追加する") }),
  );
  assert.ok(html.includes("<button>追加する</button>"));
});

test("KandinskyPanel: childrenが描かれ、装飾レイヤーはaria-hiddenで読み上げから外れている", () => {
  const html = renderToStaticMarkup(h(KandinskyPanel, { seed: "s" }, h("p", null, "中身")));
  assert.ok(html.includes("<p>中身</p>"));
  assert.ok(html.includes("aria-hidden"));
});

test("KandinskyPanel: fadeCenterの既定はtrue（マスクが出力される）、falseで消える", () => {
  const faded = renderToStaticMarkup(h(KandinskyPanel, { seed: "s" }, "x"));
  const notFaded = renderToStaticMarkup(h(KandinskyPanel, { seed: "s", fadeCenter: false }, "x"));
  assert.ok(faded.includes("mask-image"));
  assert.ok(!notFaded.includes("mask-image"));
});

test("KandinskyPanel: 構図の既定サイズは横長(520x280)。縦長のままだと横長の面で形が読めなくなる回帰の防止", () => {
  const html = renderToStaticMarkup(h(KandinskyPanel, { seed: "s" }, "x"));
  assert.ok(html.includes('viewBox="0 0 520 280"'), "expected the panel to generate a landscape composition");
});

test("KandinskyField: styleが<svg>に渡る（合成コンポーネントがサイズを指定するための口）", () => {
  const html = renderToStaticMarkup(h(KandinskyField, { seed: "s", style: { width: "100%" } }));
  assert.ok(html.includes("width:100%"));
});

test("KandinskyIcon: 単体で描画でき、同じseedなら同じ出力", () => {
  const make = () => renderToStaticMarkup(h(KandinskyIcon, { seed: "brand", size: 20 }));
  const html = make();
  assert.ok(html.includes("<svg"));
  assert.equal(make(), html);
});
