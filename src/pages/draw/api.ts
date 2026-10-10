import type { ClefModel } from "../../../shared/clef";
import type { DrawJudgeRequest, DrawJudgeResponse } from "../../../shared/draw";
import { postJson } from "../../lib/api";

export function judgeDrawing(image: string, model: ClefModel, topic: string): Promise<DrawJudgeResponse> {
  return postJson<DrawJudgeResponse>("/api/draw/judge", { image, model, topic } satisfies DrawJudgeRequest);
}
