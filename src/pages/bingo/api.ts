import type { BingoJudgeRequest, BingoJudgeResponse } from "../../../shared/bingo";
import type { ClefModel } from "../../../shared/clef";
import { postJson } from "../../lib/api";

export function judgeBingo(image: string, model: ClefModel, theme: string, items: string[]): Promise<BingoJudgeResponse> {
  return postJson<BingoJudgeResponse>("/api/bingo/judge", { image, model, theme, items } satisfies BingoJudgeRequest);
}
