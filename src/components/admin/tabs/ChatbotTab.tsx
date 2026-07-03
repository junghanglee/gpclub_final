import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { type AdminLang, ADMIN_I18N, statusText, tx } from "@/components/admin/admin-i18n";
import { CHATBOT_RECORD_LIMIT } from "@/components/admin/admin-shared";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { chunkText } from "@/lib/chatbot-training";

const CHATBOT_ADMIN_LIMIT = 100;
const CHATBOT_CHUNK_BATCH_SIZE = 25;

const waitForBrowser = () => new Promise((resolve) => window.setTimeout(resolve, 0));
type Train = {
  id?: string;
  kind: string;
  title: string | null;
  question: string | null;
  answer: string | null;
  content: string | null;
  tags: string[];
  enabled: boolean;
};
const emptyTrain: Train = {
  kind: "qa",
  title: "",
  question: "",
  answer: "",
  content: "",
  tags: [],
  enabled: true,
};

type ChatbotDocument = {
  id?: string;
  title: string;
  description: string | null;
  raw_content: string | null;
  language: string;
  category: string;
  source_type: string;
  file_url: string | null;
  status: string;
  enabled: boolean;
  version: number;
  tags: string[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ChatbotChunkRow = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  metadata: Json;
  created_at: string;
};

type ChatbotTreeNode = {
  id?: string;
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
  linked_training_id: string | null;
  linked_document_id: string | null;
  enabled: boolean;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
};

const emptyTreeNode: ChatbotTreeNode = {
  scenario_key: "default",
  parent_id: null,
  sort_order: 0,
  label_ko: "",
  label_en: "",
  label_vi: "",
  answer_ko: "",
  answer_en: "",
  answer_vi: "",
  action_type: "answer",
  linked_training_id: null,
  linked_document_id: null,
  enabled: true,
  metadata: {},
};

const emptyDocument: ChatbotDocument = {
  title: "",
  description: "",
  raw_content: "",
  language: "mixed",
  category: "manual",
  source_type: "pasted_text",
  file_url: "",
  status: "active",
  enabled: true,
  version: 1,
  tags: [],
};

export default function ChatbotTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<Train[]>([]);
  const [docs, setDocs] = useState<ChatbotDocument[]>([]);
  const [treeNodes, setTreeNodes] = useState<ChatbotTreeNode[]>([]);
  const [chunks, setChunks] = useState<Record<string, ChatbotChunkRow[]>>({});
  const [editing, setEditing] = useState<Train | null>(null);
  const [docEditing, setDocEditing] = useState<ChatbotDocument | null>(null);
  const [treeEditing, setTreeEditing] = useState<ChatbotTreeNode | null>(null);
  const [open, setOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ChatbotDocument | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [docFilter, setDocFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    const [
      { data: training, error: trainingError },
      { data: documents, error: docsError },
      { data: tree, error: treeError },
    ] = await Promise.all([
      supabase
        .from("chatbot_training")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(CHATBOT_ADMIN_LIMIT),
      supabase
        .from("chatbot_documents")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(CHATBOT_ADMIN_LIMIT),
      supabase
        .from("chatbot_tree_nodes")
        .select("*")
        .order("scenario_key", { ascending: true })
        .order("sort_order", { ascending: true })
        .limit(CHATBOT_ADMIN_LIMIT),
    ]);
    if (trainingError) toast.error(trainingError.message);
    else setRows((training ?? []).map((row) => ({ ...row, tags: row.tags ?? [] })));
    if (docsError) toast.error(docsError.message);
    else setDocs((documents ?? []) as ChatbotDocument[]);
    if (treeError) toast.error(treeError.message);
    else setTreeNodes((tree ?? []) as ChatbotTreeNode[]);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.kind === filter)),
    [rows, filter],
  );

  const filteredDocs = useMemo(
    () =>
      docFilter === "all"
        ? docs
        : docs.filter((doc) => doc.category === docFilter || doc.status === docFilter),
    [docs, docFilter],
  );

  const save = async () => {
    if (!editing) return;
    if (editing.kind === "qa" && (!editing.question?.trim() || !editing.answer?.trim()))
      return toast.error(t("questionAnswerRequired"));
    if (editing.kind !== "qa" && !editing.title?.trim()) return toast.error(t("titleRequired"));
    const payload = { ...editing, tags: editing.tags ?? [] };
    const res = editing.id
      ? await supabase.from("chatbot_training").update(payload).eq("id", editing.id)
      : await supabase.from("chatbot_training").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteEntryConfirm"))) return;
    const { error } = await supabase.from("chatbot_training").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const loadChunks = async (documentId: string) => {
    const { data, error } = await supabase
      .from("chatbot_document_chunks")
      .select("*")
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true })
      .limit(CHATBOT_RECORD_LIMIT);
    if (error) return toast.error(error.message);
    setChunks((prev) => ({
      ...prev,
      [documentId]: (data ?? []) as ChatbotChunkRow[],
    }));
  };

  const processDocument = async (doc: ChatbotDocument) => {
    if (!doc.id) return;
    if (!doc.title.trim() || !doc.raw_content?.trim()) return toast.error(t("documentRequired"));
    setProcessingId(doc.id);
    const now = new Date().toISOString();
    const job = await supabase
      .from("chatbot_training_jobs")
      .insert({ document_id: doc.id, status: "running", started_at: now })
      .select("id")
      .single();
    const jobId = job.data?.id;
    try {
      await waitForBrowser();
      const newChunks = chunkText(doc.raw_content, {
        maxChars: 1100,
        overlapChars: 160,
      }).map((chunk, index) => ({
        document_id: doc.id!,
        chunk_index: index,
        content: chunk.content,
        content_hash: chunk.content_hash,
        language: doc.language || "mixed",
        token_count: chunk.token_count,
        metadata: {
          ...(chunk.metadata ?? {}),
          title: doc.title,
          category: doc.category,
          tags: doc.tags ?? [],
        },
      }));
      const del = await supabase.from("chatbot_document_chunks").delete().eq("document_id", doc.id);
      if (del.error) throw del.error;
      for (let index = 0; index < newChunks.length; index += CHATBOT_CHUNK_BATCH_SIZE) {
        const batch = newChunks.slice(index, index + CHATBOT_CHUNK_BATCH_SIZE);
        if (batch.length) {
          const ins = await supabase.from("chatbot_document_chunks").insert(batch);
          if (ins.error) throw ins.error;
        }
        await waitForBrowser();
      }
      if (jobId) {
        await supabase
          .from("chatbot_training_jobs")
          .update({
            status: "completed",
            finished_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
      toast.success(t("processingComplete"));
      await loadChunks(doc.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (jobId) {
        await supabase
          .from("chatbot_training_jobs")
          .update({
            status: "failed",
            error_message: message,
            finished_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
      toast.error(message);
    } finally {
      setProcessingId(null);
      load();
    }
  };

  const saveDocument = async () => {
    if (!docEditing) return;
    if (!docEditing.title.trim() || !docEditing.raw_content?.trim())
      return toast.error(t("documentRequired"));
    const payload = {
      title: docEditing.title,
      description: docEditing.description || null,
      raw_content: docEditing.raw_content || null,
      language: docEditing.language || "mixed",
      category: docEditing.category || "other",
      source_type: docEditing.source_type || "pasted_text",
      file_url: docEditing.file_url || null,
      status: docEditing.status || "active",
      enabled: docEditing.enabled,
      version: docEditing.version || 1,
      tags: docEditing.tags ?? [],
    };
    const res = docEditing.id
      ? await supabase
          .from("chatbot_documents")
          .update(payload)
          .eq("id", docEditing.id)
          .select("*")
          .single()
      : await supabase.from("chatbot_documents").insert(payload).select("*").single();
    if (res.error) return toast.error(res.error.message);
    const savedDoc = res.data as ChatbotDocument;
    toast.success(t("saved"));
    setDocOpen(false);
    setDocEditing(null);
    await load();
    await processDocument(savedDoc);
  };

  const removeDocument = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const { error } = await supabase.from("chatbot_documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setDocs((xs) => xs.filter((x) => x.id !== id));
    setChunks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveTreeNode = async () => {
    if (!treeEditing) return;
    if (!treeEditing.scenario_key.trim()) return toast.error(t("scenarioId"));
    if (
      !treeEditing.label_en?.trim() &&
      !treeEditing.label_vi?.trim() &&
      !treeEditing.label_ko?.trim()
    )
      return toast.error(t("buttonLabel"));
    const payload = {
      scenario_key: treeEditing.scenario_key || "default",
      parent_id: treeEditing.parent_id || null,
      sort_order: Number(treeEditing.sort_order) || 0,
      label_ko: treeEditing.label_ko || null,
      label_en: treeEditing.label_en || null,
      label_vi: treeEditing.label_vi || null,
      answer_ko: treeEditing.answer_ko || null,
      answer_en: treeEditing.answer_en || null,
      answer_vi: treeEditing.answer_vi || null,
      action_type: treeEditing.action_type || "answer",
      linked_training_id: treeEditing.linked_training_id || null,
      linked_document_id: treeEditing.linked_document_id || null,
      enabled: treeEditing.enabled,
      metadata: treeEditing.metadata ?? {},
    };
    const res = treeEditing.id
      ? await supabase.from("chatbot_tree_nodes").update(payload).eq("id", treeEditing.id)
      : await supabase.from("chatbot_tree_nodes").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setTreeOpen(false);
    setTreeEditing(null);
    load();
  };

  const removeTreeNode = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const { error } = await supabase.from("chatbot_tree_nodes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTreeNodes((xs) => xs.filter((x) => x.id !== id));
  };

  const openPreview = async (doc: ChatbotDocument) => {
    if (!doc.id) return;
    setPreviewDoc(doc);
    if (!chunks[doc.id]) await loadChunks(doc.id);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{t("chatbotTraining")}</h2>
            <p className="text-sm text-muted-foreground">{t("chatbotTrainingDesc")}</p>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-bold text-foreground">{rows.length}</div>
              {t("trainingEntries")}
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-bold text-foreground">{docs.length}</div>
              {t("documentLibrary")}
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-bold text-foreground">{treeNodes.length}</div>
              {t("treeScenario")}
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-bold text-foreground">
                {Object.values(chunks).reduce((sum, xs) => sum + xs.length, 0)}
              </div>
              {t("chunks")}
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 p-4">
            <div className="font-semibold">{t("qaPair")}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Frequently asked questions and exact approved answers.
            </p>
            <Button
              className="mt-3 h-8 rounded-full"
              variant="outline"
              onClick={() => {
                setEditing({ ...emptyTrain, kind: "qa" });
                setOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("newTrainingEntry")}
            </Button>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <div className="font-semibold">{t("productInfo")}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Product facts, benefits, target skin concerns, and recommendation notes.
            </p>
            <Button
              className="mt-3 h-8 rounded-full"
              variant="outline"
              onClick={() => {
                setEditing({ ...emptyTrain, kind: "product" });
                setOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("productInfo")}
            </Button>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <div className="font-semibold">{t("documentLibrary")}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t("documentLibraryDesc")}</p>
            <Button
              className="mt-3 h-8 rounded-full"
              variant="outline"
              onClick={() => {
                setDocEditing({ ...emptyDocument });
                setDocOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("newDocument")}
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <div className="font-semibold">{t("treeMode")}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t("treeModeDesc")}</p>
            <Button
              className="mt-3 h-8 rounded-full"
              variant="outline"
              onClick={() => {
                setTreeEditing({ ...emptyTreeNode });
                setTreeOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("treeScenario")}
            </Button>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">{t("documentLibrary")}</h3>
            <p className="text-sm text-muted-foreground">{t("documentLibraryDesc")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={docFilter} onValueChange={setDocFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="brand">{t("brand")}</SelectItem>
                <SelectItem value="product">{t("product")}</SelectItem>
                <SelectItem value="b2b">{t("b2bCategory")}</SelectItem>
                <SelectItem value="policy">{t("policy")}</SelectItem>
                <SelectItem value="manual">{t("manual")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="draft">{t("draft")}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={load} variant="outline" className="rounded-full">
              <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
            </Button>
            <Button
              onClick={() => {
                setDocEditing({ ...emptyDocument });
                setDocOpen(true);
              }}
              className="rounded-full"
            >
              <Plus className="mr-1 h-4 w-4" /> {t("newDocument")}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("language")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("tags")}</TableHead>
                <TableHead>{t("chunks")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {t("noTrainingData")}
                  </TableCell>
                </TableRow>
              )}
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="max-w-sm">
                    <div className="font-medium">{doc.title || t("untitled")}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {doc.description || doc.raw_content}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{statusText(lang, doc.category)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs uppercase">{doc.language}</TableCell>
                  <TableCell>
                    {doc.enabled && doc.status === "active" ? (
                      <Badge>{t("active")}</Badge>
                    ) : (
                      <Badge variant="secondary">{statusText(lang, doc.status)}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                    {(doc.tags ?? []).join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {doc.id && chunks[doc.id] ? chunks[doc.id].length : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openPreview(doc)}>
                      {t("previewChunks")}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={processingId === doc.id}
                      onClick={() => processDocument(doc)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setDocEditing({ ...doc, tags: doc.tags ?? [] });
                        setDocOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => doc.id && removeDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">{t("treeScenario")}</h3>
            <p className="text-sm text-muted-foreground">{t("chatUiModesDesc")}</p>
          </div>
          <Button
            onClick={() => {
              setTreeEditing({ ...emptyTreeNode });
              setTreeOpen(true);
            }}
            className="rounded-full"
          >
            <Plus className="mr-1 h-4 w-4" /> {t("treeScenario")}
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("scenarioId")}</TableHead>
                <TableHead>{t("parentId")}</TableHead>
                <TableHead>{t("buttonLabel")}</TableHead>
                <TableHead>{t("answerMode")}</TableHead>
                <TableHead>{t("enabled")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treeNodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t("noTrainingData")}
                  </TableCell>
                </TableRow>
              )}
              {treeNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell>
                    <Badge variant="outline">{node.scenario_key}</Badge>
                    <div className="text-xs text-muted-foreground">#{node.sort_order}</div>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                    {node.parent_id || "root"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {node.label_en || node.label_vi || node.label_ko || t("untitled")}
                    </div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {node.answer_en || node.answer_vi || node.answer_ko}
                    </div>
                  </TableCell>
                  <TableCell>{node.action_type}</TableCell>
                  <TableCell>
                    {node.enabled ? (
                      <Badge>{t("on")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("off")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setTreeEditing({ ...node });
                        setTreeOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => node.id && removeTreeNode(node.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">{t("trainingEntries")}</h3>
            <p className="text-sm text-muted-foreground">
              Q&A, product snippets, and short freeform notes remain compatible with the existing
              chatbot_training table.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="qa">{t("qa")}</SelectItem>
                <SelectItem value="product">{t("product")}</SelectItem>
                <SelectItem value="doc">{t("document")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditing(emptyTrain);
                setOpen(true);
              }}
              className="rounded-full"
            >
              <Plus className="mr-1 h-4 w-4" /> {t("newTrainingEntry")}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("titleQuestion")}</TableHead>
                <TableHead>{t("tags")}</TableHead>
                <TableHead>{t("enabled")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    {t("noTrainingData")}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="outline">{r.kind}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="font-medium">{r.title || r.question || t("untitled")}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.answer || r.content}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(r.tags ?? []).join(", ") || "-"}
                  </TableCell>
                  <TableCell>
                    {r.enabled ? (
                      <Badge>{t("on")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("off")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing({ ...r, tags: r.tags ?? [] });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => r.id && remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editEntry") : t("newTrainingEntry")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>{t("type")}</Label>
                <Select
                  value={editing.kind}
                  onValueChange={(v) => setEditing({ ...editing, kind: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qa">{t("qaPair")}</SelectItem>
                    <SelectItem value="product">{t("productInfo")}</SelectItem>
                    <SelectItem value="doc">{t("documentFreeform")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editing.kind === "qa" ? (
                <>
                  <div>
                    <Label>{t("question")}</Label>
                    <Input
                      className="mt-1.5"
                      value={editing.question ?? ""}
                      onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("answer")}</Label>
                    <Textarea
                      className="mt-1.5"
                      rows={4}
                      value={editing.answer ?? ""}
                      onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>{t("title")}</Label>
                    <Input
                      className="mt-1.5"
                      value={editing.title ?? ""}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("content")}</Label>
                    <Textarea
                      className="mt-1.5"
                      rows={6}
                      value={editing.content ?? ""}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div>
                <Label>{t("tagsComma")}</Label>
                <Input
                  className="mt-1.5"
                  value={(editing.tags ?? []).join(", ")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      tags: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <Label>{t("enabled")}</Label>
                <Switch
                  checked={editing.enabled}
                  onCheckedChange={(v) => setEditing({ ...editing, enabled: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={save}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{docEditing?.id ? t("editDocument") : t("newDocument")}</DialogTitle>
          </DialogHeader>
          {docEditing && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("title")}</Label>
                  <Input
                    className="mt-1.5"
                    value={docEditing.title}
                    onChange={(e) => setDocEditing({ ...docEditing, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("sourceScope")}</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="PDF URL or internal source note"
                    value={docEditing.file_url ?? ""}
                    onChange={(e) => setDocEditing({ ...docEditing, file_url: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t("description")}</Label>
                <Input
                  className="mt-1.5"
                  value={docEditing.description ?? ""}
                  onChange={(e) =>
                    setDocEditing({
                      ...docEditing,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>{t("category")}</Label>
                  <Select
                    value={docEditing.category}
                    onValueChange={(v) => setDocEditing({ ...docEditing, category: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand">{t("brand")}</SelectItem>
                      <SelectItem value="product">{t("product")}</SelectItem>
                      <SelectItem value="b2b">{t("b2bCategory")}</SelectItem>
                      <SelectItem value="policy">{t("policy")}</SelectItem>
                      <SelectItem value="manual">{t("manual")}</SelectItem>
                      <SelectItem value="other">{t("other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("language")}</Label>
                  <Select
                    value={docEditing.language}
                    onValueChange={(v) => setDocEditing({ ...docEditing, language: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">{t("mixed")}</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="vi">Ti?ng Vi?t</SelectItem>
                      <SelectItem value="ko">???</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("status")}</Label>
                  <Select
                    value={docEditing.status}
                    onValueChange={(v) => setDocEditing({ ...docEditing, status: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="draft">{t("draft")}</SelectItem>
                      <SelectItem value="archived">{t("archived")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Version</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={1}
                    value={docEditing.version}
                    onChange={(e) =>
                      setDocEditing({
                        ...docEditing,
                        version: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>{t("tagsComma")}</Label>
                <Input
                  className="mt-1.5"
                  value={(docEditing.tags ?? []).join(", ")}
                  onChange={(e) =>
                    setDocEditing({
                      ...docEditing,
                      tags: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div>
                <Label>{t("rawContent")}</Label>
                <Textarea
                  className="mt-1.5 font-mono text-xs"
                  rows={14}
                  placeholder={t("rawContentHint")}
                  value={docEditing.raw_content ?? ""}
                  onChange={(e) =>
                    setDocEditing({
                      ...docEditing,
                      raw_content: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <Label>{t("enabled")}</Label>
                  <p className="text-xs text-muted-foreground">
                    Only enabled + active documents are used in chatbot retrieval.
                  </p>
                </div>
                <Switch
                  checked={docEditing.enabled}
                  onCheckedChange={(v) => setDocEditing({ ...docEditing, enabled: v })}
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Preview: {chunkText(docEditing.raw_content ?? "").length} {t("chunks")}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={saveDocument}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={treeOpen} onOpenChange={setTreeOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("treeScenario")}</DialogTitle>
          </DialogHeader>
          {treeEditing && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t("scenarioId")}</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.scenario_key}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        scenario_key: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("parentId")}</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="root"
                    value={treeEditing.parent_id ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        parent_id: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("sortOrder")}</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={treeEditing.sort_order}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t("buttonLabel")} EN</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.label_en ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        label_en: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("buttonLabel")} VI</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.label_vi ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        label_vi: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("buttonLabel")} KO</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.label_ko ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        label_ko: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t("answer")} EN</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={5}
                    value={treeEditing.answer_en ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        answer_en: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("answer")} VI</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={5}
                    value={treeEditing.answer_vi ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        answer_vi: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("answer")} KO</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={5}
                    value={treeEditing.answer_ko ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        answer_ko: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t("answerMode")}</Label>
                  <Select
                    value={treeEditing.action_type}
                    onValueChange={(v) => setTreeEditing({ ...treeEditing, action_type: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="answer">Answer</SelectItem>
                      <SelectItem value="children">Show children</SelectItem>
                      <SelectItem value="document">Linked document</SelectItem>
                      <SelectItem value="contact">Contact CTA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("document")}</Label>
                  <Select
                    value={treeEditing.linked_document_id ?? "none"}
                    onValueChange={(v) =>
                      setTreeEditing({
                        ...treeEditing,
                        linked_document_id: v === "none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {docs.map(
                        (doc) =>
                          doc.id && (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.title}
                            </SelectItem>
                          ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <Label>{t("enabled")}</Label>
                  <Switch
                    checked={treeEditing.enabled}
                    onCheckedChange={(v) => setTreeEditing({ ...treeEditing, enabled: v })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTreeOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={saveTreeNode}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDoc} onOpenChange={(v) => !v && setPreviewDoc(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("previewChunks")} - {previewDoc?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {previewDoc?.id && (chunks[previewDoc.id] ?? []).length === 0 && (
              <div className="rounded-xl bg-muted p-6 text-center text-muted-foreground">
                No chunks yet. Click process document.
              </div>
            )}
            {previewDoc?.id &&
              (chunks[previewDoc.id] ?? []).map((chunk) => (
                <div key={chunk.id} className="rounded-xl border border-border/60 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline">#{chunk.chunk_index + 1}</Badge>
                    <span>{chunk.token_count} tokens</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{chunk.content}</div>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Products ---------------- */
