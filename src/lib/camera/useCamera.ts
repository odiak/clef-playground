import { useCallback, useEffect, useRef, useState } from "react";
import { AppError } from "../errors";

function toCameraError(error: unknown): AppError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return new AppError("camera_denied");
      case "NotFoundError":
      case "OverconstrainedError":
        return new AppError("camera_not_found");
      case "NotReadableError":
        return new AppError("camera_busy");
    }
  }
  return new AppError("camera_failed");
}

function isLive(stream: MediaStream): boolean {
  return stream.getVideoTracks().some((track) => track.readyState === "live" && track.enabled && !track.muted);
}

/** カメラの映像を video 要素に流す。既定はインカメラで、"environment" なら外カメラ */
export function useCamera(facingMode: "user" | "environment" = "user") {
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
    if (!video) throw new AppError("camera_failed");

    // バックグラウンドから戻ったときなどに映像が止まっていることがあるので、生きている場合だけ使い回す
    if (streamRef.current && isLive(streamRef.current)) {
      if (video.paused) await video.play();
      return video;
    }
    stop();

    if (!window.isSecureContext) {
      throw new AppError("camera_insecure");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new AppError("camera_unsupported");
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
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
  }, [stop, facingMode]);

  // バックグラウンドに回ると映像が止まることがあるので、カメラを解放する。次に使うときに起動し直す
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stop();
    };
  }, [stop]);

  return { videoRef, start, stop, isActive };
}
