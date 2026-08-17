export const CMS_PREVIEW_SOURCE = "gpclub-cms-preview";

export function isCmsPreviewWindow() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("cmsPreview") === "1"
  );
}

export function readCmsPreviewMessage(value: unknown, expectedPage: string): unknown | null {
  if (!value || typeof value !== "object") return null;
  const message = value as Record<string, unknown>;
  if (
    message.source !== CMS_PREVIEW_SOURCE ||
    message.page !== expectedPage ||
    !("content" in message)
  )
    return null;
  return message.content;
}
