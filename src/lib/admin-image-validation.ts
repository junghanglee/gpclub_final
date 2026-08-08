export const ADMIN_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateAdminImageFile(file: Pick<File, "size" | "type">): string | null {
  if (file.size === 0) return "The selected image is empty. Choose a valid image file.";
  if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return "Only JPG, PNG or WebP images are supported.";
  }
  if (file.size > ADMIN_IMAGE_MAX_BYTES) {
    return "The image must be 10 MB or smaller.";
  }
  return null;
}

export function verifyBrowserImage(url: string, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.src = "";
      reject(new Error("Image verification timed out. Please try again."));
    }, timeoutMs);

    image.onload = () => {
      window.clearTimeout(timer);
      if (image.naturalWidth > 0 && image.naturalHeight > 0) resolve();
      else reject(new Error("The selected file could not be decoded as an image."));
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("The selected file could not be decoded as an image."));
    };
    image.src = url;
  });
}
