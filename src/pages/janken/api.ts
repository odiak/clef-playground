import type { ClefModel } from "../../../shared/clef";
import type { JudgeRequest, JudgeResponse } from "../../../shared/janken";
import { postJson } from "../../lib/api";

export function judgeExpression(image: string, model: ClefModel): Promise<JudgeResponse> {
  return postJson<JudgeResponse>("/api/janken/judge", { image, model } satisfies JudgeRequest);
}
