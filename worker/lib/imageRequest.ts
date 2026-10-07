import { bodyLimit } from "hono/body-limit";
import { createMiddleware } from "hono/factory";
import type { ErrorResponse } from "../../shared/api";
import { type ClefModel, isClefModel } from "../../shared/clef";

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

/** 画像と Clef のモデルを受け取る API の Hono の型 */
export type ImageRequestEnv = {
  Bindings: Env;
  Variables: { image: string; model: ClefModel };
};

export const imageBodyLimit = bodyLimit({
  maxSize: 2 * 1024 * 1024,
  onError: (c) => c.json<ErrorResponse>({ error: "image_too_large" }, 413),
});

/**
 * Clef の呼び出しは課金されるので IP ごとに回数を制限し、
 * `{ image, model }` の形のリクエストを検証して Variables に入れる
 */
export function imageRequest(getRateLimiter: (env: Env) => RateLimit) {
  return createMiddleware<ImageRequestEnv>(async (c, next) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    const { success } = await getRateLimiter(c.env).limit({ key: ip });
    if (!success) {
      return c.json<ErrorResponse>({ error: "rate_limited" }, 429);
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
      return c.json<ErrorResponse>({ error: "invalid_request" }, 400);
    }

    c.set("image", body.image);
    c.set("model", body.model);
    await next();
  });
}
