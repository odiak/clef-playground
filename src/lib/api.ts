import type { ErrorResponse } from "../../shared/api";
import { AppError, apiError } from "./errors";

export async function postJson<Res>(url: string, body: unknown): Promise<Res> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppError("network");
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ErrorResponse | null;
    throw apiError(error?.error);
  }
  return response.json();
}
