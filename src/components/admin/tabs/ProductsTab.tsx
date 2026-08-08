import { CheckCircle2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { type ADMIN_I18N, type AdminLang, tx } from "@/components/admin/admin-i18n";
import { AdminImageUploader } from "@/components/admin/admin-image-uploader";
import { PaginationControls } from "@/components/admin/admin-pagination-controls";
import { ADMIN_PAGE_SIZE, pageRange } from "@/components/admin/admin-shared";
import {
  ProductDetailEditor,
  type ProductDetailEditorHandle,
} from "@/components/admin/product-detail-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { isOptimisticConflict } from "@/lib/admin-save-errors";
import { jsonRecordContains } from "@/lib/json-value-equality";
import { recordAdminAudit } from "@/lib/admin-audit";
import type {
  CatalogProduct,
  ProductLocale,
  ProductMedia,
  ProductTranslations,
} from "@/lib/catalog-products";
import { productDetailTextFromHtml, sanitizeProductDetailHtml } from "@/lib/product-detail-html";

type AdminProductUpdate = Database["public"]["Tables"]["admin_products"]["Update"];

type BrandOption = {
  id: string;
  name: string;
  key: string;
  published: boolean;
  sort_order: number;
};

const PRODUCT_LOCALES: Array<{ value: ProductLocale; label: string }> = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

function productTranslations(product: CatalogProduct): ProductTranslations {
  const fallback = {
    product_name: product.product_name || "",
    short_intro: product.short_intro || "",
    detail_html: product.detail_html || "",
  };
  return {
    vi: { ...fallback, ...product.translations?.vi },
    en: { ...fallback, ...product.translations?.en },
  };
}
function ProductTagField({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="rounded-2xl border border-border p-4">
      <Label>{label}</Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function emptyProduct(): CatalogProduct {
  return {
    id: "",
    brand_id: null,
    brand_name: "",
    product_name: "",
    product_type: "Sheet Mask",
    short_intro: "",
    detail_html: "<p>Product details</p>",
    media: [],
    conditions: [],
    cover_image_url: "",
    sort_order: 0,
    published: true,
    is_new: false,
    is_popular: false,
    is_featured: false,
    skin_types: [],
    concerns: [],
    translations: {
      vi: { product_name: "", short_intro: "", detail_html: "" },
      en: { product_name: "", short_intro: "", detail_html: "" },
    },
  };
}

export default function ProductsAdminTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [publicationFilter, setPublicationFilter] = useState<"all" | "published">("all");
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [saving, setSaving] = useState(false);
  const [productLocale, setProductLocale] = useState<ProductLocale>("vi");
  const detailEditorRefs = useRef<Record<ProductLocale, ProductDetailEditorHandle | null>>({
    vi: null,
    en: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = pageRange(page);
    const trimmedSearch = search.trim();
    const brandPromise = supabase
      .from("brands")
      .select("id,name,key,published,sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    let query = supabase
      .from("admin_products")
      .select("*,brands(id,key,slug,name,sort_order,published)", {
        count: "estimated",
      })
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (brandFilter !== "All") {
      query = query.eq("brand_id", brandFilter);
    }
    if (publicationFilter === "published") {
      query = query.eq("published", true);
    }
    if (trimmedSearch) {
      query = query.ilike("product_name", `%${trimmedSearch}%`);
    }
    const [brandResult, productResult] = await Promise.all([brandPromise, query]);
    if (brandResult.error) toast.error(brandResult.error.message);
    else setBrands((brandResult.data || []) as BrandOption[]);
    if (productResult.error) toast.error(productResult.error.message);
    else {
      setRows((productResult.data || []) as unknown as CatalogProduct[]);
      setTotalRows(productResult.count ?? productResult.data?.length ?? 0);
    }
    setLoading(false);
  }, [brandFilter, page, publicationFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [search, brandFilter, publicationFilter]);

  const startNew = () => {
    const primaryBrand = brands.find((brand) => brand.published) ?? brands[0];
    if (!primaryBrand) {
      toast.error("Create a brand before adding products.");
      return;
    }

    setEditing({
      ...emptyProduct(),
      brand_id: primaryBrand.id,
      brand_name: primaryBrand.name,
    });
    setProductLocale("vi");
    setOpen(true);
  };

  const save = async () => {
    if (!editing || saving) return;
    const selectedBrand = brands.find((brand) => brand.id === editing.brand_id);
    if (!selectedBrand) {
      toast.error("Select a brand before saving this product.");
      return;
    }
    const translations = productTranslations(editing);
    for (const locale of PRODUCT_LOCALES.map(({ value }) => value)) {
      translations[locale].detail_html = sanitizeProductDetailHtml(
        detailEditorRefs.current[locale]?.commit() ?? translations[locale].detail_html,
      );
    }

    const incompleteLocale = PRODUCT_LOCALES.find(({ value }) => {
      const localized = translations[value];
      return (
        !localized.product_name.trim() ||
        !localized.short_intro.trim() ||
        !productDetailTextFromHtml(localized.detail_html)
      );
    });
    if (incompleteLocale) {
      setProductLocale(incompleteLocale.value);
      toast.error(
        `${incompleteLocale.label}: product name, short intro, and details are required.`,
      );
      return;
    }

    const canonical = translations.en;
    const payload = {
      brand_id: selectedBrand.id,
      brand_name: selectedBrand.name,
      product_name: canonical.product_name,
      product_type: editing.product_type,
      short_intro: canonical.short_intro,
      detail_html: canonical.detail_html,
      translations: translations as unknown as Json,
      media: editing.media,
      conditions: editing.conditions,
      cover_image_url: editing.cover_image_url || null,
      sort_order: Number(editing.sort_order) || 0,
      published: editing.published,
      is_new: editing.is_new,
      is_popular: editing.is_popular,
      is_featured: editing.is_featured,
      skin_types: editing.skin_types ?? [],
      concerns: editing.concerns ?? [],
    };
    setSaving(true);
    const result = editing.id
      ? await supabase
          .from("admin_products")
          .update(payload)
          .eq("id", editing.id)
          .eq("updated_at", editing.updated_at ?? "")
          .select("*")
          .single()
      : await supabase.from("admin_products").insert(payload).select("*").single();
    setSaving(false);
    if (result.error) {
      if (editing.id && isOptimisticConflict(result.error)) {
        toast.error("This product changed in another editor. Your draft was kept.");
        return;
      }
      toast.error(result.error.message);
      return;
    }
    if (!jsonRecordContains(result.data, payload)) {
      toast.error("The product save could not be verified. Your draft was kept.");
      return;
    }
    toast.success(t("saved"));
    void recordAdminAudit({
      action: editing.id ? "update" : "create",
      entityType: "product",
      entityId: result.data?.id ?? editing.id,
    });
    setOpen(false);
    setEditing(null);
    await load();
  };

  const remove = async (row: CatalogProduct) => {
    if (!confirm(t("deleteProductConfirm"))) return;
    const { error } = await supabase.from("admin_products").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("delete"));
      await load();
    }
  };

  const productTypes = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((row) => row.product_type).filter(Boolean)))],
    [rows],
  );

  const quickUpdate = async (row: CatalogProduct, patch: Partial<CatalogProduct>) => {
    const normalizedPatch: AdminProductUpdate = {};
    const writablePatch = normalizedPatch as Record<string, unknown>;

    for (const [key, value] of Object.entries(patch)) {
      if (
        value === undefined ||
        (key === "brand_id" && value === null) ||
        key === "brand_key" ||
        key === "brand_slug" ||
        key === "brand_display_name"
      ) {
        continue;
      }

      writablePatch[key] = key === "conditions" || key === "media" ? (value as Json) : value;
    }

    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...patch } : item)));
    const { error } = await supabase
      .from("admin_products")
      .update(normalizedPatch)
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      await load();
    } else {
      toast.success(t("updated"));
    }
  };

  const addMedia = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      media: [...editing.media, { type: "image", url: "", alt: "" }],
    });
  };

  const addCondition = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      conditions: [...editing.conditions, { label: "Price", value: "", visible: true }],
    });
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black">{t("products")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin-created products appear on the home page, product list, and detail pages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
          <Button onClick={startNew} disabled={loading || brands.length === 0}>
            <Plus className="mr-1 h-4 w-4" /> {t("newProduct")}
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 md:grid-cols-[minmax(240px,1fr)_180px_auto_140px]">
        <Input
          placeholder="Search product name, brand, type"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div
          className="inline-flex h-10 items-center rounded-md border border-border bg-card p-1"
          role="group"
          aria-label="Publication status filter"
        >
          <Button
            type="button"
            size="sm"
            variant={publicationFilter === "all" ? "secondary" : "ghost"}
            className="h-8 px-3"
            aria-pressed={publicationFilter === "all"}
            onClick={() => setPublicationFilter("all")}
          >
            {t("all")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={publicationFilter === "published" ? "secondary" : "ghost"}
            className="h-8 px-3"
            aria-pressed={publicationFilter === "published"}
            onClick={() => setPublicationFilter("published")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("published")}
          </Button>
        </div>
        <div className="flex items-center justify-center rounded-md border bg-card px-3 text-sm font-bold">
          {rows.length} / {totalRows}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">{t("published")}</TableHead>
                <TableHead>{t("brandName")}</TableHead>
                <TableHead className="min-w-[300px]">{t("productName")}</TableHead>
                <TableHead className="min-w-[180px]">{t("productType")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("edit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Switch
                      checked={row.published}
                      onCheckedChange={(v) => void quickUpdate(row, { published: v })}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.brand_display_name || row.brand_name}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.product_name}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, product_name: e.target.value } : item,
                          ),
                        )
                      }
                      onBlur={(e) => {
                        if (e.target.value !== row.product_name)
                          void quickUpdate(row, {
                            product_name: e.target.value,
                          });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      list="admin-product-type-options"
                      value={row.product_type}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, product_type: e.target.value } : item,
                          ),
                        )
                      }
                      onBlur={(e) => {
                        if (e.target.value !== row.product_type)
                          void quickUpdate(row, {
                            product_type: e.target.value,
                          });
                      }}
                    />
                    <datalist id="admin-product-type-options">
                      {productTypes.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.published ? (
                        <Badge>{t("live")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("draft")}</Badge>
                      )}
                      {row.is_featured ? (
                        <Badge variant="outline">{t("featuredProduct")}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing({ ...row, translations: productTranslations(row) });
                        setProductLocale("vi");
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PaginationControls
        page={page}
        canNext={(page + 1) * ADMIN_PAGE_SIZE < totalRows}
        onPrevious={() => setPage((value) => Math.max(0, value - 1))}
        onNext={() => setPage((value) => value + 1)}
        previousLabel={t("previousPage")}
        pageLabel={t("pageLabel")}
        nextLabel={t("nextPage")}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editProduct") : t("newProduct")}</DialogTitle>
            <DialogDescription>
              Use this form to manage product content, media, publishing state, and the sanitized
              rich detail section shown on public product pages.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>{t("brandName")}</Label>
                  <Select
                    value={editing.brand_id ?? ""}
                    onValueChange={(brandId) => {
                      const selectedBrand = brands.find((brand) => brand.id === brandId);
                      setEditing({
                        ...editing,
                        brand_id: brandId,
                        brand_name: selectedBrand?.name ?? editing.brand_name,
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("productType")}</Label>
                  <Input
                    className="mt-1.5"
                    list="product-type-options"
                    value={editing.product_type}
                    onChange={(e) => setEditing({ ...editing, product_type: e.target.value })}
                  />
                  <datalist id="product-type-options">
                    <option value="Sheet Mask" />
                    <option value="Skincare" />
                    <option value="Body Care" />
                    <option value="Hair Care" />
                    <option value="Makeup" />
                    <option value="Fragrance" />
                  </datalist>
                </div>
                <div>
                  <Label>{t("order")}</Label>
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
              <Tabs
                value={productLocale}
                onValueChange={(value) => setProductLocale(value as ProductLocale)}
                className="rounded-2xl border border-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Localized product content</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Complete both languages before saving.
                    </p>
                  </div>
                  <TabsList aria-label="Product content language">
                    {PRODUCT_LOCALES.map((locale) => (
                      <TabsTrigger key={locale.value} value={locale.value}>
                        {locale.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {PRODUCT_LOCALES.map((locale) => {
                  const translations = productTranslations(editing);
                  const localized = translations[locale.value];
                  return (
                    <TabsContent
                      key={locale.value}
                      value={locale.value}
                      forceMount
                      className="space-y-4 data-[state=inactive]:hidden"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor={`product-name-${locale.value}`}>
                            {t("productName")} ({locale.label})
                          </Label>
                          <Input
                            id={`product-name-${locale.value}`}
                            className="mt-1.5"
                            value={localized.product_name}
                            onChange={(event) =>
                              setEditing({
                                ...editing,
                                translations: {
                                  ...translations,
                                  [locale.value]: {
                                    ...localized,
                                    product_name: event.target.value,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`product-intro-${locale.value}`}>
                            {t("shortIntro")} ({locale.label})
                          </Label>
                          <Input
                            id={`product-intro-${locale.value}`}
                            className="mt-1.5"
                            value={localized.short_intro}
                            onChange={(event) =>
                              setEditing({
                                ...editing,
                                translations: {
                                  ...translations,
                                  [locale.value]: {
                                    ...localized,
                                    short_intro: event.target.value,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          id={`product-detail-editor-label-${locale.value}`}
                          className="mb-2 block"
                        >
                          {t("detailEditor")} ({locale.label})
                        </Label>
                        <ProductDetailEditor
                          ref={(instance) => {
                            detailEditorRefs.current[locale.value] = instance;
                          }}
                          labelId={`product-detail-editor-label-${locale.value}`}
                          value={localized.detail_html}
                          onChange={(detail_html) =>
                            setEditing((current) => {
                              if (!current) return current;
                              const currentTranslations = productTranslations(current);
                              return {
                                ...current,
                                translations: {
                                  ...currentTranslations,
                                  [locale.value]: {
                                    ...currentTranslations[locale.value],
                                    detail_html,
                                  },
                                },
                              };
                            })
                          }
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
              <div className="rounded-2xl border border-border p-4">
                <AdminImageUploader
                  label={t("coverImage")}
                  value={editing.cover_image_url || ""}
                  onChange={(cover_image_url) => setEditing({ ...editing, cover_image_url })}
                  uploadPrefix="products/cover"
                  previewAlt={editing.product_name || t("coverImage")}
                  hint="Enter an image URL or choose an image from your computer."
                  clearLabel="Remove cover image"
                  chooseLabel="Choose cover image"
                  uploadingLabel="Uploading cover image..."
                />
              </div>

              <div className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-4">
                <div className="flex items-center justify-between">
                  <Label>{t("published")}</Label>
                  <Switch
                    checked={editing.published}
                    onCheckedChange={(v) => setEditing({ ...editing, published: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t("newProduct")}</Label>
                  <Switch
                    checked={editing.is_new}
                    onCheckedChange={(v) => setEditing({ ...editing, is_new: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t("popularProduct")}</Label>
                  <Switch
                    checked={editing.is_popular}
                    onCheckedChange={(v) => setEditing({ ...editing, is_popular: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t("featuredProduct")}</Label>
                  <Switch
                    checked={editing.is_featured}
                    onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })}
                  />
                </div>
              </div>

              {/* Skin types & concerns — power Gippy AI recommendations.
                  Tag-style editor: type a value, press Add, remove via the X. */}
              <div className="grid gap-4 md:grid-cols-2">
                <ProductTagField
                  label="Skin types"
                  placeholder="e.g. Dry, Oily, Combination, Sensitive, All"
                  values={editing.skin_types ?? []}
                  onChange={(next) => setEditing({ ...editing, skin_types: next })}
                />
                <ProductTagField
                  label="Concerns"
                  placeholder="e.g. Hydration, Brightening, Anti-aging, Pores, Fragrance, Body care"
                  values={editing.concerns ?? []}
                  onChange={(next) => setEditing({ ...editing, concerns: next })}
                />
              </div>

              <div className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label>{t("mediaUrls")}</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addMedia}>
                    <Plus className="mr-1 h-3 w-3" />
                    {t("addMedia")}
                  </Button>
                </div>
                <div className="space-y-2">
                  {editing.media.map((m, idx) => (
                    <div key={idx} className="grid gap-2 md:grid-cols-[120px_1fr_1fr_40px]">
                      <Select
                        value={m.type}
                        onValueChange={(v) => {
                          const media = [...editing.media];
                          media[idx] = {
                            ...m,
                            type: v as ProductMedia["type"],
                          };
                          setEditing({ ...editing, media });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="URL"
                        value={m.url}
                        onChange={(e) => {
                          const media = [...editing.media];
                          media[idx] = { ...m, url: e.target.value };
                          setEditing({ ...editing, media });
                        }}
                      />
                      <Input
                        placeholder="Alt / memo"
                        value={m.alt || ""}
                        onChange={(e) => {
                          const media = [...editing.media];
                          media[idx] = { ...m, alt: e.target.value };
                          setEditing({ ...editing, media });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            media: editing.media.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label>{t("conditions")}</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addCondition}>
                    <Plus className="mr-1 h-3 w-3" />
                    {t("addCondition")}
                  </Button>
                </div>
                <div className="space-y-2">
                  {editing.conditions.map((c, idx) => (
                    <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_110px_40px]">
                      <Input
                        placeholder="Label"
                        value={c.label}
                        onChange={(e) => {
                          const conditions = [...editing.conditions];
                          conditions[idx] = { ...c, label: e.target.value };
                          setEditing({ ...editing, conditions });
                        }}
                      />
                      <Input
                        placeholder="Value"
                        value={c.value}
                        onChange={(e) => {
                          const conditions = [...editing.conditions];
                          conditions[idx] = { ...c, value: e.target.value };
                          setEditing({ ...editing, conditions });
                        }}
                      />
                      <div className="flex items-center justify-between rounded-md border px-3">
                        <Label>{t("showCondition")}</Label>
                        <Switch
                          checked={c.visible}
                          onCheckedChange={(v) => {
                            const conditions = [...editing.conditions];
                            conditions[idx] = { ...c, visible: v };
                            setEditing({ ...editing, conditions });
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            conditions: editing.conditions.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
