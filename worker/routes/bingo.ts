import { Hono } from "hono";
import type { ErrorResponse } from "../../shared/api";
import { type BingoJudgeResponse, findItem, findTheme, MAX_JUDGE_ITEMS } from "../../shared/bingo";
import { type NoulAnswer, type NoulQuestion, runClef } from "../lib/clef";
import { imageBodyLimit, imageRequest, type ImageRequestEnv } from "../lib/imageRequest";

// 1 枚の写真にたくさんのお題を聞くので、誤って穴が空かないように高めにする
const ITEM_THRESHOLD = 0.6;
// 実物を撮った写真とみなす閾値
const REAL_THRESHOLD = 0.5;

export const bingo = new Hono<ImageRequestEnv>();

bingo.use(imageBodyLimit, imageRequest((env) => env.BINGO_RATE_LIMITER));

bingo.post("/judge", async (c) => {
  const image = c.get("image");
  const model = c.get("model");

  // 画像とモデルは imageRequest で検証済み。お題はテーマに含まれるものだけを受け付ける
  const body = await c.req.json<{ theme?: unknown; items?: unknown }>();
  const theme = typeof body.theme === "string" ? findTheme(body.theme) : undefined;
  const ids = body.items;
  if (
    !theme ||
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAX_JUDGE_ITEMS ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => typeof id === "string" && findItem(theme, id))
  ) {
    return c.json<ErrorResponse>({ error: "invalid_request" }, 400);
  }
  const items = (ids as string[]).map((id) => findItem(theme, id)!);

  try {
    const { response, latencyMs } = await runClef(c.env.AI, {
      model,
      images: [image],
      state:
        "A photo taken with a smartphone camera while playing a scavenger-hunt bingo game. The player looks for everyday objects around them and photographs them to fill the squares of a bingo card.",
      questions: {
        // 画像検索した写真を画面に映して撮るような抜け道を防ぐ
        real: {
          type: "noul",
          instructions:
            "Was this photo taken of real physical objects in front of the camera, rather than of a picture shown on a screen or printed on paper?",
          criteria: {
            true: "Real, physical objects photographed directly",
            false:
              "The photo mainly shows an image displayed on a screen (phone, tablet, computer monitor, TV), or a printed photo or illustration (magazine, poster, book page)",
          },
        },
        ...Object.fromEntries(
          items.map((item): [string, NoulQuestion] => [
            `item_${item.id}`,
            { type: "noul", instructions: `Does the photo clearly show ${item.prompt}?` },
          ]),
        ),
      },
    });

    // お題の質問は動的に作るので、答えの型は質問の ID から決まらない
    const answers = response.answers as Record<string, NoulAnswer | undefined>;
    const realProbability = answers.real?.noul ?? 0;
    const isReal = realProbability >= REAL_THRESHOLD;
    const probabilities = Object.fromEntries(
      items.map((item) => [item.id, answers[`item_${item.id}`]?.noul ?? 0]),
    );
    const found = isReal ? items.filter((item) => probabilities[item.id] >= ITEM_THRESHOLD).map((item) => item.id) : [];

    return c.json<BingoJudgeResponse>({ model, latencyMs, realProbability, isReal, probabilities, found });
  } catch (error) {
    console.error("Clef request failed", error);
    return c.json<ErrorResponse>({ error: "clef_failed" }, 502);
  }
});
