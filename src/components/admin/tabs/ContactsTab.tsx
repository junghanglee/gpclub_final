import { RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type ADMIN_I18N, type AdminLang, statusText, tx } from "@/components/admin/admin-i18n";
import { CHATBOT_RECORD_LIMIT } from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ChatbotRecordRow = Database["public"]["Tables"]["chatbot_records"]["Row"];
type ChatbotRecordPatch = Database["public"]["Tables"]["chatbot_records"]["Update"];
const CONTACT_STATUSES = ["new", "replied", "closed"] as const;

type ContactSessionGroup = {
  sessionId: string;
  records: ChatbotRecordRow[];
  latest: ChatbotRecordRow;
  first: ChatbotRecordRow;
};

export default function ContactsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<ChatbotRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("chatbot_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(CHATBOT_RECORD_LIMIT);
    if (date) {
      const from = new Date(`${date}T00:00:00`);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      query = query.gte("created_at", from.toISOString()).lt("created_at", to.toISOString());
    }
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  }, [date]);
  useEffect(() => {
    load();
  }, [load]);

  const sessionGroups = useMemo(() => {
    const map = new Map<string, ContactSessionGroup>();
    for (const row of rows) {
      const sessionId = row.session_id || `unknown-${row.id}`;
      const group = map.get(sessionId) ?? {
        sessionId,
        records: [] as ChatbotRecordRow[],
        latest: row,
        first: row,
      };
      group.records.push(row);
      if (new Date(row.created_at).getTime() > new Date(group.latest.created_at).getTime())
        group.latest = row;
      if (new Date(row.created_at).getTime() < new Date(group.first.created_at).getTime())
        group.first = row;
      map.set(sessionId, group);
    }
    return Array.from(map.values())
      .map((group) => ({
        ...group,
        records: [...group.records].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      }))
      .sort(
        (a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime(),
      );
  }, [rows]);

  const selectedSession = selectedSessionId
    ? (sessionGroups.find((group) => group.sessionId === selectedSessionId) ?? null)
    : null;

  const updateRecord = async (id: string, patch: ChatbotRecordPatch) => {
    const { error } = await supabase.from("chatbot_records").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("updated"));
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const { error } = await supabase.from("chatbot_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">
          {t("userSessions")}{" "}
          <span className="text-sm text-muted-foreground">
            ({sessionGroups.length} / {rows.length})
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs text-muted-foreground">{t("dateFilter")}</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-[160px]"
          />
          {date && (
            <Button variant="ghost" size="sm" onClick={() => setDate("")}>
              {t("clearFilter")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} className="rounded-full">
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sessionId")}</TableHead>
              <TableHead>{t("latestMessage")}</TableHead>
              <TableHead>{t("messageCount")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && sessionGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {t("noInquiries")}
                </TableCell>
              </TableRow>
            )}
            {sessionGroups.map((group) => (
              <TableRow key={group.sessionId}>
                <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {group.sessionId}
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate text-sm font-medium">
                    {group.latest.customer_message}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {group.latest.chatbot_reply}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-semibold">{group.records.length}</TableCell>
                <TableCell>
                  <Badge variant="outline">{statusText(lang, group.latest.status)}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(group.latest.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedSessionId(group.sessionId)}
                  >
                    {t("view")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSession} onOpenChange={(o) => !o && setSelectedSessionId(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle>{t("conversation")}</DialogTitle>
                <p className="break-all text-xs text-muted-foreground">
                  {t("sessionId")}: {selectedSession.sessionId} � {t("messageCount")}:{" "}
                  {selectedSession.records.length}
                </p>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                {selectedSession.records.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-border/60 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{new Date(record.created_at).toLocaleString()}</span>
                      <Select
                        value={record.status}
                        onValueChange={(v) => updateRecord(record.id, { status: v })}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusText(lang, s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl bg-muted p-4">
                        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                          {t("customer")}
                        </div>
                        {record.customer_message}
                      </div>
                      <div className="rounded-xl bg-card p-4 ring-1 ring-border/60">
                        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                          {t("chatbotAnswer")}
                        </div>
                        {record.chatbot_reply}
                      </div>
                      <div>
                        <Label>{t("adminNote")}</Label>
                        <Textarea
                          className="mt-1.5"
                          rows={3}
                          value={record.admin_note ?? ""}
                          onChange={(e) =>
                            setRows((xs) =>
                              xs.map((x) =>
                                x.id === record.id ? { ...x, admin_note: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateRecord(record.id, {
                              admin_note: record.admin_note ?? "",
                            })
                          }
                        >
                          {t("saveNote")}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(record.id)}>
                          <Trash2 className="mr-1 h-4 w-4" /> {t("delete")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} /* ---------------- FAQs ---------------- */
