import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Droplets,
  Heart,
  MessageCircle,
  RefreshCcw,
  Send,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gippyCelebrate from "@/assets/gippy-celebrate.png";
import gippyChatImg from "@/assets/gippy-chat.png";
import gippyFront from "@/assets/gippy-front.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  type CatalogProduct,
  getCoverImage,
  pickByConcern,
  pickByQuery,
  pickBySkin,
  type SkinType,
  useCatalogProducts,
} from "@/lib/catalog-products";
import { askChatbotClient } from "@/lib/chatbot";
import { onGippyOpen } from "@/lib/gippy-bus";
import { buildWhatsappLink, buildZaloLink, useCompanyInfo } from "@/lib/site-settings";

type GippyState = "greet" | "talking" | "done";
const POSES: Record<GippyState, string> = {
  greet: gippyFront,
  talking: gippyChatImg,
  done: gippyCelebrate,
};

type Mode = "menu" | "skin" | "concern" | "recommend" | "manager" | "b2b";
type ChatUiMode = "tree" | "natural";

interface Msg {
  id: string;
  role: "user" | "gippy";
  content?: string;
  products?: CatalogProduct[];
  cta?: "managers" | "b2b";
}

interface TreeNode {
  id: string;
  scenario_key: string;
  parent_id: string | null;
  sort_order: number;
  label_ko: string | null;
  label_en: string | null;
  label_vi: string | null;
  answer_ko: string | null;
  answer_en: string | null;
  answer_vi: string | null;
  action_type: string;
  linked_document_id: string | null;
  enabled: boolean;
}

const SKIN_TYPES: SkinType[] = ["Dry", "Oily", "Combination", "Sensitive"];
const CONCERNS = ["Hydration", "Brightening", "Anti-aging", "Pores", "Fragrance", "Body care"];

const uid = () => Math.random().toString(36).slice(2, 9);

