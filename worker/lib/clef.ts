import type { ClefModel } from "../../shared/clef";

// Clef は @cloudflare/workers-types の AiModels にまだ載っていないので、
// https://developers.cloudflare.com/workers-ai/models/clef/ のスキーマをもとに型を定義する

export type NoulQuestion = {
  type: "noul";
  instructions: string;
  criteria?: { true?: string; false?: string };
};

export type ChoiceQuestion<K extends string = string> = {
  type: "choice";
  instructions: string;
  criteria: Record<K, string | null>;
};

export type ScoreQuestion = {
  type: "score";
  instructions: string;
  criteria: string[];
};

export type ClefQuestion = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type NoulAnswer = {
  type: "noul";
  noul: number;
};

export type ChoiceAnswer<K extends string = string> = {
  type: "choice";
  choice: K;
  probabilities: Record<K, number>;
  confidence: number;
};

export type ScoreAnswer = {
  type: "score";
  score: number;
  legend: Record<string, unknown>;
  probabilities: Record<string, number>;
  confidence: number;
};

type AnswerFor<Q> = Q extends NoulQuestion
  ? NoulAnswer
  : Q extends ChoiceQuestion<infer K>
    ? ChoiceAnswer<K>
    : Q extends ScoreQuestion
      ? ScoreAnswer
      : never;

export type ClefRequest<Q extends Record<string, ClefQuestion>> = {
  model: ClefModel;
  state: unknown;
  questions: Q;
  /** base64 の data URL（PNG / JPEG / WebP、最大 4 枚） */
  images?: string[];
};

export type ClefResponse<Q extends Record<string, ClefQuestion>> = {
  model: string;
  answers: { [K in keyof Q]: AnswerFor<Q[K]> };
  usage: { input_tokens: number; output_tokens: number };
};

export async function runClef<const Q extends Record<string, ClefQuestion>>(
  ai: Ai,
  request: ClefRequest<Q>,
): Promise<{ response: ClefResponse<Q>; latencyMs: number }> {
  const startedAt = Date.now();
  const response = await ai.run(`@cf/cloudflare/${request.model}`, request);
  return {
    response: response as unknown as ClefResponse<Q>,
    latencyMs: Date.now() - startedAt,
  };
}
