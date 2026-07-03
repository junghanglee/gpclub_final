import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type AdminLang, ADMIN_I18N, tx } from "@/components/admin/admin-i18n";
import { supabase } from "@/integrations/supabase/client";

type SiteSettingsValue = Record<string, string>;

const CONTACT_FIELDS: {
  key: string;
  labelKey: keyof typeof ADMIN_I18N;
  multiline?: boolean;
}[] = [
  { key: "legal_name", labelKey: "legalNameEn" },
  { key: "legal_name_vi", labelKey: "legalNameVi" },
  { key: "tax_code", labelKey: "taxCode" },
  { key: "representative", labelKey: "representative" },
  { key: "address", labelKey: "address", multiline: true },
  { key: "phone", labelKey: "phone" },
  { key: "email", labelKey: "email" },
  { key: "zalo_phone", labelKey: "zaloPhone" },
  { key: "whatsapp_phone", labelKey: "whatsappPhone" },
];

export default function SettingsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "contact")
      .maybeSingle();
    if (error && error.code !== "PGRST116") toast.error(error.message);
    setValues((data?.value as SiteSettingsValue | null) ?? {});
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "contact", value: values });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
  };

  if (loading) return <div className="text-sm text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">{t("siteInformation")}</h2>
        <Button onClick={save} disabled={saving} className="rounded-full">
          {saving ? t("saving") : t("saveChanges")}
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{t("settingsDesc")}</p>
      <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        {CONTACT_FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{t(f.labelKey)}</Label>
            {f.multiline ? (
              <Textarea
                className="mt-1.5"
                rows={2}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            ) : (
              <Input
                className="mt-1.5"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
