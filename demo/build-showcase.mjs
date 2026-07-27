/**
 * README冒頭に埋め込むショーケースSVGを、実際の生成ロジックから書き出す。
 *
 * 手描きのサンプル画像はロジックを変えた瞬間に実装と食い違うため、
 * dist/ の generateKandinskyComposition / generateKandinskyIcon を通して描く。
 * 図形→SVG要素の変換は primitives.tsx と同じ規則（arcの2桁丸めを含む）にしてある。
 *
 * 使い方: npm run build && node demo/build-showcase.mjs
 */

import { writeFileSync } from "node:fs";
import {
  generateKandinskyComposition,
  generateKandinskyIcon,
  KANDINSKY_PALETTE,
  KANDINSKY_INK,
  KANDINSKY_BACKGROUND,
} from "../dist/index.js";

const CANVAS_W = 960;
const PAD = 24;
const CANVAS_BG = "#EFE7D3"; // パネル(#F7F1E3)より僅かに濃く、パネルが面として立つように
const FONT = "ui-sans-serif, -apple-system, 'Helvetica Neue', 'Hiragino Sans', sans-serif";

function round2(n) {
  return Math.round(n * 100) / 100;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 図形1つをSVG文字列にする。primitives.tsx の各コンポーネントと同じ出力規則。 */
function shapeToSvg(shape, blendMode) {
  switch (shape.kind) {
    case "circle":
      return `<circle cx="${round2(shape.cx)}" cy="${round2(shape.cy)}" r="${round2(shape.r)}" fill="${shape.color}" opacity="${round2(shape.opacity)}" style="mix-blend-mode:${blendMode}"/>`;
    case "line":
      return `<line x1="${round2(shape.x1)}" y1="${round2(shape.y1)}" x2="${round2(shape.x2)}" y2="${round2(shape.y2)}" stroke="${KANDINSKY_INK}" stroke-width="1.5"/>`;
    case "arc": {
      const { cx, cy, r, startAngle, endAngle } = shape;
      const large = endAngle - startAngle > Math.PI ? 1 : 0;
      const x1 = round2(cx + r * Math.cos(startAngle));
      const y1 = round2(cy + r * Math.sin(startAngle));
      const x2 = round2(cx + r * Math.cos(endAngle));
      const y2 = round2(cy + r * Math.sin(endAngle));
      return `<path d="M ${x1} ${y1} A ${round2(r)} ${round2(r)} 0 ${large} 1 ${x2} ${y2}" fill="none" stroke="${KANDINSKY_INK}" stroke-width="1.5"/>`;
    }
    case "ring":
      return `<circle cx="${round2(shape.cx)}" cy="${round2(shape.cy)}" r="${round2(shape.r)}" fill="none" stroke="${shape.color}" stroke-width="${round2(shape.strokeWidth)}"/>`;
    case "triangle":
      return `<polygon points="${shape.points.map((p) => `${round2(p[0])},${round2(p[1])}`).join(" ")}" fill="${shape.color}"/>`;
    case "checker": {
      const squares = [];
      for (let r = 0; r < shape.rows; r++) {
        for (let c = 0; c < shape.cols; c++) {
          if ((r + c) % 2 === 0) {
            squares.push(
              `<rect x="${round2(c * shape.cell)}" y="${round2(r * shape.cell)}" width="${round2(shape.cell)}" height="${round2(shape.cell)}" fill="${KANDINSKY_INK}"/>`,
            );
          }
        }
      }
      const ox = (shape.cols * shape.cell) / 2;
      const oy = (shape.rows * shape.cell) / 2;
      return `<g transform="translate(${round2(shape.x)} ${round2(shape.y)}) rotate(${round2(shape.rotation)} ${round2(ox)} ${round2(oy)})">${squares.join("")}</g>`;
    }
    default:
      return "";
  }
}

let clipCounter = 0;
const defs = [];

/** KandinskyField 相当のパネル1枚。パネル枠でクリップする（実物のsvg viewBoxと同じ効果）。 */
function fieldPanel({ x, y, w, h, seed, density, palette, dark }) {
  const clipId = `clip-${clipCounter++}`;
  defs.push(`<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/></clipPath>`);
  const { shapes } = generateKandinskyComposition(seed, w, h, density, palette ?? KANDINSKY_PALETTE);
  // ダークモードでは multiply が黒く潰れるため screen に切り替わる（styles.tsx のCSSと同じ挙動）
  const blendMode = dark ? "screen" : "multiply";
  const bg = dark ? "#1C1917" : KANDINSKY_BACKGROUND;
  const inner = shapes.map((s) => shapeToSvg(s, blendMode)).join("");
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${bg}"/>`,
    `<g clip-path="url(#${clipId})"><g transform="translate(${x} ${y})">${inner}</g></g>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="${KANDINSKY_INK}" stroke-opacity="0.14"/>`,
  ].join("");
}

