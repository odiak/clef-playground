import { Hono } from "hono";
import type { ErrorResponse } from "../../shared/api";
import { DRAW_TOPICS, type DrawJudgeResponse, findTopic } from "../../shared/draw";
import { runClef } from "../lib/clef";
import { imageBodyLimit, imageRequest, type ImageRequestEnv } from "../lib/imageRequest";

// お題の絵に見える確率がこれ以上なら合格
const PASS_THRESHOLD = 0.5;
// 「何の絵に見えるか」の選択肢に、お題のほかに混ぜるお題の数
const DECOY_COUNT = 7;

export const draw = new Hono<ImageRequestEnv>();

draw.use(imageBodyLimit, imageRequest((env) => env.DRAW_RATE_LIMITER));

function pickDecoys(topicId: string) {
  const others = DRAW_TOPICS.filter((topic) => topic.id !== topicId);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return others.slice(0, DECOY_COUNT);
}

draw.post("/judge", async (c) => {
  const image = c.get("image");
  const model = c.get("model");

  // 画像とモデルは imageRequest で検証済み。お題は用意したものだけを受け付ける
  const body = await c.req.json<{ topic?: unknown }>();
  const topic = typeof body.topic === "string" ? findTopic(body.topic) : undefined;
  if (!topic) {
    return c.json<ErrorResponse>({ error: "invalid_request" }, 400);
  }
  const candidates = [topic, ...pickDecoys(topic.id)];

  try {
    const { response, latencyMs } = await runClef(c.env.AI, {
      model,
      images: [image],
      // お題を state に書くと「何の絵に見えるか」の答えがお題に引っぱられるので、ここには書かない
      state:
        "A quick black-and-white doodle drawn with a finger or a mouse in a drawing game. The player had a short time to draw a simple object so that others can tell what it is.",
      questions: {
        match: {
          type: "noul",
          instructions: `Is this a drawing of ${topic.prompt}?`,
          criteria: {
            true: `A drawing that most people would recognize as ${topic.prompt}, even if it is simple, rough, or childlike`,
            false:
              "A drawing of something else, random scribbles, an almost empty canvas, or written words or letters instead of a picture",
          },
        },
        guess: {
          type: "choice",
          instructions: "What is this drawing most likely of?",
          criteria: {
            ...Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate.prompt])),
            other: "Something else, or not recognizable",
          },
        },
      },
    });

    const probability = response.answers.match.noul;
    return c.json<DrawJudgeResponse>({
      model,
      latencyMs,
      probability,
      threshold: PASS_THRESHOLD,
      passed: probability >= PASS_THRESHOLD,
      guesses: response.answers.guess.probabilities,
    });
  } catch (error) {
    console.error("Clef request failed", error);
    return c.json<ErrorResponse>({ error: "clef_failed" }, 502);
  }
});
