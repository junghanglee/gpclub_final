import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";
import gippyProductsHero from "@/assets/gippy-products-hero.png";
import { B2BInquiryDialog } from "@/components/site/B2BInquiryDialog";
import { ProductCardSkeletonGrid, ProductImageSkeleton } from "@/components/site/SectionSkeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CatalogProduct,
  getCoverImage,
  normalizeBrandText,
  productSearchText,
  useCatalogProducts,
} from "@/lib/catalog-products";
import { useI18n } from "@/lib/i18n";
import { usePageContent } from "@/lib/page-content";
import { sanitizeProductDetailHtml } from "@/lib/product-detail-html";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products - JMsolution, Jmella & Trois Touch | GPCLUB Vietnam" },
      {
        name: "description",
        content:
          "Review GPCLUB Vietnam product lineup for wholesale, reseller and B2B distribution opportunities.",
      },
      { property: "og:title", content: "K-Beauty Products — GPCLUB Vietnam" },
      {
        property: "og:description",
        content: "JMsolution, Jmella and Trois Touch B2B products.",
      },
    ],
  }),
  component: ProductsPage,
});

const productText = {
  vi: {
    products: "Products",
    introLink: "gửi yêu cầu B2B",
    introB: ".",
    search: "Search products, brands, product types...",
    empty: "Không có sản phẩm phù hợp với bộ lọc.",
    all: "Tất cả",
    allBrands: "Tất cả thương hiệu",
    new: "New",
    popular: "Popular",
    featured: "Featured",
    details: "Xem chi tiết",
    totalRegistered: "Tổng sản phẩm đã đăng",
    showing: "Đang hiển thị",
    brandFilter: "Thương hiệu",
    typeFilter: "Loại sản phẩm",
  },
  en: {
    products: "Products",
    introLink: "start a B2B inquiry",
    introB: ".",
    search: "Search products, brands, product types...",
    empty: "No products match your filters.",
    all: "All",
    allBrands: "All brands",
    new: "New",
    popular: "Popular",
    featured: "Featured",
    details: "View details",
    totalRegistered: "Total registered",
    showing: "Showing",
    brandFilter: "Brand",
    typeFilter: "Product type",
  },
};