/** KandinskyIcon 相当。24x24の座標系を size に拡大して描く。 */
function iconMark({ x, y, size, seed, palette }) {
  const { circles } = generateKandinskyIcon(seed, 24, 1.3, palette ?? KANDINSKY_PALETTE);
  const scale = size / 24;
  const clipId = `clip-${clipCounter++}`;
  defs.push(`<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${size}" height="${size}"/></clipPath>`);
  const inner = circles
    .map(
      (c) =>
        `<circle cx="${round2(c.cx)}" cy="${round2(c.cy)}" r="${round2(c.r)}" fill="${c.color}" opacity="0.9" style="mix-blend-mode:multiply"/>`,
    )
    .join("");
  return `<g clip-path="url(#${clipId})"><g transform="translate(${x} ${y}) scale(${round2(scale)})">${inner}</g></g>`;
}

function sectionLabel(x, y, text) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="15" font-weight="600" fill="${KANDINSKY_INK}">${esc(text)}</text>`;
}

function caption(x, y, text) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="11.5" fill="${KANDINSKY_INK}" fill-opacity="0.62">${esc(text)}</text>`;
}

function monoCaption(x, y, text) {
  return `<text x="${x}" y="${y}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="${KANDINSKY_INK}" fill-opacity="0.72">${esc(text)}</text>`;
}

// ============================================================
// レイアウト（yカーソルを進めながら積む。手計算の座標ズレを避けるため）
// ============================================================
const body = [];
let cy = PAD + 20;

// 図形の半径は生成時のwidthから導かれるため、パネル幅を揃えないと
// セクション間で図形の大きさが揃わない（幅444で描くと円がパネルを埋めて塊に見える）。
// そのため全パネルを同じ 288x196 の3カラムに統一している。
const panelW = 288;
const panelH = 196;
const gap = 24;
const colX = (i) => PAD + i * (panelW + gap);

// --- 1. KandinskyField: seed と density ---
body.push(sectionLabel(PAD, cy, "KandinskyField — seedごとに違う装飾レイヤーが決まる"));
cy += 14;

const fields = [
  { seed: "unit-console-login", density: "md", note: 'seed="unit-console-login" density="md"' },
  { seed: "acme-onboarding", density: "lg", note: 'seed="acme-onboarding" density="lg"' },
  { seed: "empty-state", density: "sm", note: 'seed="empty-state" density="sm"' },
];
fields.forEach((f, i) => {
  const x = colX(i);
  body.push(fieldPanel({ x, y: cy, w: panelW, h: panelH, seed: f.seed, density: f.density }));
  body.push(monoCaption(x, cy + panelH + 16, f.note));
});
cy += panelH + 16 + 28;

// --- 2. KandinskyIcon ---
body.push(sectionLabel(PAD, cy, "KandinskyIcon — 小さいブランドマーク（重なる円2個）"));
cy += 16;

