import type { ClefModel } from "./clef";

export const EXPRESSIONS = ["smile", "sad", "angry", "neutral"] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const HANDS = ["rock", "scissors", "paper"] as const;
export type Hand = (typeof HANDS)[number];

/** 表情 → 手。neutral は判定不能として扱う */
export const EXPRESSION_TO_HAND: Record<Expression, Hand | null> = {
  smile: "paper",
  sad: "scissors",
  angry: "rock",
  neutral: null,
};

export type JudgeRequest = {
  /** data:image/jpeg;base64,... */
  image: string;
  model: ClefModel;
};

export type JudgeResponse = {
  model: ClefModel;
  /** Workers AI の呼び出しにかかった時間 */
  latencyMs: number;
  /** 顔が写っている確率 */
  faceProbability: number;
  expression: Expression;
  probabilities: Record<Expression, number>;
  confidence: number;
  /** 判定不能のときは null */
  hand: Hand | null;
};

export type JudgeErrorResponse = {
  error: string;
};

export type Outcome = "win" | "lose" | "draw";

const BEATS: Record<Hand, Hand> = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
};

export function decideOutcome(player: Hand, computer: Hand): Outcome {
  if (player === computer) return "draw";
  return BEATS[player] === computer ? "win" : "lose";
}
