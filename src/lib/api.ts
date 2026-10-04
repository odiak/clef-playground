import type { ErrorResponse } from "../../shared/api";

export async function postJson<Res>(url: string, body: unknown): Promise<Res> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("通信に失敗しました。電波の良いところでもう一度どうぞ");
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ErrorResponse | null;
    throw new Error(error?.error ?? "判定に失敗しました");
  }
  return response.json();
}
