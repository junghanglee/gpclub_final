const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "figcaption",
  "figure",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "section",
  "span",
  "strong",
  "u",
  "ul",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  section: new Set(["aria-label"]),
};

const ATTRIBUTE_PATTERN = /([:\w-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const decodeHtmlEntities = (value: string) => {
  if (typeof document === "undefined") return value;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const normalizeAttributeValue = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed[trimmed.length - 1] === quote) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const isSafeUrl = (value: string) => {
  const decoded = Array.from(decodeHtmlEntities(value))
    .filter((char) => char > " " && char !== "\u007f")
    .join("")
    .toLowerCase();
  if (!decoded) return false;
  return !decoded.startsWith("javascript:") && !decoded.startsWith("data:text/html");
};

const sanitizeAttributes = (tagName: string, rawAttributes: string) => {
  const allowed = ALLOWED_ATTRIBUTES[tagName];
  if (!allowed) return "";

  const output: string[] = [];
  for (const match of rawAttributes.matchAll(ATTRIBUTE_PATTERN)) {
    const name = match[1]?.toLowerCase();
    if (!name || name.startsWith("on") || !allowed.has(name)) continue;

    const value = normalizeAttributeValue(match[2]);
    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
    if ((name === "width" || name === "height") && value && !/^\d{1,4}$/.test(value)) continue;

    if (name === "target") {
      output.push('target="_blank"');
      if (!output.some((item) => item.startsWith("rel="))) {
        output.push('rel="noopener noreferrer"');
      }
      continue;
    }

    if (name === "loading") {
      output.push('loading="lazy"');
      continue;
    }

    output.push(`${name}="${escapeHtml(value)}"`);
  }

  if (tagName === "a" && output.some((item) => item.startsWith("href="))) {
    if (!output.some((item) => item.startsWith("target="))) output.push('target="_blank"');
    if (!output.some((item) => item.startsWith("rel="))) output.push('rel="noopener noreferrer"');
  }

  if (tagName === "img" && output.some((item) => item.startsWith("src="))) {
    if (!output.some((item) => item.startsWith("alt="))) output.push('alt=""');
    if (!output.some((item) => item.startsWith("loading="))) output.push('loading="lazy"');
  }

  return output.length ? ` ${output.join(" ")}` : "";
};

export function sanitizeProductDetailHtml(html?: string | null) {
  const source = html || "";
  if (!source.trim()) return "";

  let output = "";
  let cursor = 0;
  let blockedTag: string | null = null;
  const tagPattern = /<\/?[^>]+>/g;

  for (const match of source.matchAll(tagPattern)) {
    const rawTag = match[0];
    const index = match.index ?? 0;
    if (!blockedTag) output += escapeHtml(source.slice(cursor, index));
    cursor = index + rawTag.length;

    if (blockedTag) {
      if (new RegExp(`^<\\s*/\\s*${blockedTag}\\b`, "i").test(rawTag)) {
        blockedTag = null;
      }
      continue;
    }

    if (/^<\s*script\b/i.test(rawTag) || /^<\s*style\b/i.test(rawTag)) {
      blockedTag = rawTag.match(/^<\s*([\w-]+)/)?.[1]?.toLowerCase() || null;
      continue;
    }
    if (/^<\s*\//.test(rawTag)) {
      const closeName = rawTag.match(/^<\s*\/\s*([\w-]+)/)?.[1]?.toLowerCase();
      if (closeName && ALLOWED_TAGS.has(closeName) && !VOID_TAGS.has(closeName)) {
        output += `</${closeName}>`;
      }
      continue;
    }

    const openMatch = rawTag.match(/^<\s*([\w-]+)([^>]*)>/);
    const tagName = openMatch?.[1]?.toLowerCase();
    if (!tagName || !ALLOWED_TAGS.has(tagName)) continue;

    const attributes = sanitizeAttributes(tagName, openMatch?.[2] || "");
    output += VOID_TAGS.has(tagName) ? `<${tagName}${attributes}>` : `<${tagName}${attributes}>`;
  }

  if (!blockedTag) output += escapeHtml(source.slice(cursor));
  return output.replace(/<\/?(?:script|style)[^>]*>/gi, "").trim();
}

export function productDetailTextFromHtml(html?: string | null) {
  return sanitizeProductDetailHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
