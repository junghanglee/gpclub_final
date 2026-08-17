export const CMS_PREVIEW_SOURCE = "gpclub-cms-preview";
export const CMS_PREVIEW_SELECT_SOURCE = "gpclub-cms-preview-select";

export type CmsVisualStyle = { fontSize?: number; color?: string };

export function getDraftValue(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

export function setDraftValue(value: unknown, path: string, nextValue: unknown): unknown {
  const keys = path.split(".");
  const update = (current: unknown, index: number): unknown => {
    if (index === keys.length) return nextValue;
    const key = keys[index];
    const clone = Array.isArray(current)
      ? [...current]
      : { ...((current && typeof current === "object" ? current : {}) as Record<string, unknown>) };
    (clone as Record<string, unknown>)[key] = update(
      (current as Record<string, unknown> | undefined)?.[key],
      index + 1,
    );
    return clone;
  };
  return update(value, 0);
}

function flattenStrings(
  value: unknown,
  lang?: "vi" | "en",
  path = "",
  result: Array<{ path: string; value: string }> = [],
) {
  if (typeof value === "string") {
    if (
      value.trim() &&
      (!lang || (!path.endsWith(".vi") && !path.endsWith(".en")) || path.endsWith(`.${lang}`))
    )
      result.push({ path, value: value.trim() });
    return result;
  }
  if (!value || typeof value !== "object" || path === "visualStyles") return result;
  Object.entries(value).forEach(([key, child]) =>
    flattenStrings(child, lang, path ? `${path}.${key}` : key, result),
  );
  return result;
}

export function installCmsPreviewBindings(
  content: unknown,
  lang?: "vi" | "en",
  interactive = false,
) {
  if (typeof document === "undefined") return () => {};
  const leaves = flattenStrings(content, lang);
  const styles = (getDraftValue(content, "visualStyles") ?? {}) as Record<string, CmsVisualStyle>;
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,p,span,a,button,li,dt,dd"),
  );
  for (const leaf of leaves) {
    const image = Array.from(document.images).find(
      (item) => item.src === leaf.value || item.getAttribute("src") === leaf.value,
    );
    if (image) {
      image.dataset.cmsPath = leaf.path;
      image.dataset.cmsKind = "image";
      if (interactive) image.style.cursor = "pointer";
      continue;
    }
    const matches = candidates.filter((element) => element.textContent?.trim() === leaf.value);
    const element = matches.sort((a, b) => a.children.length - b.children.length)[0];
    if (!element || element.dataset.cmsPath) continue;
    element.dataset.cmsPath = leaf.path;
    element.dataset.cmsKind = "text";
    if (interactive) element.style.cursor = "text";
    const style = styles[leaf.path];
    if (style?.fontSize && Number.isFinite(style.fontSize)) {
      element.style.fontSize = `${Math.min(160, Math.max(10, style.fontSize))}px`;
    }
    if (style?.color && /^#[0-9a-f]{6}$/i.test(style.color)) element.style.color = style.color;
  }
  const select = (event: MouseEvent) => {
    const element = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-cms-path]");
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    window.parent.postMessage(
      {
        source: CMS_PREVIEW_SELECT_SOURCE,
        path: element.dataset.cmsPath,
        kind: element.dataset.cmsKind,
      },
      window.location.origin,
    );
  };
  if (interactive) document.addEventListener("click", select, true);
  return () => {
    if (interactive) document.removeEventListener("click", select, true);
  };
}

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
