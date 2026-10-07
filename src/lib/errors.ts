import type { ErrorCode } from "../../shared/api";
import type { Lang } from "../../shared/i18n";
import { defineMessages } from "./i18n";

/** 画面に出すエラーの種類。API が返すものと、ブラウザ側で起きるもの */
export type AppErrorCode =
  | ErrorCode
  | "network"
  | "request_failed"
  | "camera_denied"
  | "camera_not_found"
  | "camera_busy"
  | "camera_failed"
  | "camera_insecure"
  | "camera_unsupported"
  | "capture_failed";

/** 文言は表示するときに言語に合わせて決めるので、エラーには種類だけを持たせる */
export class AppError extends Error {
  constructor(readonly code: AppErrorCode) {
    super(code);
  }
}

const MESSAGES = defineMessages<Record<AppErrorCode, string>>({
  ja: {
    rate_limited: "リクエストが多すぎます。少し休憩してからもう一度どうぞ",
    invalid_request: "リクエストが不正です",
    image_too_large: "画像が大きすぎます",
    clef_failed: "判定に失敗しました。もう一度お試しください",
    no_face: "顔が見つかりませんでした。顔が枠に収まるように撮り直してください",
    not_found: "見つかりませんでした",
    network: "通信に失敗しました。電波の良いところでもう一度どうぞ",
    request_failed: "判定に失敗しました",
    camera_denied: "カメラの使用が許可されていません。ブラウザの設定でカメラを許可してください",
    camera_not_found: "使えるカメラが見つかりませんでした",
    camera_busy: "カメラを起動できませんでした。他のアプリがカメラを使っていないか確認してください",
    camera_failed: "カメラを起動できませんでした",
    camera_insecure: "カメラを使うには HTTPS でページを開いてください",
    camera_unsupported: "このブラウザはカメラに対応していません",
    capture_failed: "カメラの映像を取得できませんでした。もう一度どうぞ",
  },
  en: {
    rate_limited: "Too many requests. Take a short break and try again",
    invalid_request: "Invalid request",
    image_too_large: "The image is too large",
    clef_failed: "Clef couldn't judge the photo. Please try again",
    no_face: "No face found. Retake the photo with your face inside the frame",
    not_found: "Not found",
    network: "Network error. Please try again with a better connection",
    request_failed: "Something went wrong",
    camera_denied: "Camera access is blocked. Allow the camera in your browser settings",
    camera_not_found: "No camera found",
    camera_busy: "Couldn't start the camera. Make sure no other app is using it",
    camera_failed: "Couldn't start the camera",
    camera_insecure: "Open this page over HTTPS to use the camera",
    camera_unsupported: "This browser doesn't support the camera",
    capture_failed: "Couldn't capture the camera image. Please try again",
  },
});

export function errorMessage(error: unknown, lang: Lang): string {
  return MESSAGES[lang][error instanceof AppError ? error.code : "request_failed"];
}

/** API が返したエラーの種類からエラーを作る。知らない種類なら一般的なエラーにする */
export function apiError(code: unknown): AppError {
  return new AppError(typeof code === "string" && code in MESSAGES.ja ? (code as AppErrorCode) : "request_failed");
}
