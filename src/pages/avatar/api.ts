import type { AnalyzeRequest, AnalyzeResponse } from "../../../shared/avatar";
import type { ClefModel } from "../../../shared/clef";
import { postJson } from "../../lib/api";

export function analyzeFace(image: string, model: ClefModel): Promise<AnalyzeResponse> {
  return postJson<AnalyzeResponse>("/api/avatar/analyze", { image, model } satisfies AnalyzeRequest);
}
