import type { Expression, Hand, Outcome } from "../../../shared/janken";

export const HAND_EMOJI: Record<Hand, string> = {
  rock: "✊",
  scissors: "✌️",
  paper: "🖐️",
};

export const HAND_LABEL: Record<Hand, string> = {
  rock: "グー",
  scissors: "チョキ",
  paper: "パー",
};

export const EXPRESSION_EMOJI: Record<Expression, string> = {
  smile: "😄",
  surprised: "😲",
  angry: "😠",
  neutral: "😐",
};

export const EXPRESSION_LABEL: Record<Expression, string> = {
  smile: "笑顔",
  surprised: "驚いた顔",
  angry: "怒った顔",
  neutral: "その他",
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  win: "かち！",
  lose: "まけ…",
  draw: "あいこ",
};
