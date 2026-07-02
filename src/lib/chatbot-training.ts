export type ChatbotChunk = {
  content: string;
  token_count: number;
  content_hash: string;
  metadata: Record<string, unknown>;
};

export type MatchedChunk = {
  id?: string;
  document_id?: string;
  document_title?: string;
  category?: string;
  content: string;
  score: number;
  chunk_index?: number;
  tags?: string[];
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "you",
  "your",
  "are",
  "from",
  "what",
  "how",
  "can",
  "please",
  "about",
  "recommend",
  "recommendation",
  "recommendations",
  "product",
  "products",
  "should",
  "use",
  "need",
  "want",
  "looking",
  "cua",
  "cho",
  "toi",
  "ban",
  "hay",
  "voi",
  "cac",
  "nhung",
  "la",
  "co",
  "duoc",
  "을",
  "를",
  "이",
  "가",
  "은",
  "는",
  "및",
]);

export function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractKeywords(input: string, max = 32) {
  const words = normalizeText(input)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
  return Array.from(new Set(words)).slice(0, max);
}

function hashText(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function estimateTokenCount(input: string) {
  const normalized = input.trim();
  if (!normalized) return 0;
  return Math.ceil(normalized.replace(/\s+/g, " ").length / 4);
}

export function chunkText(
  input: string,
  options: { maxChars?: number; overlapChars?: number } = {},
): ChatbotChunk[] {
  const maxChars = options.maxChars ?? 1100;
  const overlapChars = options.overlapChars ?? 160;
  const clean = input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  if (!clean) return [];

  const paragraphs = clean
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const value = current.trim();
    if (value) chunks.push(value);
    current = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      pushCurrent();
      const sentences = paragraph.match(/[^.!?。！？]+[.!?。！？]?/g) ?? [paragraph];
      for (const sentence of sentences) {
        const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
        if (next.length > maxChars && current) pushCurrent();
        if (sentence.length > maxChars) {
          for (let start = 0; start < sentence.length; start += maxChars - overlapChars) {
            chunks.push(sentence.slice(start, start + maxChars).trim());
          }
          current = "";
        } else {
          current = current ? `${current} ${sentence.trim()}` : sentence.trim();
        }
      }
      continue;
    }

    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > maxChars && current) pushCurrent();
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  pushCurrent();

  return chunks
    .map((content, index) => ({
      content,
      token_count: estimateTokenCount(content),
      content_hash: hashText(content),
      metadata: { index, keywords: extractKeywords(content, 16) },
    }))
    .filter((chunk) => chunk.content.length > 0);
}

export function scoreText(query: string, text: string) {
  const keywords = extractKeywords(query);
  if (!keywords.length) return 0;
  const haystack = normalizeText(text);
  const queryText = normalizeText(query);
  let score = 0;

  for (const keyword of keywords) {
    if (!haystack.includes(keyword)) continue;
    const weight = keyword.length > 4 ? 2 : 1;
    const exactWord = new RegExp(
      `(^|\\s)${keyword.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(\\s|$)`,
    ).test(haystack);
    score += exactWord ? weight * 1.5 : weight;
  }

  // Give a small boost when important multi-word terms stay together.
  const queryBigrams = queryText.split(" ").filter(Boolean).slice(0, 12);
  for (let index = 0; index < queryBigrams.length - 1; index += 1) {
    const phrase = `${queryBigrams[index]} ${queryBigrams[index + 1]}`;
    if (phrase.length > 5 && haystack.includes(phrase)) score += 1.25;
  }

  return score / Math.max(keywords.length, 1);
}

export function rankMatches<
  T extends { content: string; title?: string | null; tags?: string[] | null },
>(query: string, rows: T[], limit = 5) {
  return rows
    .map((row) => {
      const source = [row.title, row.content, Array.isArray(row.tags) ? row.tags.join(" ") : ""]
        .filter(Boolean)
        .join(" ");
      return { row, score: scoreText(query, source) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