function ProductsPage() {
  const { lang } = useI18n();
  const { content: page } = usePageContent("products");
  const t = productText[lang];
  const { rows, loading } = useCatalogProducts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [brand, setBrand] = useState("All");
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const brandOptions = useMemo(() => {
    const byKey = new Map<string, string>();
    rows.forEach((p) => {
      const label = p.brand_name.trim();
      if (!label) return;
      const key = normalizeBrandText(label);
      if (!byKey.has(key)) byKey.set(key, label);
    });
    return ["All", ...Array.from(byKey.values()).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(rows.map((p) => p.product_type.trim()).filter(Boolean)));
    return ["All", ...types.sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((p) => {
      const key = normalizeBrandText(p.brand_name);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [rows]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((p) => counts.set(p.product_type, (counts.get(p.product_type) || 0) + 1));
    return counts;
  }, [rows]);

  const filtered = useMemo(() => {
    const normalizedQuery = q.trim().toLowerCase();
    const normalizedBrand = normalizeBrandText(brand);
    return rows.filter((p) => {
      if (cat !== "All" && p.product_type !== cat) return false;
      if (brand !== "All" && normalizeBrandText(p.brand_name) !== normalizedBrand) return false;
      if (normalizedQuery && !productSearchText(p).includes(normalizedQuery)) return false;
      return true;
    });
  }, [rows, q, cat, brand]);

  const showProductShells = loading && filtered.length === 0;

  const openInquiry = () => {
    if (!selected) return;
    setInquiryOpen(true);
  };

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-36 right-[-12%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-accent/50 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-12 lg:px-10">
          <div className="text-center lg:col-span-7 lg:text-left">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {page.kicker[lang]}
            </div>
            <h1 className="mt-5 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              {page.title[lang]}{" "}
              <span className="bg-gradient-pink bg-clip-text text-transparent">
                {page.highlight[lang]}
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-[16px] leading-relaxed text-foreground/75 lg:mx-0">
              {page.description[lang]}{" "}
              <Link to="/b2b" className="font-bold text-primary underline-offset-4 hover:underline">
                {page.primaryCta[lang] || t.introLink}
              </Link>
              {t.introB}
            </p>
          </div>
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <img
              src={gippyProductsHero}
              alt="Gippy AI product consultant mascot holding cosmetics"
              loading="eager"
              decoding="async"
              className="aspect-[3/4] max-h-[414px] w-full max-w-[311px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
          <div className="grid gap-3 lg:grid-cols-[auto_180px_220px_1fr] lg:items-center">
            <div className="text-sm font-bold text-foreground">
              {t.totalRegistered}: <span className="text-primary">{rows.length}</span>
              <span className="ml-3 text-muted-foreground">
                {t.showing}: {filtered.length}
              </span>
            </div>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger>
                <SelectValue placeholder={t.brandFilter} />
              </SelectTrigger>
              <SelectContent>
                {brandOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b === "All"
                      ? `${t.allBrands} (${rows.length})`
                      : `${b} (${brandCounts.get(normalizeBrandText(b)) || 0})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger>
                <SelectValue placeholder={t.typeFilter} />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "All" ? `${t.all} (${rows.length})` : `${c} (${typeCounts.get(c) || 0})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.search}
                maxLength={60}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {showProductShells ? (
          <ProductCardSkeletonGrid />
        ) : filtered.length === 0 ? (
          <ProductEmptyGrid message={t.empty} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className={`group overflow-hidden rounded-2xl border bg-card text-left transition hover:-translate-y-1 hover:shadow-soft ${
                  p.is_featured ? "border-primary/50 ring-2 ring-primary/10" : "border-border/60"
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {getCoverImage(p) ? (
                    <img
                      src={getCoverImage(p)}
                      alt={p.product_name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ProductImageSkeleton />
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                    {p.is_new ? (
                      <Badge className="gap-1 bg-primary text-primary-foreground">
                        <Sparkles className="h-3 w-3" />
                        {t.new}
                      </Badge>
                    ) : null}
                    {p.is_popular ? (
                      <Badge className="gap-1 bg-foreground text-background">
                        <Star className="h-3 w-3" />
                        {t.popular}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-gold">
                      {p.brand_name}
                    </div>
                    <Badge variant="secondary" className="max-w-[45%] truncate text-[10px]">
                      {p.product_type}
                    </Badge>
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-medium">{p.product_name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.short_intro}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                    {t.details}{" "}
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden p-0">
          {selected ? (
            <>
              <div className="border-b bg-gradient-luxe px-6 py-5">
                <DialogHeader>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{selected.brand_name}</Badge>
                    <Badge variant="outline">{selected.product_type}</Badge>
                  </div>
                  <DialogTitle className="pr-8 text-2xl leading-tight md:text-3xl">
                    {selected.product_name}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-foreground/70">
                    {selected.short_intro}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="max-h-[72vh] overflow-y-auto p-6">
                <div className="grid gap-6 md:grid-cols-[280px_1fr]">
                  <aside className="space-y-4">
                    {getCoverImage(selected) ? (
                      <img
                        src={getCoverImage(selected)}
                        alt={selected.product_name}
                        className="aspect-square w-full rounded-3xl border bg-muted object-cover shadow-soft"
                      />
                    ) : (
                      <div className="aspect-square w-full overflow-hidden rounded-3xl border bg-muted shadow-soft">
                        <ProductImageSkeleton />
                      </div>
                    )}
                    <div className="rounded-2xl border bg-muted/25 p-4">
                      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Product summary
                      </div>
                      <dl className="grid gap-3 text-sm">
                        <div>
                          <dt className="font-semibold text-foreground">Brand</dt>
                          <dd className="text-muted-foreground">{selected.brand_name}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-foreground">Category</dt>
                          <dd className="text-muted-foreground">{selected.product_type}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.is_new ? <Badge>{t.new}</Badge> : null}
                      {selected.is_popular ? <Badge variant="secondary">{t.popular}</Badge> : null}
                      {selected.is_featured ? <Badge variant="outline">{t.featured}</Badge> : null}
                    </div>
                  </aside>
                  <main className="space-y-5">
                    {selected.detail_html ? (
                      <div
                        className="space-y-4 text-sm leading-7 text-foreground/80 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-black [&_h3]:text-foreground [&_li]:mb-1.5 [&_section]:rounded-2xl [&_section]:border [&_section]:bg-card [&_section]:p-5 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeProductDetailHtml(selected.detail_html),
                        }}
                      />
                    ) : (
                      <div className="rounded-2xl border bg-card p-5 text-sm leading-7 text-muted-foreground">
                        {selected.short_intro}
                      </div>
                    )}
                    {selected.conditions?.filter((c) => c.visible).length ? (
                      <div className="rounded-2xl border bg-card p-5">
                        <h3 className="mb-3 text-lg font-black">Additional information</h3>
                        <div className="grid gap-2 text-sm">
                          {selected.conditions
                            .filter((c) => c.visible)
                            .map((c, idx) => (
                              <div
                                key={`${c.label}-${idx}`}
                                className="flex justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                              >
                                <span className="font-semibold">{c.label}</span>
                                <span className="text-right text-muted-foreground">{c.value}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </main>
                </div>
                <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5 text-center md:text-left">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-black text-foreground">
                        Interested in this product?
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Send a B2B inquiry to GPCLUB Vietnam and discuss wholesale, reseller or
                        distribution opportunities.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={openInquiry}
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-primary/90"
                    >
                      Register B2B inquiry <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <B2BInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        product={
          selected
            ? {
                brandName: selected.brand_name,
                productName: selected.product_name,
                productType: selected.product_type,
                imageUrl: getCoverImage(selected) || undefined,
              }
            : null
        }
        source="Product detail popup"
        defaultMessage={
          selected
            ? `I am interested in B2B opportunities for ${selected.brand_name} - ${selected.product_name}.`
            : ""
        }
        title="Register B2B inquiry without leaving this product"
      />
    </>
  );
}

function ProductEmptyGrid({ message }: { message: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-dashed border-border bg-card text-left"
        >
          <div className="relative aspect-square overflow-hidden bg-muted">
            <ProductImageSkeleton />
          </div>
          <div className="p-4">
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
