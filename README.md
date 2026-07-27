# Kandinsky in UI

Wassily Kandinsky の幾何学抽象（円の重なり・細い直線/弧・鋭い三角形・市松格子）を
インターフェースの装飾言語に翻訳したデザインシステム。

> 特定の画家・遺族・団体との提携や公認を意味するものではない。あくまでオマージュ。

フレームワーク非依存のロジック（`generate.ts` / `rng.ts` / `tokens.ts`）と、
Reactアダプタ（`primitives.tsx` / `KandinskyField.tsx` / `KandinskyIcon.tsx`）で構成されている。
外部からは `index.ts` 経由でのみimportする前提。

## 相対importの拡張子について

このパッケージの相対importには明示的に `.js` 拡張子を付けている
（例: `from "./tokens.js"`。ソースは `.ts`/`.tsx`）。これは `tsc` でコンパイルした
`dist/` を素の Node.js の ESM `import` から解決できるようにするために必要
（拡張子なしだと `ERR_MODULE_NOT_FOUND` になる）。

**このコードを他のNext.js/Turbopackプロジェクトに埋め込みソースとして
コピーする場合、この拡張子は外すこと。** Turbopackは `.js` 拡張子のimportを
実際に存在する `.js` ファイルとして解決しようとし、ソースが `.ts`/`.tsx` しか
無い場合はビルドが壊れる（このリポジトリの姉妹版である Unit Console アプリの
`app/src/kandinsky/` で実際に踏んだ問題）。

## 状態

社内ツールのデザイン探索から生まれ、`app/src/kandinsky/` からこのリポジトリとして
切り出したばかりの段階。npm には未公開。使う場合は現状 `src/` を直接コピーするか、
このリポジトリをローカルビルド（`npm install && npm run build`）して `dist/` を参照する。

## 使い方

```tsx
import { KandinskyField, KandinskyIcon, KandinskyCircle } from "kandinsky-in-ui";
```

## 適用範囲の原則（重要）

**低密度な画面でのみ使う。高密度なデータ画面の背景には使わない。**

- ✅ ログイン・認証画面
- ✅ 空状態（「データがありません」等）
- ✅ 設定画面、オンボーディング
- ✅ 小さいブランドマーク（`KandinskyIcon`）
- ❌ タスク一覧・KPIダッシュボードなど、情報がほぼ隙間なく並ぶ画面の背景

理由: ログイン画面のような画面は中央のカード1枚を囲む広い余白があり、装飾が情報と
競合しない。高密度画面は余白がほとんど無いため、半透明の色面を敷くとコントラストと
視線誘導を確実に損なう。装飾的な生成アートは低密度画面でこそ機能し、高密度な
データ画面では機能しにくい、という原則に基づく判断（実機確認済み）。

## 決定論的な生成（seed）

すべての構図は文字列seedから `mulberry32` による決定論的な擬似乱数で生成される。
同じseed・同じ引数なら、リロードしても常に同じ見た目になる。

```tsx
<KandinskyField seed="unit-console-login" density="md" />
```

これにより「Unit名やUser IDをseedにする」だけで、対象ごとに一貫した見た目を
手作業のデザインなしに割り当てられる（対象が増減してもコードを変える必要がない）。
現状はログイン画面・ブランドマークとも固定seedで運用しているが、この余地は
最初から設計に織り込んである。

## コンポーネント

### `KandinskyField` — 生成された構図をまとめて描く完成品

装飾レイヤー用。実コンテンツの背後に `absolute inset-0 -z-10` 等で敷いて使う。

| prop | 型 | 既定値 | 説明 |
|---|---|---|---|
| `seed` | `string` | — | 構図を決定する文字列 |
| `density` | `"sm" \| "md" \| "lg"` | `"md"` | 形状の量 |
| `width` / `height` | `number` | `480` / `800` | 構図を組む座標系のサイズ（実際の表示サイズは`viewBox`+`preserveAspectRatio="xMidYMid slice"`で追従する） |
| `className` | `string` | — | 親の`<svg>`に渡す |
| `animated` | `boolean` | `true` | 円の呼吸・三角形の回転・線のドリフトを付けるか |
| `palette` | `readonly string[]` | house palette（`KANDINSKY_PALETTE`） | 円・輪っか・三角形に使う色の候補。`useMemo`の依存配列に含めているため、呼び出し側でインライン配列リテラルを毎回渡すと再生成のたびに再計算が走る。コンポーネント外の定数として定義するか呼び出し側でメモ化すること |

### `KandinskyIcon` — 小さいブランドマーク

`KandinskyField`のフル構図は16-24pxでは読めないため、重なる円2個だけの
「Circles in a Circle」に絞った専用ロジックを使う。

```tsx
<KandinskyIcon seed="unit-console-brand" size={20} />
```

