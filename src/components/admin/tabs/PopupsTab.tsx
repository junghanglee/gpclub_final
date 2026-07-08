import { ImagePlus, Pencil, Plus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { type DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type ADMIN_I18N, type AdminLang, tx } from "@/components/admin/admin-i18n";
import { PaginationControls } from "@/components/admin/admin-pagination-controls";
import { ADMIN_PAGE_SIZE, pageRange } from "@/components/admin/admin-shared";
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
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PopupRow = Database["public"]["Tables"]["popups"]["Row"];
type Popup = {
  id?: string;
  title: string;
  content: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
};

const emptyPopup: Popup = {
  title: "",
  content: "",
  image_url: "",
  cta_label: "",
  cta_url: "",
  active: false,
  priority: 0,
  starts_at: null,
  ends_at: null,
};

const POPUP_MEDIA_BUCKET = "event-media";
const acceptedMedia = "image/*";

const safeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "popup";

const isoToLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};
const localInputToIso = (v: string) => (v ? new Date(v).toISOString() : null);

const popupSchedulingState = (p: {
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}) => {
  if (!p.active) return { label: "Off", variant: "secondary" as const };
  const now = Date.now();
  if (p.starts_at && new Date(p.starts_at).getTime() > now) {
    return { label: "Scheduled", variant: "outline" as const };
  }
  if (p.ends_at && new Date(p.ends_at).getTime() < now) {
    return { label: "Expired", variant: "secondary" as const };
  }
  return { label: "Live", variant: "default" as const };
};

export default function PopupsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const popupStateLabel = (label: string) =>
    label === "Off"
      ? t("off")
      : label === "Scheduled"
        ? t("scheduled")
        : label === "Expired"
          ? t("expired")
          : t("live");
  const [rows, setRows] = useState<PopupRow[]>([]);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = pageRange(page);
    const { data, error, count } = await supabase
      .from("popups")
      .select("*", { count: "estimated" })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) toast.error(error.message);
    else {
      setRows(data ?? []);
      setTotalRows(count ?? data?.length ?? 0);
    }
    setLoading(false);
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error(t("titleRequired"));
    const payload = {
      ...editing,
      content: editing.content || null,
      image_url: editing.image_url || null,
      cta_label: editing.cta_label || null,
      cta_url: editing.cta_url || null,
      priority: Number(editing.priority) || 0,
    };
    const res = editing.id
      ? await supabase.from("popups").update(payload).eq("id", editing.id)
      : await supabase.from("popups").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
  };

  const uploadImageFile = async (file: File) => {
    if (!editing) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files can be uploaded.");
      return;
    }

    setUploading(true);
    const path = `popups/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFileName(
      file.name,
    )}`;
    const { error } = await supabase.storage.from(POPUP_MEDIA_BUCKET).upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from(POPUP_MEDIA_BUCKET).getPublicUrl(path);
    setEditing({ ...editing, image_url: data.publicUrl });
    setUploading(false);
    toast.success("Popup image uploaded.");
  };

  const remove = async (id: string) => {
    if (!confirm(t("deletePopupConfirm"))) return;
    const { error } = await supabase.from("popups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("popups").update({ active }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, active } : x)));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">
            {t("popups")} ({rows.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage homepage popup images, message, button, schedule and priority.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="rounded-full">
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
          <Button
            onClick={() => {
              setEditing({ ...emptyPopup });
              setOpen(true);
            }}
            className="rounded-full"
          >
            <Plus className="mr-1 h-4 w-4" /> {t("newPopup")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("title")}</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("priority")}</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>{t("active")}</TableHead>
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
                  {t("noPopups")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => {
              const state = popupSchedulingState(p);
              return (
                <TableRow key={p.id}>
                  <TableCell className="max-w-md">
                    <div className="font-medium">{p.title}</div>
                    {p.content && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">{p.content}</div>
                    )}
                    {p.cta_label && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {p.cta_label} {p.cta_url ? `- ${p.cta_url}` : ""}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-12 w-20 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <Badge variant="secondary">No image</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={state.variant}>{popupStateLabel(state.label)}</Badge>
                  </TableCell>
                  <TableCell>{p.priority ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{p.starts_at ? new Date(p.starts_at).toLocaleString() : "-"}</div>
                    <div>{p.ends_at ? new Date(p.ends_at).toLocaleString() : "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={p.active} onCheckedChange={(v) => toggle(p.id, v)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing({ ...p });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        page={page}
        canNext={(page + 1) * ADMIN_PAGE_SIZE < totalRows}
        onPrevious={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        previousLabel={t("previousPage")}
        pageLabel={t("pageLabel")}
        nextLabel={t("nextPage")}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editPopup") : t("newPopup")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div>
                <Label>{t("title")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <div>
                    <Label>{t("content")}</Label>
                    <Textarea
                      className="mt-1.5"
                      rows={5}
                      value={editing.content ?? ""}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("ctaLabel")}</Label>
                      <Input
                        className="mt-1.5"
                        value={editing.cta_label ?? ""}
                        onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t("ctaUrl")}</Label>
                      <Input
                        className="mt-1.5"
                        placeholder="https://..."
                        value={editing.cta_url ?? ""}
                        onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <PopupImageUploader
                  imageUrl={editing.image_url ?? ""}
                  uploading={uploading}
                  onUrlChange={(image_url) => setEditing({ ...editing, image_url })}
                  onFile={uploadImageFile}
                  label={t("imageUrl")}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>{t("startsAt")}</Label>
                  <Input
                    className="mt-1.5"
                    type="datetime-local"
                    value={isoToLocalInput(editing.starts_at)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        starts_at: localInputToIso(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("endsAt")}</Label>
                  <Input
                    className="mt-1.5"
                    type="datetime-local"
                    value={isoToLocalInput(editing.ends_at)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        ends_at: localInputToIso(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>
                    {t("priority")}{" "}
                    <span className="text-xs text-muted-foreground">({t("higherShowsFirst")})</span>
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={editing.priority ?? 0}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        priority: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <Label>{t("active")}</Label>
                  <div className="text-xs text-muted-foreground">
                    Active popups appear when the schedule is valid.
                  </div>
                </div>
                <Switch
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={save} disabled={uploading}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PopupImageUploader({
  imageUrl,
  uploading,
  onUrlChange,
  onFile,
  label,
}: {
  imageUrl: string;
  uploading: boolean;
  onUrlChange: (value: string) => void;
  onFile: (file: File) => void;
  label: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickFile = (file?: File) => {
    if (file) onFile(file);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    pickFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <Input
          className="mt-1.5"
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => onUrlChange(e.target.value)}
        />
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-5 text-center transition hover:border-primary/70 hover:bg-primary/5"
      >
        {uploading ? (
          <UploadCloud className="mb-2 h-8 w-8 animate-pulse text-primary" />
        ) : (
          <ImagePlus className="mb-2 h-8 w-8 text-primary" />
        )}
        <div className="text-sm font-semibold">
          {uploading ? "Uploading image..." : "Choose popup image or drop file here"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          The public image URL is filled automatically after upload.
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedMedia}
          className="hidden"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />
      </div>
      {imageUrl ? (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <img src={imageUrl} alt="Popup preview" className="aspect-video w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}