// タイルは円の枠(viewBox)と同じ大きさにする。余白を付けるとviewBoxでの
// 切り取り線がタイル内側に浮いて描画バグのように見えてしまう。
const ICON_BIG = 56;
const iconSeeds = ["unit-a", "unit-b", "unit-c", "unit-d", "unit-e", "unit-f"];
const iconGap = 14;
iconSeeds.forEach((seed, i) => {
  const x = PAD + i * (ICON_BIG + iconGap);
  body.push(`<rect x="${x}" y="${cy}" width="${ICON_BIG}" height="${ICON_BIG}" rx="5" fill="${KANDINSKY_BACKGROUND}"/>`);
  body.push(iconMark({ x, y: cy, size: ICON_BIG, seed }));
});
// 実寸(20px/16px)も並べて、小さいサイズでも成立することを示す
const realX = PAD + iconSeeds.length * (ICON_BIG + iconGap) + 20;
body.push(`<rect x="${realX}" y="${cy}" width="20" height="20" rx="3" fill="${KANDINSKY_BACKGROUND}"/>`);
body.push(iconMark({ x: realX, y: cy, size: 20, seed: "unit-a" }));
body.push(`<rect x="${realX + 28}" y="${cy + 2}" width="16" height="16" rx="3" fill="${KANDINSKY_BACKGROUND}"/>`);
body.push(iconMark({ x: realX + 28, y: cy + 2, size: 16, seed: "unit-b" }));
body.push(caption(realX, cy + 38, "実寸 20 / 16px"));
body.push(monoCaption(PAD, cy + ICON_BIG + 22, "seedを変えるだけでUnitごと・Userごとのマークが決まる（手作業のデザイン不要）"));
cy += ICON_BIG + 22 + 28;

// --- 3. palette 差し替え ---
body.push(sectionLabel(PAD, cy, "palette — 自社のブランドカラーに差し替えられる"));
cy += 14;

// paletteだけの効果を見せるため、3枚すべて同じseed（=同じ構図）にしている。
const PALETTE_DEMO_SEED = "brand-b";
const customPalettes = [
  ["#0F62FE", "#FF832B", "#24A148", "#8A3FFC"],
  ["#2A9D8F", "#E76F51", "#E9C46A", "#264653"],
  ["#7C3AED", "#DB2777", "#0891B2", "#FACC15"],
];
customPalettes.forEach((palette, i) => {
  const x = colX(i);
  body.push(fieldPanel({ x, y: cy, w: panelW, h: panelH, seed: PALETTE_DEMO_SEED, density: "md", palette }));
  palette.forEach((c, j) => {
    body.push(`<rect x="${x + j * 20}" y="${cy + panelH + 10}" width="15" height="15" rx="3" fill="${c}"/>`);
  });
});
body.push(
  monoCaption(PAD, cy + panelH + 42, 'palette={["#0F62FE", "#FF832B", "#24A148", "#8A3FFC"]}'),
  caption(PAD + 362, cy + panelH + 42, "3枚すべて同じseed（=同じ構図）で、paletteだけを差し替えたもの"),
);
cy += panelH + 42 + 28;

// --- 4. ダークモード ---
body.push(sectionLabel(PAD, cy, "ダークモード — 重なりの合成が multiply から screen に自動で切り替わる"));
cy += 14;

body.push(fieldPanel({ x: colX(0), y: cy, w: panelW, h: panelH, seed: "unit-console-login", density: "md" }));
body.push(monoCaption(colX(0), cy + panelH + 16, "light: mix-blend-mode: multiply"));
body.push(
  fieldPanel({ x: colX(1), y: cy, w: panelW, h: panelH, seed: "unit-console-login", density: "md", dark: true }),
);
body.push(monoCaption(colX(1), cy + panelH + 16, "dark: mix-blend-mode: screen"));
body.push(
  caption(colX(2), cy + 18, "同じseed・同じ構図でも、multiplyは暗い背景の上"),
  caption(colX(2), cy + 34, "ではほぼ黒く潰れて見えなくなる。KandinskyStyles"),
  caption(colX(2), cy + 50, "が [data-theme=\"dark\"] または prefers-color-scheme"),
  caption(colX(2), cy + 66, "を検知して screen に切り替えるため、利用側での"),
  caption(colX(2), cy + 82, "個別の設定は不要。"),
);
cy += panelH + 16 + PAD;

const CANVAS_H = Math.round(cy);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" role="img" aria-label="Kandinsky in UI のショーケース: seedごとの装飾レイヤー、ブランドマーク、パレット差し替え、ダークモード対応">
<defs>${defs.join("")}</defs>
<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="${CANVAS_BG}"/>
${body.join("\n")}
</svg>
`;

const out = new URL("./showcase.svg", import.meta.url);
writeFileSync(out, svg);
console.log(`wrote ${out.pathname} (${CANVAS_W}x${CANVAS_H}, ${(svg.length / 1024).toFixed(1)}KB)`);
