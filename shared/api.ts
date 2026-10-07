/** API が返すエラーの種類。画面に出す文言は、表示する側が言語に合わせて決める */
export type ErrorCode = "rate_limited" | "invalid_request" | "image_too_large" | "clef_failed" | "no_face" | "not_found";

export type ErrorResponse = {
  error: ErrorCode;
};
