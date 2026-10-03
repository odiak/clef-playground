import type { ClefModel } from "../../../shared/clef";
import type { JudgeErrorResponse, JudgeRequest, JudgeResponse } from "../../../shared/janken";

export async function judgeExpression(image: string, model: ClefModel): Promise<JudgeResponse> {
  let response: Response;
  try {
    response = await fetch("/api/janken/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image, model } satisfies JudgeRequest),
    });
  } catch {
    throw new Error("通信に失敗しました。電波の良いところでもう一度どうぞ");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as JudgeErrorResponse | null;
    throw new Error(body?.error ?? "判定に失敗しました");
  }
  return response.json();
}
