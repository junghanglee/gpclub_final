import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type ADMIN_I18N, type AdminLang, tx } from "@/components/admin/admin-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { BrandSocial, FooterInfo, SeoInfo, SocialLink } from "@/lib/site-settings";

type ContactValues = Record<string, string>;

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

const DEFAULT_SEO: SeoInfo = {
  siteName: "GPCLUB Vietnam",
  title: "GPCLUB Vietnam - JMsolution & Jmella K-Beauty Distributor",
  description:
    "Official Vietnam distributor for JMsolution & Jmella. Premium K-beauty skincare, fragrance & body care for retailers and B2B partners.",
  author: "GPCLUB Vietnam",
  ogImage: "",
  faviconUrl: "/favicon.png",
};

const DEFAULT_FOOTER: FooterInfo = {
  taglineEn:
    "Official partner platform for JMsolution, Jmella and Trois Touch in Vietnam - supporting supply, wholesale and channel growth.",
  taglineVi:
    "Nền tảng đối tác chính thức cho JMsolution, Jmella và Trois Touch tại Việt Nam - hỗ trợ nguồn hàng, bán sỉ và tăng trưởng kênh phân phối.",
  copyrightEn: "All rights reserved.",
  copyrightVi: "Đã đăng ký bản quyền.",
  brandLine: "JMsolution - Jmella - Trois Touch",
  zaloVnPhone: "0703321243",
  zaloEnPhone: "0911412309",
  displayPhone: "070 332 1243",
};

const DEFAULT_SOCIALS: BrandSocial[] = [
  {
    id: "jmella-vietnam",
    brand: "Jmella Vietnam",
    links: [
      {
        id: "jmella-facebook",
        type: "facebook",
        label: "Facebook",
        url: "https://www.facebook.com/share/18aaeXRVWN/?mibextid=wwXIfr",
      },
      {
        id: "jmella-instagram",
        type: "instagram",
        label: "Instagram",
        url: "https://www.instagram.com/jmella.vn?igsh=MTkwZm90N2x1dXI1dw==",
      },
      {
        id: "jmella-tiktok",
        type: "tiktok",
        label: "TikTok",
        url: "https://www.tiktok.com/@jmellavn_official?lang=vi-VN",
      },
    ],
  },
  {
    id: "jmsolution-vietnam",
    brand: "JMsolution Vietnam",
    links: [
      {
        id: "jmsolution-facebook",
        type: "facebook",
        label: "Facebook",
        url: "https://www.facebook.com/share/1aSGGcEqEU/?mibextid=wwXIfr",
      },
      {
        id: "jmsolution-instagram",
        type: "instagram",
        label: "Instagram",
        url: "https://www.instagram.com/jmsolution.vn?igsh=M200a2VuMGEzb3Y5",
      },
      {
        id: "jmsolution-tiktok",
        type: "tiktok",
        label: "TikTok",
        url: "https://www.tiktok.com/@jmsolutionvn_official?lang=vi-VN",
      },
    ],
  },
];

