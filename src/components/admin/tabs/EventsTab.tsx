import { PackageOpen, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import { type AdminLang, ADMIN_I18N, tx } from "@/components/admin/admin-i18n";
import { pageRange } from "@/components/admin/admin-shared";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventItem = {
  id?: string;
  title_vi: string;
  title_en: string;
  summary_vi: string | null;
  summary_en: string | null;
  body_vi: string | null;
  body_en: string | null;
  media_url: string | null;
  media_type: string;
  cta_label_vi: string | null;
  cta_label_en: string | null;
  cta_url: string | null;
  event_date: string | null;
  sort_order: number;
  featured: boolean;
  published: boolean;
  post_type: "event" | "new_product";
};

const emptyEvent: EventItem = {
  title_vi: "",
  title_en: "",
  summary_vi: "",
  summary_en: "",
  body_vi: "",
  body_en: "",
  media_url: "",
  media_type: "image",
  cta_label_vi: "",
  cta_label_en: "",
  cta_url: "",
  event_date: "",
  sort_order: 0,
  featured: false,
  published: false,
  post_type: "event",
};

export default function EventsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  const load = async () => {
    setLoading(true);
    const { from, to } = pageRange(page);
    const { data, error, count } = await supabase
      .from("events")
      .select("*", { count: "estimated" })
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: false })
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) toast.error(error.message);
    else {
      setRows(data ?? []);
      setTotalRows(count ?? data?.length ?? 0);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [page]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title_vi.trim() || !editing.title_en.trim()) {
      toast.error(t("titleViEnRequired"));
      return;
    }
    const payload = {
      ...editing,
      summary_vi: editing.summary_vi || null,
      summary_en: editing.summary_en || null,
      body_vi: editing.body_vi || null,
      body_en: editing.body_en || null,
      media_url: editing.media_url || null,
      cta_label_vi: editing.cta_label_vi || null,
      cta_label_en: editing.cta_label_en || null,
      cta_url: editing.cta_url || null,
      event_date: editing.event_date || null,
      sort_order: Number(editing.sort_order) || 0,
      post_type: editing.post_type || "event",
    };
    const res = editing.id
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteEventConfirm"))) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const togglePublished = async (id: string, published: boolean) => {
    const { error } = await supabase.from("events").update({ published }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, published } : x)));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">
            {t("events")} ({rows.length})
          </h2>
          <p className="text-sm text-muted-foreground">{t("eventPageDesc")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="rounded-full">
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
          <Button
            onClick={() => {
              setEditing({ ...emptyEvent });
              setOpen(true);
            }}
            className="rounded-full"
          >
            <Plus className="mr-1 h-4 w-4" /> {t("newEvent")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("media")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("featured")}</TableHead>
              <TableHead>{t("published")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("noEvents")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-md">
                  <div className="font-medium">{r.title_en}</div>
                  <div className="text-xs text-muted-foreground">{r.title_vi}</div>
                </TableCell>
                <TableCell>
                  {r.post_type === "new_product" ? (
                    <Badge className="gap-1">
                      <PackageOpen className="h-3 w-3" /> {t("newProduct")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("event")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{r.media_type}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.event_date ? new Date(r.event_date).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>
                  {r.featured ? (
                    <Badge>{t("featured")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("normal")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch checked={r.published} onCheckedChange={(v) => togglePublished(r.id, v)} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing({
                        ...r,
                        post_type: r.post_type === "new_product" ? "new_product" : "event",
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editEvent") : t("newEvent")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr]">
                <div>
                  <Label>{t("contentType")}</Label>
                  <Select
                    value={editing.post_type}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        post_type: v as "event" | "new_product",
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">{t("event")}</SelectItem>
                      <SelectItem value="new_product">{t("newProductSpotlight")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("titleVi")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.title_vi}
                    onChange={(e) => setEditing({ ...editing, title_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("titleEn")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.title_en}
                    onChange={(e) => setEditing({ ...editing, title_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("summary")} VI</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={3}
                    value={editing.summary_vi ?? ""}
                    onChange={(e) => setEditing({ ...editing, summary_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("summary")} EN</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={3}
                    value={editing.summary_en ?? ""}
                    onChange={(e) => setEditing({ ...editing, summary_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("body")} VI</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={6}
                    value={editing.body_vi ?? ""}
                    onChange={(e) => setEditing({ ...editing, body_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("body")} EN</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={6}
                    value={editing.body_en ?? ""}
                    onChange={(e) => setEditing({ ...editing, body_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <div>
                  <Label>{t("mediaType")}</Label>
                  <Select
                    value={editing.media_type}
                    onValueChange={(v) => setEditing({ ...editing, media_type: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">{t("imageUrlOption")}</SelectItem>
                      <SelectItem value="video">{t("videoUrl")}</SelectItem>
                      <SelectItem value="embed">{t("embedUrl")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("mediaUrl")}</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="https://..."
                    value={editing.media_url ?? ""}
                    onChange={(e) => setEditing({ ...editing, media_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>{t("eventDate")}</Label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={editing.event_date ?? ""}
                    onChange={(e) => setEditing({ ...editing, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("sortOrder")}</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 pt-7">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <Label>{t("featured")}</Label>
                    <Switch
                      checked={editing.featured}
                      onCheckedChange={(v) => setEditing({ ...editing, featured: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <Label>{t("published")}</Label>
                    <Switch
                      checked={editing.published}
                      onCheckedChange={(v) => setEditing({ ...editing, published: v })}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>{t("ctaVi")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.cta_label_vi ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_label_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("ctaEn")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.cta_label_en ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_label_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("ctaUrl")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.cta_url ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })}
                  />
                </div>
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