| prop | 型 | 既定値 | 説明 |
|---|---|---|---|
| `seed` | `string` | — | 見た目を決定する文字列 |
| `size` | `number` | `20` | 表示サイズ(px) |
| `radiusScale` | `number` | `1.3` | 円の大きさの係数。複数seed・複数倍率を見比べて確定した値（1.6以上にすると円がviewBox端で欠け始める） |
| `palette` | `readonly string[]` | house palette | 円に使う色の候補 |

### プリミティブ（`primitives.tsx`）— 単体で使う形状

`KandinskyCircle` / `KandinskyLine` / `KandinskyArc` / `KandinskyRing` /
`KandinskyTriangle` / `KandinskyCheckerGrid`。すべて`<svg>`の中で使う（自身では
svgタグを作らない）。「カードの角に円を1つだけ添える」のような単発の使い方は
こちらを直接使う。

`KandinskyRing`（塗りつぶし無しの太い円=輪っか）はFigmaでの探索段階で使われていた
形状で、一度コードへの翻訳で漏れていたものを追加した。`KandinskyField`の構図には
density に関わらず常に1個含まれる。

これらを`KandinskyField`/`KandinskyIcon`を経由せず単体で使う場合、モーションと
ダークモード対応のCSSが自動では読み込まれないため、`<KandinskyStyles />`
（`styles.tsx`）を一度だけどこかに描画すること。

## パレットのカスタマイズ

`KandinskyField` / `KandinskyIcon` はどちらも `palette` propで色の候補を差し替えられる。
house palette（`KANDINSKY_PALETTE`）以外のブランドカラーを使いたい他プロジェクトでの
利用を想定した口。

```tsx
<KandinskyField seed="acme-corp" palette={["#0F62FE", "#FF832B", "#24A148"]} />
```

- 3色以上を推奨。色数が少ないほど同一色が隣接する見た目になりやすい。
- 単色（要素1個）のpaletteを渡しても壊れないようにはしてある（`KandinskyIcon`内部の
  「直前の円と異なる色を選ぶ」フィルタが空になった場合、元のpalette全体にフォールバックする）
  が、単色では「重なって混ざる」表現自体が成立しないため実質的には非推奨。
- `generateKandinskyComposition` / `generateKandinskyIcon` を直接呼ぶ場合も同じ引数がある。

## ダークモード対応

円の重なりは既定で `mix-blend-mode: multiply` に任せているが、multiplyは
暗い背景の上ではほぼ黒く潰れて見えなくなる（実機確認済み: ダークモードの
サイドバーでほぼ視認不可能だった）。`KandinskyStyles` が埋め込むCSSが、
`[data-theme="dark"]`（手動テーマ切り替えを持つアプリ向け）または
`prefers-color-scheme: dark`（それ以外のフォールバック）を検知して
自動的に `screen` に切り替える。個別の設定は不要。

## モーションの原則

- **動かすのは一部の要素だけ。** 全部を動かすと機械的で騒がしくなる。`KandinskyField`は
  円2つ・三角形1つ・線1つのみを対象にしている。
- **周期をずらす。** 同じ周期・同じ位相で複数要素が動くと不自然に揃って見えるため、
  2つ目の円は duration/delay をずらして非同期にしている。
- **`prefers-reduced-motion: no-preference` の中でのみ有効化する。** 動きを減らす設定の
  ユーザーには自動的に静止画のまま表示される。
- CSS `@keyframes` はFigmaの `use_figma`(`manualKeyframeTracks`)で先に動きを検証してから
  翻訳したもの。値を変える場合も、実機で確認してから反映すること
  （小さい要素の回転・ドリフトは肉眼だとほぼ気づかれないレベルになりがちなので、
  スクリーンショット比較や `getAnimations()` ではなく実際の見た目で判断する）。

## テスト

`generate.ts` / `rng.ts` は副作用のない純粋関数なので、`node:test`（Node標準、
追加依存なし）で自動テストしている。`npm test` でビルド後に実行される。
決定論性・color/shapeの妥当性（退化した三角形が無い、色の偏りが無い等）に加え、
**過去に実際踏んだ回帰（アイコンの16.4%が単色化していたバグ）を専用のテストとして
固定化している。** 生成ロジックのパラメータを変更する際は、必ず先にこのテストを
通してから反映すること。CIでもpush/PRごとに自動実行される（`.github/workflows/test.yml`）。

## 既知の注意点

- SVGの `Math.cos`/`Math.sin` はSSR(Node)とCSR(ブラウザ)でV8のビルドが異なると
  最後の桁がズレてハイドレーション不整合を起こすことがある（IEEE754はtranscendental
  関数のbit-exact一致を保証しない）。`KandinskyArc`は座標を小数点2桁に丸めることで
  対処済み。同様の計算を追加する場合は同じ丸めを行うこと。
- 円が3つ以上小さいサイズで重なると `mix-blend-mode: multiply` で黒く潰れる。
  アイコン用途では円を2つまでに抑えている。