export function GippyChat() {
  const ask = askChatbotClient;
  const [open, setOpen] = useState(false);
  const { rows: catalogProducts } = useCatalogProducts({ enabled: open });
  const [mode, setMode] = useState<Mode>("menu");
  const [chatUiMode, setChatUiMode] = useState<ChatUiMode>("natural");
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [treeParentId, setTreeParentId] = useState<string | null>(null);
  const [treePath, setTreePath] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pose, setPose] = useState<GippyState>("greet");
  const [fabBurst, setFabBurst] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-pose: typing → talking, last gippy reply with products/cta → done, else greet
  useEffect(() => {
    if (typing) {
      setPose("talking");
      return;
    }
    const last = [...messages].reverse().find((m) => m.role === "gippy");
    if (!last) {
      setPose("greet");
      return;
    }
    if (last.products?.length || last.cta) setPose("done");
    else setPose("greet");
  }, [typing, messages]);

  const greet = (): Msg => ({
    id: uid(),
    role: "gippy",
    content:
      "Hi there! I'm **Gippy**.\nYour GPCLUB partner product advisor. How can I help your sales channel today?",
  });

  useEffect(() => {
    return onGippyOpen((prompt) => {
      setOpen(true);
      setMessages((m) => (m.length ? m : [greet()]));
      if (prompt) {
        setTimeout(() => sendUser(prompt), 200);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, mode]);

  useEffect(() => {
    if (!open || treeNodes.length > 0) return;
    let mounted = true;
    supabase
      .from("chatbot_tree_nodes")
      .select(
        "id,scenario_key,parent_id,sort_order,label_ko,label_en,label_vi,answer_ko,answer_en,answer_vi,action_type,linked_document_id,enabled",
      )
      .eq("enabled", true)
      .order("scenario_key", { ascending: true })
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Chatbot tree load error", error);
          return;
        }
        if (mounted) setTreeNodes((data ?? []) as TreeNode[]);
      });
    return () => {
      mounted = false;
    };
  }, [open, treeNodes.length]);

  const handleOpen = () => {
    setOpen(true);
    setFabBurst((n) => n + 1);
    if (messages.length === 0) setMessages([greet()]);
  };

  const reset = () => {
    setMode("menu");
    setChatUiMode("natural");
    setTreeParentId(null);
    setTreePath([]);
    setMessages([greet()]);
  };

  const reply = async (build: () => Msg, delay = 700) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, delay));
    setTyping(false);
    setMessages((m) => [...m, build()]);
  };

  const pushUser = (text: string) =>
    setMessages((m) => [...m, { id: uid(), role: "user", content: text }]);

  const pickSkin = async (t: SkinType) => {
    pushUser(`My skin type: ${t}`);
    const recs = pickBySkin(catalogProducts, t);
    await reply(() => ({
      id: uid(),
      role: "gippy",
      content: `Best K-Beauty picks for **${t}** skin ✨`,
      products: recs,
    }));
    await reply(
      () => ({
        id: uid(),
        role: "gippy",
        content:
          "Want more tailored partner guidance? Tell me your sales channel, target category, or connect with our Vietnam team right away 🇻🇳",
        cta: "managers",
      }),
      400,
    );
    setMode("concern");
  };

  const pickConcern = async (c: string) => {
    pushUser(`Concern: ${c}`);
    const recs = pickByConcern(catalogProducts, c);
    await reply(() => ({
      id: uid(),
      role: "gippy",
      content: recs.length
        ? `Great picks for **${c}**:`
        : `I couldn't find an exact match for **${c}**. Would you like to chat with a manager?`,
      products: recs,
      cta: recs.length ? "managers" : "managers",
    }));
  };

  const labelForTreeNode = (node: TreeNode) =>
    node.label_en || node.label_vi || node.label_ko || "Option";
  const answerForTreeNode = (node: TreeNode) =>
    node.answer_en || node.answer_vi || node.answer_ko || "Please choose the next option.";
  const rootNodes = treeNodes.filter(
    (node) => node.scenario_key === "default" && (node.parent_id ?? null) === null,
  );
  const rawVisibleTreeNodes = treeNodes.filter(
    (node) => node.scenario_key === "default" && (node.parent_id ?? null) === treeParentId,
  );
  const findRoot = (text: string) =>
    rootNodes.find((node) => labelForTreeNode(node).toLowerCase().includes(text));
  const visibleTreeNodes = treeParentId
    ? rawVisibleTreeNodes.slice(0, 4)
    : ([
        findRoot("brand"),
        findRoot("skin"),
        findRoot("makeup"),
        findRoot("b2b") || findRoot("contact"),
      ].filter(Boolean) as TreeNode[]);

  const pickTreeNode = async (node: TreeNode) => {
    const label = labelForTreeNode(node);
    const nextPath = [...treePath, label];
    setTreePath(nextPath);
    pushUser(label);

    const children = treeNodes.filter(
      (child) => child.scenario_key === node.scenario_key && child.parent_id === node.id,
    );
    const answer = answerForTreeNode(node);

    await reply(() => ({
      id: uid(),
      role: "gippy",
      content: answer,
      cta: node.action_type === "contact" ? "managers" : undefined,
    }));

    if (children.length > 0 || node.action_type === "children") {
      setTreeParentId(node.id);
      setMode("menu");
      setChatUiMode("tree");
    } else if (node.action_type === "document" && node.linked_document_id) {
      const { reply: aiReply } = await ask({
        message: label,
        history: [],
        chatUiMode: "tree",
        selectedTreePath: nextPath,
      });
      await reply(() => ({ id: uid(), role: "gippy", content: aiReply }), 300);
    } else {
      setMode("recommend");
    }
  };

  const backTree = () => {
    if (!treeParentId) return;
    const current = treeNodes.find((node) => node.id === treeParentId);
    setTreeParentId(current?.parent_id ?? null);
    setTreePath((path) => path.slice(0, -1));
    setMode("menu");
    setChatUiMode("tree");
  };

  const sendUser = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    pushUser(q);
    setInput("");

    const lc = q.toLowerCase();
    const isB2B =
      lc.includes("dealer") ||
      lc.includes("distribut") ||
      lc.includes("wholesale") ||
      lc.includes("b2b") ||
      lc.includes("partner");

    // Local product matches always shown when found
    const recs = pickByQuery(catalogProducts, q);

    // Build short history for AI from prior text messages
    const history = messages
      .filter((m) => m.content)
      .slice(-8)
      .map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content!,
      }));

    setTyping(true);
    try {
      const { reply } = await ask({
        message: q,
        history,
        chatUiMode,
        selectedTreePath: treePath,
      });
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "gippy",
          content: reply,
          products: recs.length ? recs : undefined,
          cta: isB2B ? "b2b" : recs.length ? "managers" : undefined,
        },
      ]);
    } catch (e) {
      console.error(e);
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "gippy",
          content:
            "Sorry, I couldn't reach the AI right now. Please try again or chat with our team via Zalo.",
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating FAB */}
      <motion.button
        onClick={handleOpen}
        aria-label="Open Gippy AI consultant"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-navy py-2 pl-2 pr-4 text-primary-foreground shadow-glow md:bottom-8 md:right-8"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.92 }}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={open ? "talking" : "front"}
            src={open ? gippyChatImg : gippyFront}
            alt=""
            className="h-12 w-12 -my-2 drop-shadow-md"
            initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1, y: [0, -3, 0] }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{
              y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
              default: { type: "spring", damping: 14 },
            }}
          />
        </AnimatePresence>
        <span className="hidden text-sm font-medium sm:inline">Ask Gippy</span>
        <Sparkles className="h-4 w-4 text-gold" />
        <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-gold" />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-gold" />

        {/* Click sparkle burst */}
        <AnimatePresence>
          {fabBurst > 0 && (
            <motion.span
              key={fabBurst}
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
            >
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-gold"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * 50,
                      y: Math.sin(angle) * 50,
                      opacity: 0,
                      scale: 0.4,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                );
              })}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 p-0 backdrop-blur-sm md:p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-card shadow-soft md:h-[640px] md:rounded-3xl"
            >
              {/* Header */}
              <div className="relative flex items-center gap-3 overflow-hidden bg-gradient-navy px-5 py-4 text-primary-foreground">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-20%,oklch(0.78_0.12_85/.35),transparent_60%)]"
                />
                <div className="relative h-14 w-14">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={pose}
                      src={POSES[pose]}
                      alt="Gippy"
                      className="absolute inset-0 h-14 w-14 drop-shadow"
                      initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.7, opacity: 0, rotate: 8 }}
                      transition={{ type: "spring", damping: 16 }}
                    />
                  </AnimatePresence>
                </div>
                <div className="relative">
                  <div className="font-display text-lg font-semibold">Gippy</div>
                  <div className="flex items-center gap-1.5 text-xs opacity-90">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.78_0.18_150)]" />
                    Online · K-Beauty AI
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="relative ml-auto rounded-full p-1.5 hover:bg-white/10"
                  aria-label="Reset"
                  title="Reset"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="relative rounded-full p-1.5 hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto bg-gradient-luxe px-4 py-4"
              >
                {messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}

                {typing && <TypingBubble />}

                {!typing && mode === "menu" && messages.length <= 1 && (
                  <div className="grid gap-2 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-sm">
                    <div className="text-xs font-semibold text-foreground">
                      Ask freely first, or use a short guide
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setChatUiMode("natural");
                          setMode("recommend");
                        }}
                        className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${chatUiMode === "natural" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/60"}`}
                      >
                        <span className="block font-semibold">AI 자유채팅</span>
                        <span className="block opacity-80">Ask naturally</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChatUiMode("tree");
                          setMode("menu");
                        }}
                        className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${chatUiMode === "tree" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/60"}`}
                      >
                        <span className="block font-semibold">Guided 상담</span>
                        <span className="block opacity-80">Simple buttons</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Natural AI is the default. Guided mode shows only grouped choices.
                    </div>
                  </div>
                )}

                {/* Admin-managed tree replies */}
                {!typing &&
                  chatUiMode === "tree" &&
                  mode === "menu" &&
                  visibleTreeNodes.length > 0 && (
                    <div className="grid gap-2 pt-2">
                      {treeParentId && (
                        <button
                          type="button"
                          onClick={backTree}
                          className="rounded-2xl border border-border/60 bg-card/90 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/60"
                        >
                          ← Back
                        </button>
                      )}
                      {visibleTreeNodes.map((node) => (
                        <QuickAction
                          key={node.id}
                          icon={<MessageCircle className="h-4 w-4" />}
                          label={labelForTreeNode(node)}
                          sub={
                            node.action_type === "document"
                              ? "Knowledge document"
                              : node.action_type === "contact"
                                ? "Connect with team"
                                : "Guided answer"
                          }
                          onClick={() => pickTreeNode(node)}
                        />
                      ))}
                    </div>
                  )}

                {/* Built-in fallback quick replies */}
                {!typing &&
                  chatUiMode === "tree" &&
                  mode === "menu" &&
                  messages.length <= 1 &&
                  visibleTreeNodes.length === 0 && (
                    <div className="grid gap-2 pt-2">
                      <QuickAction
                        icon={<Droplets className="h-4 w-4" />}
                        label="Skin type diagnosis"
                        sub="Dry · Oily · Combo · Sensitive"
                        onClick={async () => {
                          await reply(() => ({
                            id: uid(),
                            role: "gippy",
                            content: "Which sales channel are you planning for?",
                          }));
                          setMode("skin");
                        }}
                      />
                      <QuickAction
                        icon={<Heart className="h-4 w-4" />}
                        label="Recommend by concern"
                        sub="Hydration · Brightening · Aging…"
                        onClick={async () => {
                          await reply(() => ({
                            id: uid(),
                            role: "gippy",
                            content: "Which product category or business need should we focus on?",
                          }));
                          setMode("concern");
                        }}
                      />
                      <QuickAction
                        icon={<Briefcase className="h-4 w-4" />}
                        label="B2B / Dealer inquiry"
                        sub="Become an authorized partner"
                        onClick={async () => {
                          await reply(() => ({
                            id: uid(),
                            role: "gippy",
                            content:
                              "Thanks for your interest in our B2B partnership! 🤝 Submit an application or chat with a manager.",
                            cta: "b2b",
                          }));
                          setMode("b2b");
                        }}
                      />
                      <QuickAction
                        icon={<UserCircle2 className="h-4 w-4" />}
                        label="Chat with a local manager"
                        sub="Zalo / WhatsApp"
                        onClick={async () => {
                          await reply(() => ({
                            id: uid(),
                            role: "gippy",
                            content: "Connecting you with our Vietnam team 🇻🇳",
                            cta: "managers",
                          }));
                          setMode("manager");
                        }}
                      />
                    </div>
                  )}

                {!typing && mode === "skin" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SKIN_TYPES.map((t) => (
                      <Chip key={t} onClick={() => pickSkin(t)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                )}

                {!typing && mode === "concern" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {CONCERNS.map((c) => (
                      <Chip key={c} onClick={() => pickConcern(c)}>
                        {c}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border/60 bg-card p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendUser(input);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      chatUiMode === "tree"
                        ? "Select a partner guide above or ask freely…"
                        : "Ask Gippy about products, wholesale, or partnership…"
                    }
                    maxLength={300}
                    className="flex-1 rounded-full border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary/50"
                  />
                  <Button type="submit" size="icon" className="rounded-full bg-gradient-navy">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-gold" />
                  Powered by shared GPCLUB knowledge ·{" "}
                  {chatUiMode === "tree" ? "Guided" : "Natural AI"}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- pieces ---------- */

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}
    >
      {!isUser && (
        <img src={gippyFront} alt="" className="mt-auto h-8 w-8 shrink-0 self-end drop-shadow" />
      )}
      <div className={`flex max-w-[85%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {msg.content &&
          (isUser ? (
            <div className="whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {msg.content}
            </div>
          ) : (
            <TypewriterBubble text={msg.content} />
          ))}
        {msg.products && msg.products.length > 0 && (
          <div className="grid w-full gap-2">
            {msg.products.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-2 shadow-sm"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={getCoverImage(p)}
                    alt={p.product_name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                    {p.brand_name} · {p.product_type}
                  </div>
                  <div className="line-clamp-1 text-sm font-medium">{p.product_name}</div>
                  <div className="line-clamp-1 text-[11px] text-muted-foreground">
                    {p.short_intro}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {msg.cta === "managers" && <ManagerCTAs />}
        {msg.cta === "b2b" && <B2BCTAs />}
      </div>
    </motion.div>
  );
}

function TypewriterBubble({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const total = text.length;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setShown(Math.min(i, total));
      if (i >= total) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [text]);
  const visible = text.slice(0, shown);
  const html = visible
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-card px-4 py-2.5 text-sm text-foreground shadow-sm"
    >
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {shown < text.length && (
        <motion.span
          className="ml-0.5 inline-block h-3 w-[2px] -mb-0.5 bg-primary align-middle"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      className="flex items-end gap-2"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.img
        src={gippyChatImg}
        alt=""
        className="h-9 w-9 drop-shadow"
        animate={{ rotate: [-4, 4, -4], y: [0, -2, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/70"
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ManagerCTAs() {
  const company = useCompanyInfo();
  return (
    <div className="flex w-full gap-2">
      <Button asChild size="sm" className="flex-1 rounded-full bg-[#0068ff] hover:bg-[#0068ff]/90">
        <a href={buildZaloLink(company.zaloPhone)} target="_blank" rel="noreferrer">
          <MessageCircle className="mr-1 h-4 w-4" /> Zalo
        </a>
      </Button>
      <Button asChild size="sm" className="flex-1 rounded-full bg-[#25D366] hover:bg-[#25D366]/90">
        <a href={buildWhatsappLink(company.whatsappPhone)} target="_blank" rel="noreferrer">
          <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
        </a>
      </Button>
    </div>
  );
}

function B2BCTAs() {
  return (
    <div className="flex w-full flex-col gap-2">
      <Button asChild size="sm" className="rounded-full bg-gradient-navy">
        <a href="/b2b">
          <Briefcase className="mr-1 h-4 w-4" /> Apply for B2B
        </a>
      </Button>
      <ManagerCTAs />
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
    >
      {children}
    </button>
  );
}

function QuickAction({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition hover:border-primary hover:shadow-soft"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-luxe text-primary group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {sub && <span className="block text-[11px] font-normal text-muted-foreground">{sub}</span>}
      </span>
    </button>
  );
}
