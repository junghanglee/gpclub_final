import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { rankMatches, scoreText } from "@/lib/chatbot-training";

const fallbackReply =
  "Thanks for your question. I can help with JMsolution, Jmella, product recommendations, and B2B partnership basics. For detailed pricing or policy, please contact our team via Zalo or WhatsApp.";

type ChatMessage = { role: "user" | "assistant"; content: string };

type AskChatbotInput = {
  message: string;
  history?: ChatMessage[];
  chatUiMode?: "tree" | "natural";
  selectedTreePath?: string[];
};

type ChatbotRecordMeta = {
  matched_documents?: Json[];
  matched_chunks?: Json[];
  confidence?: number | null;
  needs_review?: boolean;
  chat_ui_mode?: "tree" | "natural";
  selected_tree_path?: string[];
};

function getChatbotSessionId() {
  if (typeof window === "undefined") return null;
  const key = "gpclub-chatbot-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `chat-${Date.now()}`;
  window.localStorage.setItem(key, id);
  return id;
}

async function saveChatbotRecord(input: {
  message: string;
  reply: string;
  history: ChatMessage[];
  meta?: ChatbotRecordMeta;
}) {
  try {
    await supabase.from("chatbot_records").insert({
      session_id: getChatbotSessionId(),
      customer_message: input.message,
      chatbot_reply: input.reply,
      history: input.history.slice(-8),
      matched_documents: input.meta?.matched_documents ?? [],
      matched_chunks: input.meta?.matched_chunks ?? [],
      confidence: input.meta?.confidence ?? null,
      needs_review: input.meta?.needs_review ?? false,
      chat_ui_mode: input.meta?.chat_ui_mode ?? "natural",
      selected_tree_path: input.meta?.selected_tree_path ?? [],
    });
  } catch (error) {
    console.error("Chatbot record save error", error);
  }
}

