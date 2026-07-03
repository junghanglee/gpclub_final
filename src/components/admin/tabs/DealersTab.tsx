import { RefreshCw, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ADMIN_PAGE_SIZE, PaginationControls, pageRange } from "@/components/admin/admin-shared";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type B2BInquiryRow = Tables["b2b_inquiries"]["Row"];
type B2BInquiryUpdate = Tables["b2b_inquiries"]["Update"];
const DEALER_STATUSES = ["new", "reviewing", "approved", "rejected"] as const;
const DEALER_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "secondary",
  reviewing: "outline",
  approved: "default",
  rejected: "destructive",
};

export default function DealersTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<B2BInquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<B2BInquiryRow | null>(null);
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  const load = async () => {
    setLoading(true);
    const { from, to } = pageRange(page);
    const { data, error, count } = await supabase
      .from("b2b_inquiries")
      .select("*", { count: "estimated" })
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

  const updateApplication = async (id: string, patch: B2BInquiryUpdate) => {
    const { error } = await supabase.from("b2b_inquiries").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("updated"));
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setSelected((x) => (x?.id === id ? { ...x, ...patch } : x));
  };

  const updateStatus = async (id: string, status: string) => {
    await updateApplication(id, { status });
  };

  const saveNote = async () => {
    if (!selected) return;
    await updateApplication(selected.id, {
      admin_note: selected.admin_note ?? "",
    });
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteApplicationConfirm"))) return;
    const { error } = await supabase.from("b2b_inquiries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
    setSelected(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">
          {t("dealerApplications")}{" "}
          <span className="text-sm text-muted-foreground">({rows.length})</span>
        </h2>
        <Button variant="outline" size="sm" onClick={load} className="rounded-full">
          <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("company")}</TableHead>
              <TableHead>{t("contact")}</TableHead>
              <TableHead>{t("city")}</TableHead>
              <TableHead>{t("volume")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("date")}</TableHead>
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
                  {t("noApplications")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  <div className="font-medium">{q.company}</div>
                  <div className="text-xs text-muted-foreground">{q.position}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.email}</div>
                </TableCell>
                <TableCell className="text-sm">{q.city}</TableCell>
                <TableCell className="text-sm">{q.monthly_volume}</TableCell>
                <TableCell>
                  <Select value={q.status} onValueChange={(v) => updateStatus(q.id, v)}>
                    <SelectTrigger className="h-8 w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEALER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusText(lang, s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(q.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(q)}>
                    {t("view")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={page}
        canNext={(page + 1) * ADMIN_PAGE_SIZE < totalRows}
        onPrevious={() => setPage((value) => Math.max(0, value - 1))}
        onNext={() => setPage((value) => value + 1)}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <Badge
                  variant={DEALER_STATUS_VARIANT[selected.status] ?? "outline"}
                  className="w-fit"
                >
                  {statusText(lang, selected.status)}
                </Badge>
                <DialogTitle className="font-display text-2xl">{selected.company}</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {t("submitted")} {new Date(selected.created_at).toLocaleString()}
                </p>
              </DialogHeader>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label={t("position")} value={selected.position} />
                <Field label={t("city")} value={selected.city} />
                <Field label={t("channel")} value={selected.channel} />
                <Field label={t("monthlyVolume")} value={selected.monthly_volume} />
                <Field label={t("brands")} value={selected.brands || "-"} />
                <Field label={t("contact")} value={selected.name} />
                <Field label={t("email")} value={selected.email} />
                <Field label={t("phone")} value={selected.phone} />
              </div>
              {selected.message && (
                <div className="rounded-xl bg-muted p-4 text-sm">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("message")}
                  </div>
                  {selected.message}
                </div>
              )}
              <div>
                <Label>{t("adminNote")}</Label>
                <Textarea
                  className="mt-1.5"
                  rows={4}
                  value={selected.admin_note ?? ""}
                  onChange={(e) => setSelected({ ...selected, admin_note: e.target.value })}
                  placeholder={t("adminNote")}
                />
              </div>
              <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("status")}
                  </Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => {
                      updateStatus(selected.id, v);
                      setSelected({ ...selected, status: v });
                    }}
                  >
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEALER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusText(lang, s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={saveNote}>
                    {t("saveNote")}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`mailto:${selected.email}`}>{t("emailReply")}</a>
                  </Button>
                  <Button variant="destructive" onClick={() => remove(selected.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> {t("delete")}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
