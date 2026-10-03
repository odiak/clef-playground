import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { isClefModel } from "../../shared/clef";
import {
  EXPRESSION_TO_HAND,
  type JudgeErrorResponse,
  type JudgeResponse,
} from "../../shared/janken";
import { runClef } from "../lib/clef";

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

// 顔が写っていないとみなす閾値
const FACE_THRESHOLD = 0.5;

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
          // 悲しい顔は作りにくく、眉に力が入ると怒った顔と判定されがちなので、
          // 悲しい顔に特有の特徴を挙げて、迷ったら悲しい顔に寄せるよう指示する
          expression: {
            type: "choice",
            instructions:
              "Which facial expression is the person making? Sad faces are hard to act, so they are often subtle or mixed with tension in the brows. If the face could be either sad or angry, choose sad unless the person is clearly glaring.",
            criteria: {
              smile: "Smiling or laughing: raised mouth corners, visible teeth, or cheerful eyes",
              sad: "Sad: downturned mouth corners, a pouting or trembling lower lip, drooping eyes or eyelids, inner eyebrows raised or slanted, or a crying look. Even a subtle or exaggerated sad face counts",
              angry: "Angry: clearly glaring eyes with eyebrows pulled down hard into a V shape, plus bared or clenched teeth or tightly pressed lips",
              neutral: "Neutral or no clear expression",
            },
          },
        },
      });

      const { face, expression } = response.answers;
      const faceProbability = face.noul;
      const hand =
        faceProbability >= FACE_THRESHOLD
          ? EXPRESSION_TO_HAND[expression.choice]
          : null;

      return c.json<JudgeResponse>({
        model,
        latencyMs,
        faceProbability,
        expression: expression.choice,
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
