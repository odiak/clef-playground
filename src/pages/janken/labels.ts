import type { Localized } from "../../../shared/i18n";
import type { Expression, Hand, Outcome } from "../../../shared/janken";

export const HAND_EMOJI: Record<Hand, string> = {
  rock: "✊",
  scissors: "✌️",
  paper: "🖐️",
};

export const HAND_LABEL: Record<Hand, Localized> = {
  rock: { ja: "グー", en: "Rock" },
  scissors: { ja: "チョキ", en: "Scissors" },
  paper: { ja: "パー", en: "Paper" },
};

export const EXPRESSION_EMOJI: Record<Expression, string> = {
  smile: "😄",
  surprised: "😲",
  angry: "😠",
  neutral: "😐",
};

export const EXPRESSION_LABEL: Record<Expression, Localized> = {
  smile: { ja: "笑顔", en: "Smile" },
  surprised: { ja: "驚いた顔", en: "Surprised" },
  angry: { ja: "怒った顔", en: "Angry" },
  neutral: { ja: "その他", en: "Other" },
};

export const OUTCOME_LABEL: Record<Outcome, Localized> = {
  win: { ja: "かち！", en: "You win!" },
  lose: { ja: "まけ…", en: "You lose…" },
  draw: { ja: "あいこ", en: "Draw" },
};
