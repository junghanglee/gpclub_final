import { validateAdminImageFile } from "./admin-image-validation.ts";

const ADMIN_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const SUPPORTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

export function validateAdminMediaFile(file: Pick<File, "size" | "type">): string | null {
  const type = file.type.toLowerCase();
  if (type.startsWith("image/")) return validateAdminImageFile(file);
  if (file.size === 0) return "The selected media file is empty.";
  if (!SUPPORTED_VIDEO_TYPES.has(type))
    return "Only JPG, PNG, WebP, MP4 or WebM files are supported.";
  if (file.size > ADMIN_VIDEO_MAX_BYTES) return "Videos must be 100 MB or smaller.";
  return null;
}

export function verifyBrowserVideo(url: string, timeoutMs = 20_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const timer = window.setTimeout(() => {
      video.src = "";
      reject(new Error("Video verification timed out. Please try again."));
    }, timeoutMs);

    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      if (Number.isFinite(video.duration) && video.duration > 0) resolve();
      else reject(new Error("The selected file could not be decoded as a video."));
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("The selected file could not be decoded as a video."));
    };
    video.src = url;
  });
}
