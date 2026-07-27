/**
 * Kandinsky in UI — design tokens.
 *
 * Wassily Kandinsky への homage としての幾何学抽象言語（円の重なり・
 * 細い直線/弧・鋭い三角形・市松格子）を実装するためのトークン。
 * 特定の画家・遺族・団体との提携や公認を意味するものではない。
 *
 * このファイルはフレームワークに依存しない。将来この一式を
 * 独立したパッケージとして切り出す際、ここがそのままトークン層になる。
 */

export const KANDINSKY_PALETTE = [
  "#1D3F8F", // ultramarine
  "#E8592A", // vermilion
  "#F0B429", // mustard
  "#2F8F4E", // leaf green
  "#D6336C", // raspberry
  "#2D8484", // teal
] as const;

export const KANDINSKY_INK = "#14110F";
export const KANDINSKY_BACKGROUND = "#F7F1E3";

export type KandinskyDensity = "sm" | "md" | "lg";
