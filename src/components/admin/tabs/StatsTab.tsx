import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { type AdminLang, ADMIN_I18N, tx } from "@/components/admin/admin-i18n";

export default function StatsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [stats, setStats] = useState({
    dealers: 0,
    contacts: 0,
    faqs: 0,
    popups: 0,
    events: 0,
    training: 0,
    newDealers: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [d, c, f, p, e, t, nd] = await Promise.all([
      supabase.from("b2b_inquiries").select("*", { count: "exact", head: true }),
      supabase.from("chatbot_records").select("*", { count: "exact", head: true }),
      supabase.from("faqs").select("*", { count: "exact", head: true }),
      supabase.from("popups").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("chatbot_training").select("*", { count: "exact", head: true }),
      supabase
        .from("b2b_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
    ]);
    setStats({
      dealers: d.count ?? 0,
      contacts: c.count ?? 0,
      faqs: f.count ?? 0,
      popups: p.count ?? 0,
      events: e.count ?? 0,
      training: t.count ?? 0,
      newDealers: nd.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const cards = [
    {
      label: t("dealerApplications"),
      value: stats.dealers,
      accent: "text-gold",
    },
    {
      label: t("newUnhandled"),
      value: stats.newDealers,
      accent: "text-primary",
    },
    { label: t("generalInquiries"), value: stats.contacts },
    { label: t("publishedFaqs"), value: stats.faqs },
    { label: t("popups"), value: stats.popups },
    { label: t("events"), value: stats.events },
    { label: t("chatbotTraining"), value: stats.training },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">{t("overview")}</h2>
        <Button variant="outline" size="sm" onClick={load} className="rounded-full">
          <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className={`mt-2 font-display text-4xl ${c.accent ?? ""}`}>
              {loading ? "..." : c.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
