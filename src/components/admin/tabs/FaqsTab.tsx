import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { type AdminLang, ADMIN_I18N, tx } from "@/components/admin/admin-i18n";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FaqRow = Database["public"]["Tables"]["faqs"]["Row"];
type FAQ = {
  id?: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  published: boolean;
};
const emptyFaq: FAQ = {
  question: "",
  answer: "",
  category: "general",
  sort_order: 0,
  published: true,
};

type FaqLangFilter = "ko" | "en" | "vi";

const FAQ_LANG_OPTIONS: { value: FaqLangFilter; label: string }[] = [
  { value: "ko", label: "???" },
  { value: "en", label: "English" },
  { value: "vi", label: "Ti?ng Vi?t" },
];

const getFaqLang = (category?: string | null): FaqLangFilter => {
  if ((category ?? "").startsWith("EN | ")) return "en";
  if ((category ?? "").startsWith("VI | ")) return "vi";
  return "ko";
};

const stripFaqLangPrefix = (category?: string | null) =>
  (category ?? "").replace(/^(EN|VI) \| /, "");

export default function FaqsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [open, setOpen] = useState(false);
  const [faqLang, setFaqLang] = useState<FaqLangFilter>("ko");

  const load = async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("sort_order")
      .order("created_at");
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.question.trim() || !editing.answer.trim())
      return toast.error(t("questionAnswerRequired"));
    const payload = { ...editing };
    const res = editing.id
      ? await supabase.from("faqs").update(payload).eq("id", editing.id)
      : await supabase.from("faqs").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteFaqConfirm"))) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const visibleRows = rows.filter((row) => getFaqLang(row.category) === faqLang);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl">
            {t("faq")} ({visibleRows.length}/{rows.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {FAQ_LANG_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={faqLang === option.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setFaqLang(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(emptyFaq);
            setOpen(true);
          }}
          className="rounded-full"
        >
          <Plus className="mr-1 h-4 w-4" /> {t("newFaq")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("question")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("order")}</TableHead>
              <TableHead>{t("published")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  {t("noFaqs")}
                </TableCell>
              </TableRow>
            )}
            {visibleRows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="max-w-md">
                  <div className="font-medium">{f.question}</div>
                  <div className="truncate text-xs text-muted-foreground">{f.answer}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{stripFaqLangPrefix(f.category)}</Badge>
                </TableCell>
                <TableCell className="text-sm">{f.sort_order}</TableCell>
                <TableCell>
                  {f.published ? (
                    <Badge>{t("live")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("draft")}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(f);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editFaq") : t("newFaq")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>{t("question")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("answer")}</Label>
                <Textarea
                  className="mt-1.5"
                  rows={5}
                  value={editing.answer}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("category")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("sortOrder")}</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <Label>{t("published")}</Label>
                <Switch
                  checked={editing.published}
                  onCheckedChange={(v) => setEditing({ ...editing, published: v })}
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
    </div>
  );
}