async function findDocumentMatches(query: string) {
  const { data: docs } = await supabase
    .from("chatbot_documents")
    .select("id,title,category,tags")
    .eq("enabled", true)
    .eq("status", "active")
    .limit(80);

  const { data: chunks } = await supabase
    .from("chatbot_document_chunks")
    .select("id,document_id,chunk_index,content,metadata")
    .limit(250);

  const docMap = new Map((docs ?? []).map((doc) => [doc.id, doc]));
  const activeChunks = (chunks ?? []).filter((chunk) => docMap.has(chunk.document_id));
  const matches = activeChunks
    .map((chunk) => {
      const doc = docMap.get(chunk.document_id);
      return {
        id: chunk.id,
        document_id: chunk.document_id,
        document_title: doc?.title,
        category: doc?.category,
        chunk_index: chunk.chunk_index,
        tags: doc?.tags ?? [],
        content: chunk.content,
        score: scoreText(
          query,
          `${doc?.title ?? ""} ${(doc?.tags ?? []).join(" ")} ${chunk.content}`,
        ),
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return matches;
}

export async function askChatbotClient({
  message,
  history = [],
  chatUiMode = "natural",
  selectedTreePath = [],
}: AskChatbotInput): Promise<{ reply: string; error: string | null }> {
  const text = message.trim();
  if (!text) return { reply: fallbackReply, error: "empty_message" };

  let reply = fallbackReply;
  let error: string | null = null;
  let meta: ChatbotRecordMeta = {
    matched_documents: [],
    matched_chunks: [],
    confidence: null,
    needs_review: true,
    chat_ui_mode: chatUiMode,
    selected_tree_path: selectedTreePath,
  };

  try {
    const [{ data: training }, documentMatches] = await Promise.all([
      supabase
        .from("chatbot_training")
        .select("kind,title,question,answer,content,tags")
        .eq("enabled", true)
        .limit(120),
      findDocumentMatches(text),
    ]);

    const q = text.toLowerCase();
    const rows = training ?? [];

    const qa = rows.find((row) => {
      const question = String(row.question ?? "").toLowerCase();
      const title = String(row.title ?? "").toLowerCase();
      const answer = String(row.answer ?? "");
      return (
        answer &&
        (question.includes(q) || q.includes(question) || title.includes(q) || q.includes(title))
      );
    });

    const asksDrySkin =
      q.includes("dry") ||
      q.includes("dehydrat") ||
      q.includes("hydration") ||
      q.includes("moisture");
    const asksGlowyBase =
      q.includes("glow") || q.includes("glowy") || q.includes("dewy") || q.includes("radiant");
    const asksCushion =
      q.includes("cushion") || q.includes("base makeup") || q.includes("foundation");

    if (qa?.answer) {
      reply = String(qa.answer);
      meta = {
        ...meta,
        matched_documents: [],
        matched_chunks: [],
        confidence: 0.9,
        needs_review: false,
      };
    } else if ((q.includes("jmsolution") || q.includes("jm solution")) && asksDrySkin) {
      reply =
        "For dry or dehydrated skin, I recommend JMsolution hydration-focused products: Multi-Hya Waterful Toner Pad, Bio Multi-Hyaluronic Waterfull Mask, Water Luminous items, NMF Hydration, and Heart Leaf hydration/soothing items. Start with a hydrating toner pad or sheet mask, then seal with a cream; for exact Vietnam stock or B2B pricing, please contact our team via Zalo or WhatsApp.";
      meta = { ...meta, confidence: 0.85, needs_review: false };
    } else if (
      (q.includes("trois") || q.includes("touch") || q.includes("troistouch")) &&
      asksCushion &&
      asksGlowyBase
    ) {
      reply =
        "For glowy makeup, choose TroisTouch Heart Glow Mesh Cushion first: it is positioned as a hydrating radiant cushion for dry or combination skin. If you want a lighter bare-skin glow with strong UV protection, Heart Aqua Bare Cushion is also a good option. For shade and local availability, please confirm with the GPCLUB Vietnam team.";
      meta = { ...meta, confidence: 0.85, needs_review: false };
    } else {
      const product = rankMatches(
        text,
        rows
          .filter((row) => row.kind === "product")
          .map((row) => ({
            title: row.title,
            content: row.content ?? "",
            tags: row.tags ?? [],
          })),
        1,
      )[0];

      if (product) {
        reply = `Here's what I found: ${product.row.title ?? "Product information"}\n\n${product.row.content || "Please contact our team for details."}`;
        meta = {
          ...meta,
          matched_documents: [],
          matched_chunks: [],
          confidence: Math.min(product.score, 1),
          needs_review: product.score < 0.35,
        };
      } else if (documentMatches.length > 0) {
        const best = documentMatches[0];
        reply = `Based on GPCLUB's training documents: ${best.content}\n\nIf you need exact pricing, stock, or contract terms, please contact our team via Zalo or WhatsApp.`;
        meta = {
          ...meta,
          matched_documents: Array.from(
            new Map(
              documentMatches.map((match) => [
                match.document_id,
                {
                  id: match.document_id,
                  title: match.document_title,
                  category: match.category,
                },
              ]),
            ).values(),
          ),
          matched_chunks: documentMatches.map((match) => ({
            id: match.id,
            document_id: match.document_id,
            chunk_index: match.chunk_index,
            score: match.score,
          })),
          confidence: Math.min(best.score, 1),
          needs_review: best.score < 0.35,
        };
      } else if (
        q.includes("b2b") ||
        q.includes("dealer") ||
        q.includes("distributor") ||
        q.includes("wholesale") ||
        q.includes("partner")
      ) {
        reply =
          "For B2B partnership, wholesale, dealership, or distribution inquiries, please submit the B2B form. Our GPCLUB Vietnam team will review and contact you directly.";
        meta = {
          ...meta,
          matched_documents: [],
          matched_chunks: [],
          confidence: 0.5,
          needs_review: false,
        };
      } else if (q.includes("jmsolution") || q.includes("jm solution")) {
        reply =
          "JMsolution is one of GPCLUB's key K-Beauty brands, known for skincare and mask-pack lines. Tell me your skin type or concern and I can guide you to suitable products.";
        meta = {
          ...meta,
          matched_documents: [],
          matched_chunks: [],
          confidence: 0.5,
          needs_review: false,
        };
      } else if (q.includes("jmella") || q.includes("j mella")) {
        reply =
          "Jmella focuses on fragrance-inspired body and lifestyle care. If you share your preferred scent or product type, I can suggest a direction.";
        meta = {
          ...meta,
          matched_documents: [],
          matched_chunks: [],
          confidence: 0.5,
          needs_review: false,
        };
      }
    }
  } catch (caught) {
    console.error("Client chatbot error", caught);
    error = "exception";
  }

  await saveChatbotRecord({ message: text, reply, history, meta });
  return { reply, error };
}
