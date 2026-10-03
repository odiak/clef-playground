import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { isClefModel } from "../../shared/clef";
import {
  EXPRESSION_TO_HAND,
  HAND_EXPRESSIONS,
  type Expression,
  type JudgeErrorResponse,
  type JudgeResponse,
} from "../../shared/janken";
import { runClef } from "../lib/clef";

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

// 顔が写っていないとみなす閾値
const FACE_THRESHOLD = 0.5;
// 「その他」の確率がこれ以上のときだけ、はっきり無表情として判定できずにする
const NEUTRAL_THRESHOLD = 0.7;

export const janken = new Hono<{ Bindings: Env }>();

janken.post(
  "/judge",
  bodyLimit({
    maxSize: 2 * 1024 * 1024,
    onError: (c) =>
      c.json<JudgeErrorResponse>({ error: "画像が大きすぎます" }, 413),
  }),
  async (c) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    const { success } = await c.env.JANKEN_RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return c.json<JudgeErrorResponse>(
        { error: "リクエストが多すぎます。少し休憩してからもう一度どうぞ" },
        429,
      );
    }

    const body = await c.req.json<unknown>().catch(() => null);
    if (
      typeof body !== "object" ||
      body === null ||
      !("image" in body) ||
      typeof body.image !== "string" ||
      !IMAGE_DATA_URL.test(body.image) ||
      !("model" in body) ||
      !isClefModel(body.model)
    ) {
      return c.json<JudgeErrorResponse>({ error: "リクエストが不正です" }, 400);
    }
    const { image, model } = body;

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
      return c.json<JudgeErrorResponse>(
        { error: "判定に失敗しました。もう一度お試しください" },
        502,
      );
    }
  },
);
