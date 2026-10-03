import { useCallback, useEffect, useRef, useState } from "react";

export class CameraError extends Error {}

function toCameraError(error: unknown): CameraError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return new CameraError("カメラの使用が許可されていません。ブラウザの設定でカメラを許可してください");
      case "NotFoundError":
      case "OverconstrainedError":
        return new CameraError("使えるカメラが見つかりませんでした");
      case "NotReadableError":
        return new CameraError("カメラを起動できませんでした。他のアプリがカメラを使っていないか確認してください");
    }
  }
  return new CameraError("カメラを起動できませんでした");
}

function isLive(stream: MediaStream): boolean {
  return stream.getVideoTracks().some((track) => track.readyState === "live" && track.enabled && !track.muted);
}

/** インカメラの映像を video 要素に流す */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  }, []);

  const start = useCallback(async (): Promise<HTMLVideoElement> => {
    const video = videoRef.current;
    if (!video) throw new CameraError("カメラを起動できませんでした");

    // バックグラウンドから戻ったときなどに映像が止まっていることがあるので、生きている場合だけ使い回す
    if (streamRef.current && isLive(streamRef.current)) {
      if (video.paused) await video.play();
      return video;
    }
    stop();

    if (!window.isSecureContext) {
      throw new CameraError("カメラを使うには HTTPS でページを開いてください");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new CameraError("このブラウザはカメラに対応していません");
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
    } catch (error) {
      throw toCameraError(error);
    }

    streamRef.current = stream;
    for (const track of stream.getVideoTracks()) {
      track.addEventListener("ended", () => {
        if (streamRef.current === stream) stop();
      });
    }
    video.srcObject = stream;
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise((resolve) => video.addEventListener("loadedmetadata", resolve, { once: true }));
    }
    await video.play();
    setIsActive(true);
    return video;
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { videoRef, start, stop, isActive };
}
