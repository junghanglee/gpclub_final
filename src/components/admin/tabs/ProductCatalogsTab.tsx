import { Download, Eye, Pencil, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type ADMIN_I18N, type AdminLang, tx } from "@/components/admin/admin-i18n";
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
import { supabase } from "@/integrations/supabase/client";
import { type CatalogProduct, getCoverImage, normalizedSearchText } from "@/lib/catalog-products";
import {
  createCatalogId,
  fetchProductCatalogs,
  type ProductCatalog,
  saveProductCatalogs,
} from "@/lib/product-catalogs";

type CatalogProductWithBrand = CatalogProduct & {
  brands?: { id: string; name: string } | Array<{ id: string; name: string }> | null;
};

type CatalogBrandOption = {
  id: string;
  name: string;
};

function displayBrandName(product: CatalogProductWithBrand) {
  if (product.brand_display_name) return product.brand_display_name;
  const joinedBrand = Array.isArray(product.brands) ? product.brands[0] : product.brands;
  return joinedBrand?.name || product.brand_name;
}

function emptyCatalog(rows: CatalogProduct[]): ProductCatalog {
  const now = new Date().toISOString();
  return {
    id: createCatalogId(),
    title: "GPCLUB Vietnam Product Catalog",
    subtitle: "Curated K-Beauty portfolio for B2B partners",
    description: "A printable catalog generated from products registered in Product Management.",
    template: "premium",
    product_ids: [],
    is_representative: false,
    created_at: now,
    updated_at: now,
  };
}

