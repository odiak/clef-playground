import { Hono } from "hono";
import type { ErrorResponse } from "../../shared/api";
import { AVATAR_QUESTIONS, type AnalyzeResponse, type AvatarAnswers } from "../../shared/avatar";
import { type ClefQuestion, runClef } from "../lib/clef";
import { imageBodyLimit, imageRequest, type ImageRequestEnv } from "../lib/imageRequest";

// 顔が写っていないとみなす閾値
const FACE_THRESHOLD = 0.5;

// 画面表示用のラベルを除いて、Clef に渡す形の質問にする
const QUESTIONS: Record<string, ClefQuestion> = {
  face: { type: "noul", instructions: "Is exactly one human face clearly visible in the image?" },
  ...Object.fromEntries(
    Object.entries(AVATAR_QUESTIONS).map(([id, question]): [string, ClefQuestion] =>
      question.type === "choice"
        ? [
            id,
            {
              type: "choice",
              instructions: question.instructions,
              criteria: Object.fromEntries(
                Object.entries(question.options).map(([option, { description }]) => [option, description]),
              ),
            },
          ]
        : [id, { type: "noul", instructions: question.instructions }],
    ),
  ),
};

export const avatar = new Hono<ImageRequestEnv>();

avatar.use(imageBodyLimit, imageRequest((env) => env.AVATAR_RATE_LIMITER));

avatar.post("/analyze", async (c) => {
  const image = c.get("image");
  const model = c.get("model");

  try {
    const { response, latencyMs } = await runClef(c.env.AI, {
      model,
      images: [image],
      state:
        "A selfie taken with a smartphone front camera. Describe the person's appearance so that a cartoon avatar resembling them can be drawn.",
      questions: QUESTIONS,
    });

    const { face, ...answers } = response.answers;
    if (face.type !== "noul" || face.noul < FACE_THRESHOLD) {
      return c.json<ErrorResponse>({ error: "顔が見つかりませんでした。顔が枠に収まるように撮り直してください" }, 422);
    }

    return c.json<AnalyzeResponse>({
      model,
      latencyMs,
      answers: answers as unknown as AvatarAnswers,
    });
  } catch (error) {
    console.error("Clef request failed", error);
    return c.json<ErrorResponse>({ error: "判定に失敗しました。もう一度お試しください" }, 502);
  }
});