const SOCIAL_TYPES = ["facebook", "instagram", "tiktok", "youtube", "zalo", "website", "other"];

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function SettingsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [contact, setContact] = useState<ContactValues>({});
  const [seo, setSeo] = useState<SeoInfo>(DEFAULT_SEO);
  const [footer, setFooter] = useState<FooterInfo>(DEFAULT_FOOTER);
  const [brandSocials, setBrandSocials] = useState<BrandSocial[]>(DEFAULT_SOCIALS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["contact", "seo", "footer", "brand_socials"]);
    if (error) toast.error(error.message);
    const settings = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
    setContact((settings.contact as ContactValues | undefined) ?? {});
    setSeo({
      ...DEFAULT_SEO,
      ...((settings.seo as Partial<SeoInfo> | undefined) ?? {}),
    });
    setFooter({
      ...DEFAULT_FOOTER,
      ...((settings.footer as Partial<FooterInfo> | undefined) ?? {}),
    });
    setBrandSocials((settings.brand_socials as BrandSocial[] | undefined) ?? DEFAULT_SOCIALS);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const cleanedSocials = brandSocials
      .map((brand) => ({
        ...brand,
        brand: brand.brand.trim(),
        links: brand.links
          .map((link) => ({
            ...link,
            label: link.label.trim() || link.type,
            url: link.url.trim(),
          }))
          .filter((link) => link.url),
      }))
      .filter((brand) => brand.brand && brand.links.length);
    const { error } = await supabase.from("site_settings").upsert([
      { key: "contact", value: contact },
      { key: "seo", value: seo },
      { key: "footer", value: footer },
      { key: "brand_socials", value: cleanedSocials },
    ]);
    setSaving(false);
    if (error) return toast.error(error.message);
    setBrandSocials(cleanedSocials.length ? cleanedSocials : DEFAULT_SOCIALS);
    toast.success(t("saved"));
  };

  const updateBrand = (index: number, patch: Partial<BrandSocial>) => {
    setBrandSocials((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const updateLink = (brandIndex: number, linkIndex: number, patch: Partial<SocialLink>) => {
    setBrandSocials((rows) =>
      rows.map((brand, i) =>
        i === brandIndex
          ? {
              ...brand,
              links: brand.links.map((link, j) => (j === linkIndex ? { ...link, ...patch } : link)),
            }
          : brand,
      ),
    );
  };

  if (loading) return <div className="text-sm text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{t("siteInformation")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage SEO, favicon, footer contacts, and brand social links displayed on the public
            site.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="rounded-full">
          {saving ? t("saving") : t("saveChanges")}
        </Button>
      </div>

      <Section title="SEO / Browser Display">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Site name"
            value={seo.siteName}
            onChange={(siteName) => setSeo({ ...seo, siteName })}
          />
          <Field
            label="Browser title"
            value={seo.title}
            onChange={(title) => setSeo({ ...seo, title })}
          />
          <Field
            label="Author"
            value={seo.author}
            onChange={(author) => setSeo({ ...seo, author })}
          />
          <Field
            label="Favicon URL"
            value={seo.faviconUrl}
            onChange={(faviconUrl) => setSeo({ ...seo, faviconUrl })}
          />
          <Field
            label="Social preview image URL"
            value={seo.ogImage}
            onChange={(ogImage) => setSeo({ ...seo, ogImage })}
            className="md:col-span-2"
          />
          <Field
            label="SEO description"
            value={seo.description}
            onChange={(description) => setSeo({ ...seo, description })}
            multiline
            className="md:col-span-2"
          />
        </div>
      </Section>

      <Section title="Footer Company Information">
        <div className="grid gap-4 md:grid-cols-2">
          {CONTACT_FIELDS.map((field) => (
            <Field
              key={field.key}
              label={t(field.labelKey)}
              value={contact[field.key] ?? ""}
              onChange={(value) => setContact({ ...contact, [field.key]: value })}
              multiline={field.multiline}
              className={field.multiline ? "md:col-span-2" : undefined}
            />
          ))}
        </div>
      </Section>

      <Section title="Footer Text / Contact Buttons">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Footer tagline EN"
            value={footer.taglineEn}
            onChange={(taglineEn) => setFooter({ ...footer, taglineEn })}
            multiline
          />
          <Field
            label="Footer tagline VI"
            value={footer.taglineVi}
            onChange={(taglineVi) => setFooter({ ...footer, taglineVi })}
            multiline
          />
          <Field
            label="Copyright EN"
            value={footer.copyrightEn}
            onChange={(copyrightEn) => setFooter({ ...footer, copyrightEn })}
          />
          <Field
            label="Copyright VI"
            value={footer.copyrightVi}
            onChange={(copyrightVi) => setFooter({ ...footer, copyrightVi })}
          />
          <Field
            label="Footer brand line"
            value={footer.brandLine}
            onChange={(brandLine) => setFooter({ ...footer, brandLine })}
          />
          <Field
            label="Display phone"
            value={footer.displayPhone}
            onChange={(displayPhone) => setFooter({ ...footer, displayPhone })}
          />
          <Field
            label="Zalo VN phone"
            value={footer.zaloVnPhone}
            onChange={(zaloVnPhone) => setFooter({ ...footer, zaloVnPhone })}
          />
          <Field
            label="Zalo EN phone"
            value={footer.zaloEnPhone}
            onChange={(zaloEnPhone) => setFooter({ ...footer, zaloEnPhone })}
          />
        </div>
      </Section>

      <Section
        title="Brand SNS Links"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setBrandSocials([
                ...brandSocials,
                {
                  id: id("brand"),
                  brand: "New Brand",
                  links: [
                    {
                      id: id("link"),
                      type: "website",
                      label: "Website",
                      url: "",
                    },
                  ],
                },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add brand
          </Button>
        }
      >
        <div className="space-y-5">
          {brandSocials.map((brand, brandIndex) => (
            <div key={brand.id} className="rounded-md border border-border/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[240px] flex-1">
                  <Label>Brand name</Label>
                  <Input
                    className="mt-1.5"
                    value={brand.brand}
                    onChange={(e) => updateBrand(brandIndex, { brand: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => setBrandSocials(brandSocials.filter((_, i) => i !== brandIndex))}
                  aria-label="Remove brand"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {brand.links.map((link, linkIndex) => (
                  <div key={link.id} className="grid gap-2 md:grid-cols-[170px_170px_1fr_40px]">
                    <Select
                      value={link.type}
                      onValueChange={(type) =>
                        updateLink(brandIndex, linkIndex, {
                          type,
                          label: link.label || type,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateLink(brandIndex, linkIndex, {
                          label: e.target.value,
                        })
                      }
                      placeholder="Label"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        updateLink(brandIndex, linkIndex, {
                          url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateBrand(brandIndex, {
                          links: brand.links.filter((_, i) => i !== linkIndex),
                        })
                      }
                      aria-label="Remove social link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateBrand(brandIndex, {
                      links: [
                        ...brand.links,
                        {
                          id: id("link"),
                          type: "website",
                          label: "Website",
                          url: "",
                        },
                      ],
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> Add SNS link
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border/60 bg-card p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {multiline ? (
        <Textarea
          className="mt-1.5"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input className="mt-1.5" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