export default function ProductCatalogsAdminTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<ProductCatalog[]>([]);
  const [products, setProducts] = useState<CatalogProductWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCatalog | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    const [catalogResult, productResult] = await Promise.allSettled([
      fetchProductCatalogs(),
      supabase
        .from("admin_products")
        .select("*,brands(id,name)")
        .order("sort_order", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    if (catalogResult.status === "rejected") toast.error(String(catalogResult.reason));
    else setRows(catalogResult.value);
    if (productResult.status === "rejected") toast.error(String(productResult.reason));
    else if (productResult.value.error) toast.error(productResult.value.error.message);
    else setProducts((productResult.value.data || []) as CatalogProductWithBrand[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedProductMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const brands = useMemo(() => {
    const byId = new Map<string, CatalogBrandOption>();
    products.forEach((product) => {
      if (!product.brand_id) return;
      byId.set(product.brand_id, {
        id: product.brand_id,
        name: displayBrandName(product),
      });
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);
  const productTypes = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((product) => product.product_type).filter(Boolean))),
    ],
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = normalizedSearchText(productSearch);
    return products.filter((product) => {
      const brandMatch = brandFilter === "All" || product.brand_id === brandFilter;
      const typeMatch = typeFilter === "All" || product.product_type === typeFilter;
      const searchMatch =
        !query ||
        normalizedSearchText(
          [
            displayBrandName(product),
            product.product_name,
            product.product_type,
            product.short_intro,
          ].join(" "),
        ).includes(query);
      return brandMatch && typeMatch && searchMatch;
    });
  }, [brandFilter, productSearch, products, typeFilter]);

  const startNew = () => {
    setProductSearch("");
    setBrandFilter("All");
    setTypeFilter("All");
    setEditing(emptyCatalog(products));
    setOpen(true);
  };

  const toggleProduct = (productId: string, checked: boolean) => {
    if (!editing) return;
    const productIds = checked
      ? Array.from(new Set([...editing.product_ids, productId]))
      : editing.product_ids.filter((id) => id !== productId);
    setEditing({ ...editing, product_ids: productIds });
  };

  const setSelectedProducts = (productIds: string[]) => {
    if (!editing) return;
    setEditing({ ...editing, product_ids: Array.from(new Set(productIds)) });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error(t("catalogTitle"));
      return;
    }
    if (editing.product_ids.length === 0) {
      toast.error(t("selectedProducts"));
      return;
    }
    const payload: ProductCatalog = {
      ...editing,
      title: editing.title.trim(),
      subtitle: editing.subtitle.trim(),
      description: editing.description.trim(),
      product_ids: editing.product_ids,
      is_representative: editing.is_representative,
      updated_at: new Date().toISOString(),
    };
    const nextRows = rows.some((row) => row.id === payload.id)
      ? rows.map((row) => (row.id === payload.id ? payload : row))
      : [payload, ...rows];
    try {
      await saveProductCatalogs(
        payload.is_representative
          ? nextRows.map((row) => ({
              ...row,
              is_representative: row.id === payload.id,
            }))
          : nextRows,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return;
    }
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    await load();
  };

  const setRepresentative = async (row: ProductCatalog) => {
    try {
      await saveProductCatalogs(
        rows.map((item) => ({
          ...item,
          is_representative: item.id === row.id,
        })),
      );
      toast.success(t("representativeCatalog"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const remove = async (row: ProductCatalog) => {
    if (!confirm(t("deleteCatalogConfirm"))) return;
    try {
      await saveProductCatalogs(rows.filter((item) => item.id !== row.id));
      toast.success(t("delete"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const openCatalog = (id: string) =>
    window.open(`/catalog/${id}`, "_blank", "noopener,noreferrer");

  const templateLabel = (template: ProductCatalog["template"]) => {
    if (template === "compact") return t("compactTemplate");
    if (template === "lineup") return t("lineupTemplate");
    return t("premiumTemplate");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black">{t("productCatalogs")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate printable PDF catalogs from registered Product Management items.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
          <Button onClick={startNew}>
            <Plus className="mr-1 h-4 w-4" /> {t("newCatalog")}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCatalogs")}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("catalogTitle")}</TableHead>
                <TableHead>{t("catalogTemplate")}</TableHead>
                <TableHead>{t("selectedProducts")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("edit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-semibold">{row.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{row.subtitle}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{templateLabel(row.template)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{row.product_ids.length} products</div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {row.product_ids
                        .map((id) => selectedProductMap.get(id)?.product_name)
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.is_representative ? (
                      <Badge className="gap-1 bg-primary text-primary-foreground">
                        <Star className="h-3 w-3" /> {t("representativeCatalog")}
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRepresentative(row)}>
                        <Star className="mr-1 h-3.5 w-3.5" /> {t("setRepresentative")}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openCatalog(row.id)}
                      title={t("preview")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openCatalog(row.id)}
                      title={t("downloadPdf")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(row);
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("catalogManagement") : t("newCatalog")}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("catalogTitle")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("catalogSubtitle")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.subtitle}
                    onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t("catalogDescription")}</Label>
                <Textarea
                  className="mt-1.5"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("catalogTemplate")}</Label>
                <Select
                  value={editing.template}
                  onValueChange={(value) =>
                    setEditing({
                      ...editing,
                      template: value as ProductCatalog["template"],
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">{t("premiumTemplate")}</SelectItem>
                    <SelectItem value="compact">{t("compactTemplate")}</SelectItem>
                    <SelectItem value="lineup">{t("lineupTemplate")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div>
                  <Label>{t("representativeCatalog")}</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Main hero catalog download button will use this catalog.
                  </p>
                </div>
                <Switch
                  checked={editing.is_representative}
                  onCheckedChange={(v) => setEditing({ ...editing, is_representative: v })}
                />
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label>{t("selectedProducts")}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Filter products, then bulk-select the current result.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {editing.product_ids.length} / {products.length}
                  </Badge>
                </div>
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={t("searchProducts")}
                  />
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">{t("allBrands")}</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "All" ? t("allTypes") : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProducts(products.map((product) => product.id))}
                  >
                    {t("selectAll")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedProducts(filteredProducts.map((product) => product.id))
                    }
                  >
                    {t("selectFiltered")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProducts([])}
                  >
                    {t("clearSelected")}
                  </Button>
                  <Badge variant="outline" className="px-3">
                    {filteredProducts.length} shown
                  </Badge>
                </div>
                <div className="grid max-h-[460px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {filteredProducts.map((product) => {
                    const image = getCoverImage(product);
                    return (
                      <label
                        key={product.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3 transition hover:bg-muted/40"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-primary"
                          checked={editing.product_ids.includes(product.id)}
                          onChange={(e) => toggleProduct(product.id, e.target.checked)}
                        />
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {image ? (
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-primary">
                            {displayBrandName(product)}
                          </span>
                          <span className="mt-1 block font-semibold">{product.product_name}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {product.product_type}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={save}>{t("save")}</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
