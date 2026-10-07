import { Hono } from "hono";
import type { ErrorResponse } from "../../shared/api";
import {
  EXPRESSION_TO_HAND,
  HAND_EXPRESSIONS,
  type Expression,
  type JudgeResponse,
} from "../../shared/janken";
import { runClef } from "../lib/clef";
import { imageBodyLimit, imageRequest, type ImageRequestEnv } from "../lib/imageRequest";

// 顔が写っていないとみなす閾値
const FACE_THRESHOLD = 0.5;
// 「その他」の確率がこれ以上のときだけ、はっきり無表情として判定できずにする
const NEUTRAL_THRESHOLD = 0.7;

export const janken = new Hono<ImageRequestEnv>();

janken.use(imageBodyLimit, imageRequest((env) => env.JANKEN_RATE_LIMITER));

janken.post("/judge", async (c) => {
  const image = c.get("image");
  const model = c.get("model");

  try {
    const { response, latencyMs } = await runClef(c.env.AI, {
      model,
      images: [image],
      state:
        "A selfie taken with a smartphone front camera. The person is playing rock-paper-scissors by making a facial expression instead of a hand gesture.",
      questions: {
        face: {
          type: "noul",
          instructions: "Is a human face clearly visible in the image?",
        },
        // 3 つの表情は、見た目の特徴が互いに重ならないように書き分ける
        expression: {
          type: "choice",
          instructions:
            "Which facial expression is the person making? The expressions are often exaggerated or playful.",
          criteria: {
            smile: "Smiling or laughing: mouth corners turned up and cheeks raised, possibly showing teeth",
            surprised: "Surprised: mouth dropped open in a round 'O' shape, eyebrows raised high, eyes wide open",
            angry: "Angry: eyebrows pulled down and together, glaring or narrowed eyes, clenched teeth or tightly pressed lips",
            neutral: "Neutral or no clear expression",
          },
        },
      },
    });

    const { face, expression } = response.answers;
    const faceProbability = face.noul;

    // 「その他」がわずかに上回っただけで判定できずにならないよう、
    // はっきり無表情なとき以外は 3 つの表情の中で一番確率が高いものを採用する
    const { probabilities } = expression;
    const decided: Expression =
      probabilities.neutral >= NEUTRAL_THRESHOLD
        ? "neutral"
        : HAND_EXPRESSIONS.reduce((best, e) =>
            probabilities[e] > probabilities[best] ? e : best,
          );
    const hand =
      faceProbability >= FACE_THRESHOLD ? EXPRESSION_TO_HAND[decided] : null;

    return c.json<JudgeResponse>({
      model,
      latencyMs,
      faceProbability,
      expression: decided,
      probabilities: expression.probabilities,
      confidence: expression.confidence,
      hand,
    });
  } catch (error) {
    console.error("Clef request failed", error);
    return c.json<ErrorResponse>({ error: "clef_failed" }, 502);
  }
});
