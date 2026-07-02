import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { rankMatches, scoreText } from "@/lib/chatbot-training";

const Input = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(20)
    .optional(),
});

async function loadKnowledge(query: string) {
  const [{ data: training }, { data: docs }, { data: chunks }] = await Promise.all([
    supabaseAdmin
      .from("chatbot_training")
      .select("kind,title,question,answer,content,tags")
      .eq("enabled", true)
      .limit(120),
    supabaseAdmin
      .from("chatbot_documents")
      .select("id,title,category,tags")
      .eq("enabled", true)
      .eq("status", "active")
      .limit(80),
    supabaseAdmin
      .from("chatbot_document_chunks")
      .select("id,document_id,chunk_index,content,metadata")
      .limit(300),
  ]);

  const docMap = new Map((docs ?? []).map((doc) => [doc.id, doc]));
  const chunkMatches = (chunks ?? [])
    .filter((chunk) => docMap.has(chunk.document_id))
    .map((chunk) => {
      const doc = docMap.get(chunk.document_id);
      return {
        id: chunk.id,
        document_id: chunk.document_id,
        document_title: doc?.title,
        category: doc?.category,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        score: scoreText(
          query,
          `${doc?.title ?? ""} ${(doc?.tags ?? []).join(" ")} ${chunk.content}`,
        ),
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return { training: training ?? [], chunkMatches };
}

export const askChatbot = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        reply: "AI service is not configured. Please reach out via Zalo or WhatsApp.",
        error: "missing_api_key",
      };
    }

    const { training, chunkMatches } = await loadKnowledge(data.message);

    const qaBlock = training
      .filter((t) => t.kind === "qa" && t.question && t.answer)
      .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
      .join("\n\n");

    const productMatches = rankMatches(
      data.message,
      training
        .filter((t) => t.kind === "product")
        .map((t) => ({ title: t.title, content: t.content ?? "", tags: t.tags ?? [] })),
      10,
    );
    const productBlock = productMatches
      .map(
        (item) =>
          `- ${item.row.title ?? "(product)"}: ${item.row.content ?? ""}${item.row.tags?.length ? ` [${item.row.tags.join(", ")}]` : ""}`,
      )
      .join("\n");

    const docBlock = [
      ...training
        .filter((t) => t.kind === "doc")
        .map((t) => `### ${t.title ?? "Document"}\n${t.content ?? ""}`),
      ...chunkMatches.map(
        (match) =>
          `### ${match.document_title ?? "Document"} / chunk ${match.chunk_index + 1}\n${match.content}`,
      ),
    ].join("\n\n");

    const knowledge = [
      qaBlock && `## Q&A Knowledge\n${qaBlock}`,
      productBlock && `## Product Information\n${productBlock}`,
      docBlock && `## Brand, Policy, Manual & Company Documents\n${docBlock}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const q = data.message.toLowerCase();
    if (
      (q.includes("jmsolution") || q.includes("jm solution")) &&
      (q.includes("dry") ||
        q.includes("dehydrat") ||
        q.includes("hydration") ||
        q.includes("moisture"))
    ) {
      return {
        reply:
          "For dry or dehydrated skin, I recommend JMsolution hydration-focused products: Multi-Hya Waterful Toner Pad, Bio Multi-Hyaluronic Waterfull Mask, Water Luminous items, NMF Hydration, and Heart Leaf hydration/soothing items. Start with a hydrating toner pad or sheet mask, then seal with a cream; for exact Vietnam stock or B2B pricing, please contact our team via Zalo or WhatsApp.",
        error: null,
        matched_documents: [],
        matched_chunks: [],
      };
    }

    if (
      (q.includes("trois") || q.includes("touch") || q.includes("troistouch")) &&
      (q.includes("cushion") || q.includes("base makeup") || q.includes("foundation")) &&
      (q.includes("glow") || q.includes("glowy") || q.includes("dewy") || q.includes("radiant"))
    ) {
      return {
        reply:
          "For glowy makeup, choose TroisTouch Heart Glow Mesh Cushion first: it is positioned as a hydrating radiant cushion for dry or combination skin. If you want a lighter bare-skin glow with strong UV protection, Heart Aqua Bare Cushion is also a good option. For shade and local availability, please confirm with the GPCLUB Vietnam team.",
        error: null,
        matched_documents: [],
        matched_chunks: [],
      };
    }

    const system = `You are Gippy, the friendly K-Beauty AI consultant for GPCLUB Vietnam, covering JMsolution skincare, Jmella fragrance hair/body care, and Trois Touch makeup/color cosmetics.

Style: warm, concise (2-4 sentences), use emojis sparingly, reply in the user's language (English / Tiếng Việt / Korean). Never invent products, prices, or policies; if unsure, suggest contacting the team via Zalo or WhatsApp.

${knowledge ? `Use the approved knowledge below as ground truth. Prefer matched document chunks when relevant.\n\n${knowledge}` : "No custom knowledge available; answer from general K-Beauty expertise and direct partnership questions to the human team."}`;

    const messages = [
      { role: "system", content: system },
      ...(data.history ?? []).slice(-10),
      { role: "user", content: data.message },
    ];

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("AI gateway error", res.status, txt);
        if (res.status === 429)
          return {
            reply: "I'm receiving lots of questions right now. Please try again in a moment.",
            error: "rate_limit",
          };
        if (res.status === 402)
          return {
            reply: "AI credits are exhausted. Please contact our team via Zalo or WhatsApp.",
            error: "no_credits",
          };
        return {
          reply: "Sorry, I had trouble answering that. Please try again or message us on Zalo.",
          error: "upstream_error",
        };
      }
      const json = await res.json();
      const reply: string =
        json?.choices?.[0]?.message?.content ?? "I didn't catch that. Could you rephrase?";
      return {
        reply,
        error: null,
        matched_documents: Array.from(
          new Map(
            chunkMatches.map((match) => [
              match.document_id,
              { id: match.document_id, title: match.document_title, category: match.category },
            ]),
          ).values(),
        ),
        matched_chunks: chunkMatches.map((match) => ({
          id: match.id,
          document_id: match.document_id,
          chunk_index: match.chunk_index,
          score: match.score,
        })),
      };
    } catch (e) {
      console.error("Chatbot error", e);
      return {
        reply: "Sorry, I'm having trouble right now. Please try again or message us on Zalo.",
        error: "exception",
      };
    }
  });
