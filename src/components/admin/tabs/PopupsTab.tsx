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
import { Textarea } from "@/components/ui/textarea";
import { type AdminLang, ADMIN_I18N, tx } from "@/components/admin/admin-i18n";
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

// Convert ISO string <-> <input type="datetime-local"> value (local time)
const isoToLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const localInputToIso = (v: string) => (v ? new Date(v).toISOString() : null);

const popupSchedulingState = (p: {
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}) => {
  if (!p.active) return { label: "Off", variant: "secondary" as const };
  const now = Date.now();
  if (p.starts_at && new Date(p.starts_at).getTime() > now)
    return { label: "Scheduled", variant: "outline" as const };
  if (p.ends_at && new Date(p.ends_at).getTime() < now)
    return { label: "Expired", variant: "secondary" as const };
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

  const load = async () => {
    const { data, error } = await supabase
      .from("popups")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error(t("titleRequired"));
    const res = editing.id
      ? await supabase.from("popups").update(editing).eq("id", editing.id)
      : await supabase.from("popups").insert(editing);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">
          {t("popups")} ({rows.length})
        </h2>
        <Button
          onClick={() => {
            setEditing(emptyPopup);
            setOpen(true);
          }}
          className="rounded-full"
        >
          <Plus className="mr-1 h-4 w-4" /> {t("newPopup")}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            {t("noPopups")}
          </div>
        )}
        {rows.map((p) => {
          const state = popupSchedulingState(p);
          return (
            <div key={p.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt=""
                  className="mb-3 aspect-video w-full rounded-lg object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg">{p.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t("priority")} {p.priority ?? 0}
                  </div>
                </div>
                <Switch checked={p.active} onCheckedChange={(v) => toggle(p.id, v)} />
              </div>
              {p.content && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
              )}
              {(p.starts_at || p.ends_at) && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.starts_at ? new Date(p.starts_at).toLocaleString() : "-"} -
                  {p.ends_at ? new Date(p.ends_at).toLocaleString() : "-"}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={state.variant}>{popupStateLabel(state.label)}</Badge>
                <div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editPopup") : t("newPopup")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>{t("title")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("content")}</Label>
                <Textarea
                  className="mt-1.5"
                  rows={3}
                  value={editing.content ?? ""}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("imageUrl")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.image_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
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
                    value={editing.cta_url ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <Label>{t("active")}</Label>
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
            <Button onClick={save}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
