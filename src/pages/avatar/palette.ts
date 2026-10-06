import type { OptionId } from "../../../shared/avatar";

// アバターで使う色。形のバリエーション（geometry*.ts）から共通で使う

export const INK = "#2b2b33";
export const WHITE = "#ffffff";

export const SKIN: Record<OptionId<"skin_tone">, string> = {
  light: "#fde0c8",
  medium: "#f2c09a",
  tan: "#d29a6c",
  deep: "#8f5b3e",
};

export const HAIR: Record<OptionId<"hair_color">, string> = {
  black: "#2a2730",
  dark_brown: "#4b3022",
  brown: "#8b5a34",
  blonde: "#ecc66c",
  gray: "#c4c4ca",
  red: "#c0512f",
  colorful: "#e264a8",
};

export const CLOTHES: Record<OptionId<"clothing_color">, string> = {
  black: "#34343c",
  white: "#ffffff",
  gray: "#9b9ba3",
  navy: "#2f3e6b",
  blue: "#5b9be0",
  green: "#4caf6e",
  red: "#e0483e",
  orange: "#f38020",
  yellow: "#f7c948",
  pink: "#f39ac0",
  purple: "#8e63c9",
  brown: "#b08a64",
};

export const IRIS: Record<OptionId<"eye_color">, string> = {
  dark_brown: "#3b2a22",
  light_brown: "#8a5a2b",
  blue: "#3f7fd6",
  green: "#3c9a5f",
  gray: "#7c8591",
};

export const MOUTH_INSIDE = "#8b2c35";
export const LIP = "#e07a86";
export const BLUSH = "#ff7f8a";
export const FRECKLE = "#8a5a3b";
export const GOLD = "#f7c948";
